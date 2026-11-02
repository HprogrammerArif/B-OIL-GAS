import type { ModuleKey, RoleKey } from "@/types/domain/identity";
import type {
  ActionRequest,
  InboxItem,
  WorkflowInstance,
  WorkflowObjectType,
} from "@/types/domain/workflow";
import { ms, nowIso } from "../clock";
import { newId, sha256 } from "../crypto";
import type { MockDb, MockUser, MockWfInstance, MockWfStep } from "../db/schema";
import { mockEvents } from "../events";
import { forbidden, HttpError, invalidTransition, policyViolation, validationError } from "../http";
import { hasGrant, type AuthContext } from "../router";
import { ROLE_NAMES, ROLE_NAMES_BN } from "../seed/rbac";
import { notify } from "./notify";
import { verifyOtp } from "./otp";
import { personRef, userForEmployee, usersWithRole } from "./people";

/* ─── Module hooks (doc 00 §6.1: modules react to workflow outcomes) ─── */

export interface HookContext {
  db: MockDb;
  instance: MockWfInstance;
  actorEmployeeId: string;
  comment: string | null;
}

export interface WorkflowHooks {
  onStepApproved?(ctx: HookContext & { step: MockWfStep }): void;
  /** Returns a reference the module produced (voucher, pass number…). */
  onApproved?(ctx: HookContext): string | null;
  onRejected?(ctx: HookContext): void;
  onReturned?(ctx: HookContext): void;
  onWithdrawn?(ctx: HookContext): void;
}

const hooks = new Map<WorkflowObjectType, WorkflowHooks>();

export function registerWorkflowHooks(type: WorkflowObjectType, h: WorkflowHooks): void {
  hooks.set(type, h);
}

export const MODULE_OF: Record<WorkflowObjectType, ModuleKey> = {
  NoteSheet: "note-sheets",
  Claim: "claims",
  Requisition: "fleet",
  LeaveRequest: "leave",
  AssetRequisition: "assets",
  Visit: "visitors",
};

/* ─── Templates → steps ─── */

export interface StepSpec {
  key: string;
  name: string;
  nameBn: string;
  role?: RoleKey;
  employeeId?: string;
  slaHours: number;
  requiresSignature?: boolean;
}

function buildStep(spec: StepSpec, stepNo: number): MockWfStep {
  return {
    id: newId("wfs"),
    stepNo,
    key: spec.key,
    name: spec.name,
    nameBn: spec.nameBn,
    approverRole: spec.employeeId ? null : (spec.role ?? null),
    approverEmployeeId: spec.employeeId ?? null,
    slaHours: spec.slaHours,
    requiresSignature: spec.requiresSignature ?? false,
    status: "WAITING",
    decision: null,
    comment: null,
    activatedAt: null,
    dueAt: null,
    decidedAt: null,
    decidedByEmployeeId: null,
    signatureHash: null,
  };
}

function activate(step: MockWfStep, at: string): void {
  step.status = "ACTIVE";
  step.activatedAt = at;
  step.dueAt = new Date(new Date(at).getTime() + step.slaHours * ms.HOUR).toISOString();
}

export function activeStep(inst: MockWfInstance): MockWfStep | undefined {
  return inst.steps.find((s) => s.status === "ACTIVE");
}

export function approverUsers(db: MockDb, step: MockWfStep): MockUser[] {
  if (step.approverEmployeeId) {
    const u = userForEmployee(db, step.approverEmployeeId);
    return u ? [u] : [];
  }
  return step.approverRole ? usersWithRole(db, step.approverRole) : [];
}

export function isStepApprover(auth: AuthContext, step: MockWfStep): boolean {
  if (step.approverEmployeeId) return step.approverEmployeeId === auth.employee.id;
  return !!step.approverRole && auth.user.roles.includes(step.approverRole);
}

/** Steps a user may act on: assigned to them and not their own request (rule SELF_APPROVAL). */
export function isAssignedTo(auth: AuthContext, inst: MockWfInstance): boolean {
  const step = activeStep(inst);
  return inst.status === "IN_REVIEW" && !!step && isStepApprover(auth, step) && inst.initiatorEmployeeId !== auth.employee.id;
}

function pendingNotification(db: MockDb, inst: MockWfInstance, step: MockWfStep): void {
  const requester = personRef(db, inst.initiatorEmployeeId);
  notify(
    db,
    approverUsers(db, step).filter((u) => u.employeeId !== inst.initiatorEmployeeId).map((u) => u.id),
    {
      type: step.requiresSignature ? "NOTE_SHEET_SIGN_REQUIRED" : "APPROVAL_PENDING",
      priority: inst.summary.urgency === "CRITICAL" ? "HIGH" : "NORMAL",
      category: "APPROVALS",
      title: `Approval needed: ${inst.summary.refNo}`,
      titleBn: `অনুমোদন প্রয়োজন: ${inst.summary.refNo}`,
      body: `${inst.summary.title} — from ${requester.name}`,
      bodyBn: `${inst.summary.titleBn} — ${requester.nameBn}`,
      data: { module: "approvals", objectType: "WorkflowInstance", objectId: inst.id, route: `/approvals/${inst.id}` },
    },
  );
  mockEvents.emit("inbox:changed", approverUsers(db, step).map((u) => u.id), { delta: 1, instanceId: inst.id });
}

export interface StartSpec {
  objectType: WorkflowObjectType;
  objectId: string;
  initiatorEmployeeId: string;
  summary: MockWfInstance["summary"];
  steps: StepSpec[];
}

/** Materialises an instance, activates step 1 and notifies its approvers. */
export function startWorkflow(db: MockDb, spec: StartSpec): MockWfInstance {
  const at = nowIso();
  const inst: MockWfInstance = {
    id: newId("wfi"),
    objectType: spec.objectType,
    objectId: spec.objectId,
    status: "IN_REVIEW",
    initiatorEmployeeId: spec.initiatorEmployeeId,
    summary: spec.summary,
    submittedAt: at,
    completedAt: null,
    steps: spec.steps.map((s, i) => buildStep(s, i + 1)),
    actions: [
      { id: newId("wfa"), type: "SUBMIT", stepNo: null, actorEmployeeId: spec.initiatorEmployeeId, comment: null, details: null, at },
    ],
  };
  const first = inst.steps[0];
  if (first) {
    activate(first, at);
    pendingNotification(db, inst, first);
  } else {
    inst.status = "APPROVED";
    inst.completedAt = at;
  }
  db.workflow.unshift(inst);
  return inst;
}

/** Re-runs a RETURNED instance after the initiator edits it (doc 03 RETURN semantics). */
export function resubmitWorkflow(db: MockDb, inst: MockWfInstance, summary: Partial<MockWfInstance["summary"]>, steps: StepSpec[]): void {
  const at = nowIso();
  inst.summary = { ...inst.summary, ...summary };
  inst.status = "IN_REVIEW";
  inst.completedAt = null;
  inst.steps = steps.map((s, i) => buildStep(s, i + 1));
  inst.actions.push({ id: newId("wfa"), type: "SUBMIT", stepNo: null, actorEmployeeId: inst.initiatorEmployeeId, comment: "Resubmitted", details: null, at });
  const first = inst.steps[0];
  if (first) {
    activate(first, at);
    pendingNotification(db, inst, first);
  }
}

/* ─── Actions ─── */

function participants(db: MockDb, inst: MockWfInstance): string[] {
  const ids = new Set<string>();
  const initiator = userForEmployee(db, inst.initiatorEmployeeId);
  if (initiator) ids.add(initiator.id);
  inst.steps.forEach((s) => approverUsers(db, s).forEach((u) => ids.add(u.id)));
  return [...ids];
}

function decidedNotification(db: MockDb, inst: MockWfInstance, actorEmployeeId: string, kind: "APPROVED" | "REJECTED" | "RETURNED", comment: string | null) {
  const actor = personRef(db, actorEmployeeId);
  const verb = { APPROVED: ["approved", "অনুমোদিত"], REJECTED: ["rejected", "প্রত্যাখ্যাত"], RETURNED: ["returned for correction", "সংশোধনের জন্য ফেরত"] }[kind];
  notify(db, [userForEmployee(db, inst.initiatorEmployeeId)?.id], {
    type: kind === "RETURNED" ? "APPROVAL_RETURNED" : "APPROVAL_DECIDED",
    priority: kind === "APPROVED" ? "NORMAL" : "HIGH",
    category: "APPROVALS",
    title: `${inst.summary.refNo} ${verb[0]}`,
    titleBn: `${inst.summary.refNo} ${verb[1]}`,
    body: comment ? `${actor.name}: ${comment}` : `${inst.summary.title} — ${actor.name}`,
    bodyBn: comment ? `${actor.nameBn}: ${comment}` : `${inst.summary.titleBn} — ${actor.nameBn}`,
    data: { module: MODULE_OF[inst.objectType], objectType: inst.objectType, objectId: inst.objectId, route: `/approvals/${inst.id}` },
  });
}

function assertCanDecide(db: MockDb, auth: AuthContext, inst: MockWfInstance): MockWfStep {
  const step = activeStep(inst);
  if (inst.status !== "IN_REVIEW" || !step) {
    const last = [...inst.steps].reverse().find((s) => s.decidedByEmployeeId);
    throw new HttpError("INVALID_STATE_TRANSITION", "This item has already been decided", [
      { reason: "ALREADY_DECIDED", decidedBy: last?.decidedByEmployeeId ? personRef(db, last.decidedByEmployeeId).name : null },
    ]);
  }
  if (!hasGrant(auth, "workflow:act") || !isStepApprover(auth, step)) throw forbidden("You are not the approver for this step");
  if (inst.initiatorEmployeeId === auth.employee.id) {
    throw policyViolation("SELF_APPROVAL", "You cannot approve your own request");
  }
  return step;
}

export async function performAction(db: MockDb, auth: AuthContext, inst: MockWfInstance, req: ActionRequest): Promise<string | null> {
  const at = nowIso();
  const me = auth.employee.id;
  const comment = req.comment?.trim() || null;
  const ctx: HookContext = { db, instance: inst, actorEmployeeId: me, comment };
  const h = hooks.get(inst.objectType) ?? {};
  let reference: string | null = null;

  switch (req.type) {
    case "APPROVE": {
      const step = assertCanDecide(db, auth, inst);
      if (step.requiresSignature) {
        await verifyOtp(db, auth.user.id, `wf:${inst.id}`, req.signature?.otpCode);
        const prev = [...inst.steps].reverse().find((s) => s.signatureHash)?.signatureHash ?? "GENESIS";
        step.signatureHash = await sha256(`${inst.id}|${step.stepNo}|${me}|${at}|${prev}`);
      }
      Object.assign(step, { status: "COMPLETED", decision: "APPROVED", comment, decidedAt: at, decidedByEmployeeId: me });
      inst.actions.push({ id: newId("wfa"), type: "APPROVE", stepNo: step.stepNo, actorEmployeeId: me, comment, details: null, at });
      h.onStepApproved?.({ ...ctx, step });
      const next = inst.steps.find((s) => s.status === "WAITING");
      if (next) {
        activate(next, at);
        pendingNotification(db, inst, next);
      } else {
        inst.status = "APPROVED";
        inst.completedAt = at;
        reference = h.onApproved?.(ctx) ?? null;
        decidedNotification(db, inst, me, "APPROVED", comment);
      }
      break;
    }
    case "REJECT":
    case "RETURN": {
      const step = assertCanDecide(db, auth, inst);
      if (!comment || comment.length < 10) throw validationError("comment", "Please explain the decision (at least 10 characters)");
      const decision = req.type === "REJECT" ? "REJECTED" : "RETURNED";
      Object.assign(step, { status: "COMPLETED", decision, comment, decidedAt: at, decidedByEmployeeId: me });
      inst.steps.filter((s) => s.status === "WAITING").forEach((s) => (s.status = "SKIPPED"));
      inst.status = decision;
      inst.completedAt = at;
      inst.actions.push({ id: newId("wfa"), type: req.type, stepNo: step.stepNo, actorEmployeeId: me, comment, details: req.details ?? null, at });
      if (decision === "REJECTED") h.onRejected?.(ctx);
      else h.onReturned?.(ctx);
      decidedNotification(db, inst, me, decision, comment);
      break;
    }
    case "COMMENT": {
      const isParticipant = inst.initiatorEmployeeId === me || inst.steps.some((s) => isStepApprover(auth, s));
      if (!isParticipant) throw forbidden();
      if (!comment) throw validationError("comment", "Comment is required");
      if (inst.status !== "IN_REVIEW") throw invalidTransition("Comments are closed on decided items");
      inst.actions.push({ id: newId("wfa"), type: "COMMENT", stepNo: activeStep(inst)?.stepNo ?? null, actorEmployeeId: me, comment, details: null, at });
      break;
    }
    case "WITHDRAW": {
      if (inst.initiatorEmployeeId !== me) throw forbidden("Only the requester can withdraw");
      if (inst.status !== "IN_REVIEW" && inst.status !== "RETURNED") throw invalidTransition("This item can no longer be withdrawn");
      inst.steps.filter((s) => s.status === "ACTIVE" || s.status === "WAITING").forEach((s) => (s.status = "SKIPPED"));
      inst.status = "WITHDRAWN";
      inst.completedAt = at;
      inst.actions.push({ id: newId("wfa"), type: "WITHDRAW", stepNo: null, actorEmployeeId: me, comment, details: null, at });
      h.onWithdrawn?.(ctx);
      break;
    }
  }

  const step = activeStep(inst);
  mockEvents.emit("approval:updated", participants(db, inst), {
    instanceId: inst.id,
    objectType: inst.objectType,
    objectId: inst.objectId,
    status: inst.status,
    currentStepNo: step?.stepNo ?? null,
    action: { type: req.type, actorId: me, at },
  });
  return reference;
}

/* ─── Wire mapping ─── */

export function slaHoursLeft(dueAt: string | null): number {
  if (!dueAt) return 0;
  return Math.round(((new Date(dueAt).getTime() - Date.now()) / ms.HOUR) * 10) / 10;
}

export function wireSummary(db: MockDb, inst: MockWfInstance) {
  return { ...inst.summary, requester: personRef(db, inst.initiatorEmployeeId) };
}

export function toWire(db: MockDb, inst: MockWfInstance, auth: AuthContext): WorkflowInstance {
  const isInitiator = inst.initiatorEmployeeId === auth.employee.id;
  return {
    id: inst.id,
    objectType: inst.objectType,
    objectId: inst.objectId,
    status: inst.status,
    summary: wireSummary(db, inst),
    initiator: personRef(db, inst.initiatorEmployeeId),
    submittedAt: inst.submittedAt,
    completedAt: inst.completedAt,
    currentStepNo: activeStep(inst)?.stepNo ?? null,
    steps: inst.steps.map((s) => {
      const approver = s.approverEmployeeId ? personRef(db, s.approverEmployeeId) : null;
      return {
        id: s.id,
        stepNo: s.stepNo,
        key: s.key,
        name: s.name,
        nameBn: s.nameBn,
        approver,
        approverLabel: approver?.name ?? (s.approverRole ? ROLE_NAMES[s.approverRole] : ""),
        approverLabelBn: approver?.nameBn ?? (s.approverRole ? ROLE_NAMES_BN[s.approverRole] : ""),
        status: s.status,
        decision: s.decision,
        comment: s.comment,
        activatedAt: s.activatedAt,
        dueAt: s.dueAt,
        decidedAt: s.decidedAt,
        decidedBy: s.decidedByEmployeeId ? personRef(db, s.decidedByEmployeeId) : null,
        requiresSignature: s.requiresSignature,
        signatureHash: s.signatureHash,
      };
    }),
    actions: inst.actions.map((a) => ({
      id: a.id,
      type: a.type,
      stepNo: a.stepNo,
      actor: a.actorEmployeeId ? personRef(db, a.actorEmployeeId) : null,
      comment: a.comment,
      details: a.details,
      at: a.at,
    })),
    viewer: {
      canAct: isAssignedTo(auth, inst) && hasGrant(auth, "workflow:act"),
      canWithdraw: isInitiator && (inst.status === "IN_REVIEW" || inst.status === "RETURNED"),
      isInitiator,
    },
  };
}

export function toInboxItem(db: MockDb, inst: MockWfInstance, readOnly: boolean): InboxItem | null {
  const step = activeStep(inst);
  if (!step?.activatedAt || !step.dueAt) return null;
  return {
    instanceId: inst.id,
    objectType: inst.objectType,
    objectId: inst.objectId,
    summary: wireSummary(db, inst),
    step: {
      stepNo: step.stepNo,
      key: step.key,
      name: step.name,
      nameBn: step.nameBn,
      activatedAt: step.activatedAt,
      dueAt: step.dueAt,
      slaHoursLeft: slaHoursLeft(step.dueAt),
      requiresSignature: step.requiresSignature,
    },
    submittedAt: inst.submittedAt,
    readOnly,
  };
}
