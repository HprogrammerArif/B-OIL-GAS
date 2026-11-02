import { format } from "date-fns";
import { bn, enUS } from "date-fns/locale";
import { atTime, businessDaysInRange, dateKey, daysBetween, parseDateKey } from "@/lib/calendar";
import { toBengaliDigits } from "@/lib/i18n/format";
import type { RoleKey } from "@/types/domain/identity";
import type { CreateLeaveRequest, LeaveBalance, LeaveCode, LeaveRequestDetail, LeaveRequestItem, LeaveType, LeavePolicy } from "@/types/domain/leave";
import { nowIso } from "../clock";
import { newId } from "../crypto";
import { nextRef } from "../db/refs";
import type { MockDb, MockLeaveRequest, MockLeaveType } from "../db/schema";
import { mockEvents } from "../events";
import { HttpError, policyViolation, validationError } from "../http";
import type { AuthContext } from "../router";
import { shiftFor } from "./attendance";
import { personRef, userForEmployee } from "./people";
import { LEAVE_POLICY, WORK_CALENDAR } from "./policy";
import { lineManagerStep, registerWorkflowHooks, startWorkflow, toWire, type StepSpec } from "./workflow";

export function leavePolicy(): LeavePolicy {
  return {
    weekendDays: WORK_CALENDAR.weekendDays,
    holidays: WORK_CALENDAR.holidays,
    maxConsecutiveCl: LEAVE_POLICY.maxConsecutiveCl,
    hrReviewAboveDays: LEAVE_POLICY.hrReviewAboveDays,
    backdateDays: LEAVE_POLICY.backdateDays,
    backdateTypes: LEAVE_POLICY.backdateTypes,
    reasonMin: LEAVE_POLICY.reasonMin,
    reasonMax: LEAVE_POLICY.reasonMax,
  };
}

export function leaveTypeWire(t: MockLeaveType): LeaveType {
  return {
    id: t.id, code: t.code, name: t.name, nameBn: t.nameBn, annualQuota: t.annualQuota,
    requiresDoc: t.requiresDoc, halfDayAllowed: t.halfDayAllowed, checksBalance: t.checksBalance,
  };
}

const yearOf = (date: string) => Number(date.slice(0, 4));

/** `available = entitled − used − pending`; pending holds days of requests still in review. */
export function balancesFor(db: MockDb, employeeId: string, year: number): LeaveBalance[] {
  return db.leaveBalances
    .filter((b) => b.employeeId === employeeId && b.year === year)
    .flatMap((b) => {
      const type = db.leaveTypes.find((t) => t.id === b.leaveTypeId);
      if (!type) return [];
      const pending = db.leaveRequests
        .filter((l) => l.employeeId === employeeId && l.leaveTypeId === type.id && l.status === "PENDING" && yearOf(l.startDate) === year)
        .reduce((sum, l) => sum + l.days, 0);
      return [{ leaveType: leaveTypeWire(type), year, entitled: b.entitled, used: b.used, pending, available: Math.max(0, b.entitled - b.used - pending) }];
    })
    .sort((a, b) => TYPE_ORDER.indexOf(a.leaveType.code) - TYPE_ORDER.indexOf(b.leaveType.code));
}

const TYPE_ORDER: LeaveCode[] = ["CL", "SL", "EL", "ML", "PL", "LWP"];

export function countLeaveDays(start: string, end: string, halfDay: unknown): number {
  if (halfDay) return 0.5;
  return businessDaysInRange(start, end, WORK_CALENDAR).length;
}

export function requestWire(db: MockDb, l: MockLeaveRequest): LeaveRequestItem {
  const type = db.leaveTypes.find((t) => t.id === l.leaveTypeId);
  return {
    id: l.id,
    refNo: l.refNo,
    employee: personRef(db, l.employeeId),
    leaveType: { id: l.leaveTypeId, code: type?.code ?? "CL", name: type?.name ?? "", nameBn: type?.nameBn ?? "" },
    startDate: l.startDate,
    endDate: l.endDate,
    halfDay: l.halfDay,
    days: l.days,
    reason: l.reason,
    status: l.status,
    isInformed: l.isInformed,
    createdAt: l.createdAt,
    reviewedBy: l.reviewedById ? personRef(db, l.reviewedById) : null,
    reviewedAt: l.reviewedAt,
    workflowInstanceId: l.workflowInstanceId,
  };
}

/** PENDING → CANCELLED any time; APPROVED → CANCELLED only before the start date (doc 06 §11.3). */
export function canCancel(l: MockLeaveRequest, employeeId: string, today = dateKey()): boolean {
  return l.employeeId === employeeId && (l.status === "PENDING" || (l.status === "APPROVED" && l.startDate > today));
}

export function detailWire(db: MockDb, l: MockLeaveRequest, auth: AuthContext): LeaveRequestDetail {
  const inst = l.workflowInstanceId ? db.workflow.find((w) => w.id === l.workflowInstanceId) : undefined;
  return {
    ...requestWire(db, l),
    cancelReason: l.cancelReason,
    workflow: inst ? toWire(db, inst, auth) : null,
    viewer: { isOwner: l.employeeId === auth.employee.id, canCancel: canCancel(l, auth.employee.id) },
  };
}

/** `LEAVE_REQUEST` template (doc 06 §11.6). HR cannot review their own leave, so their HR step is dropped (BR-10-12). */
export function leaveSteps(db: MockDb, employeeId: string, code: LeaveCode, days: number, roles: RoleKey[]): StepSpec[] {
  const steps: StepSpec[] = [];
  const lm = lineManagerStep(db, employeeId, LEAVE_POLICY.lineManagerSlaHours);
  if (!lm) return steps;
  steps.push(lm);
  const needsHr = days > LEAVE_POLICY.hrReviewAboveDays || LEAVE_POLICY.hrReviewTypes.includes(code);
  if (needsHr && lm.role !== "HR_ADMIN" && !roles.includes("HR_ADMIN")) {
    steps.push({ key: "HR_REVIEW", name: "HR review", nameBn: "এইচআর পর্যালোচনা", role: "HR_ADMIN", slaHours: LEAVE_POLICY.hrSlaHours });
  }
  return steps;
}

/** BR-10-11: informed when filed before the start date, or sick leave filed within 2 h of the shift start. */
export function isInformed(db: MockDb, employeeId: string, code: LeaveCode, startDate: string, now: Date = new Date()): boolean {
  const today = dateKey(now);
  if (startDate > today) return true;
  if (startDate < today) return false;
  if (code !== "SL") return false;
  const cutoff = atTime(today, shiftFor(db, employeeId).startTime).getTime() + 2 * 3_600_000;
  return now.getTime() <= cutoff;
}

function daysLabel(days: number): [string, string] {
  if (days === 0.5) return ["Half day", "অর্ধ দিন"];
  return [days === 1 ? "1 day" : `${days} days`, `${toBengaliDigits(String(days))} দিন`];
}

function rangeLabel(start: string, end: string): [string, string] {
  const s = parseDateKey(start);
  const e = parseDateKey(end);
  const en = start === end ? format(s, "d MMM", { locale: enUS }) : `${format(s, "d MMM", { locale: enUS })} – ${format(e, "d MMM", { locale: enUS })}`;
  const bnText = start === end ? format(s, "d MMM", { locale: bn }) : `${format(s, "d MMM", { locale: bn })} – ${format(e, "d MMM", { locale: bn })}`;
  return [en, toBengaliDigits(bnText)];
}

function emitStatus(db: MockDb, l: MockLeaveRequest): void {
  const emp = db.employees.find((e) => e.id === l.employeeId);
  const to = [userForEmployee(db, l.employeeId)?.id, emp?.lineManager ? userForEmployee(db, emp.lineManager.id)?.id : undefined];
  mockEvents.emit("leave:status", to.filter((x): x is string => !!x), { leaveRequestId: l.id, status: l.status });
  mockEvents.emit("attendance:punch", [], { employeeId: l.employeeId, siteId: emp?.site.id ?? null });
}

function adjustUsed(db: MockDb, l: MockLeaveRequest, delta: number): void {
  const year = yearOf(l.startDate);
  let balance = db.leaveBalances.find((b) => b.employeeId === l.employeeId && b.leaveTypeId === l.leaveTypeId && b.year === year);
  if (!balance) {
    balance = { employeeId: l.employeeId, leaveTypeId: l.leaveTypeId, year, entitled: 0, used: 0 };
    db.leaveBalances.push(balance);
  }
  balance.used = Math.max(0, Math.round((balance.used + delta) * 10) / 10);
}

function approve(db: MockDb, l: MockLeaveRequest, reviewerId: string | null): void {
  l.status = "APPROVED";
  l.reviewedById = reviewerId;
  l.reviewedAt = nowIso();
  l.updatedAt = l.reviewedAt;
  adjustUsed(db, l, l.days);
}

/** Validates (doc 03 §16.2, BR-10-10) and files a request; returns it PENDING with its workflow, or APPROVED for the chairman. */
export function createLeave(db: MockDb, auth: AuthContext, body: CreateLeaveRequest & { attachmentFileId?: string }, now: Date = new Date()): MockLeaveRequest {
  const me = auth.employee.id;
  const type = db.leaveTypes.find((t) => t.id === body.leaveTypeId);
  if (!type) throw validationError("leaveTypeId", "Choose a leave type");
  if (body.endDate < body.startDate) throw validationError("endDate", "End date must be on or after the start date");
  const today = dateKey(now);
  if (body.startDate < today) {
    const allowed = LEAVE_POLICY.backdateTypes.includes(type.code) && daysBetween(body.startDate, today) <= LEAVE_POLICY.backdateDays;
    if (!allowed) throw validationError("startDate", `Only sick or unpaid leave can start up to ${LEAVE_POLICY.backdateDays} days in the past`);
  }
  if (body.halfDay && (body.startDate !== body.endDate || !type.halfDayAllowed)) {
    throw validationError("halfDay", "Half-day leave is only for a single day of casual or sick leave");
  }
  const days = countLeaveDays(body.startDate, body.endDate, body.halfDay);
  if (days === 0) throw validationError("startDate", "The selected dates are all weekends or holidays");
  if (type.code === "CL" && days > LEAVE_POLICY.maxConsecutiveCl) {
    throw policyViolation("MAX_CONSECUTIVE_CL", `Casual leave is limited to ${LEAVE_POLICY.maxConsecutiveCl} consecutive days`);
  }
  if (type.checksBalance) {
    const balance = balancesFor(db, me, yearOf(body.startDate)).find((b) => b.leaveType.id === type.id);
    if (!balance) throw policyViolation("NOT_ELIGIBLE", "This leave type is not available to you");
    if (days > balance.available) {
      const message = `Only ${balance.available} day(s) of ${type.name.toLowerCase()} left`;
      throw new HttpError("POLICY_VIOLATION", message, [{ rule: "INSUFFICIENT_BALANCE", message, available: balance.available }]);
    }
  }
  if (type.requiresDoc && days > LEAVE_POLICY.docRequiredAboveDays && !body.attachmentFileId) {
    throw validationError("attachmentFileId", "Attach a supporting document");
  }
  const overlap = db.leaveRequests.find(
    (l) => l.employeeId === me && (l.status === "PENDING" || l.status === "APPROVED") && l.startDate <= body.endDate && body.startDate <= l.endDate,
  );
  if (overlap) throw new HttpError("CONFLICT", "You already have leave on these dates", [{ rule: "OVERLAP", refNo: overlap.refNo }]);

  const at = nowIso();
  const l: MockLeaveRequest = {
    id: newId("lv"),
    refNo: nextRef(db, "LV", 3),
    employeeId: me,
    leaveTypeId: type.id,
    startDate: body.startDate,
    endDate: body.endDate,
    halfDay: body.halfDay,
    days,
    reason: body.reason,
    status: "PENDING",
    isInformed: isInformed(db, me, type.code, body.startDate, now),
    reviewedById: null,
    reviewedAt: null,
    cancelReason: null,
    createdAt: at,
    updatedAt: at,
    workflowInstanceId: null,
  };
  db.leaveRequests.unshift(l);

  const steps = leaveSteps(db, me, type.code, days, auth.user.roles);
  if (!steps.length) {
    approve(db, l, null);
  } else {
    const [dLabel, dLabelBn] = daysLabel(days);
    const [range, rangeBn] = rangeLabel(l.startDate, l.endDate);
    const inst = startWorkflow(db, {
      objectType: "LeaveRequest",
      objectId: l.id,
      initiatorEmployeeId: me,
      summary: {
        refNo: l.refNo,
        title: `${type.name} — ${dLabel} (${range})`,
        titleBn: `${type.nameBn} — ${dLabelBn} (${rangeBn})`,
        details: body.reason,
        detailsBn: body.reason,
        amount: null,
        quantityLabel: `${dLabel} · ${type.name.toLowerCase()}`,
        quantityLabelBn: `${dLabelBn} · ${type.nameBn}`,
        urgency: daysBetween(today, l.startDate) <= 1 ? "HIGH" : "NORMAL",
        category: "LEAVE",
      },
      steps,
    });
    l.workflowInstanceId = inst.id;
  }
  emitStatus(db, l);
  return l;
}

/** Requester cancel: approved leave gives the days back (doc 06 §11.3). PENDING goes through workflow WITHDRAW instead. */
export function cancelApprovedLeave(db: MockDb, l: MockLeaveRequest, reason: string | null): void {
  l.status = "CANCELLED";
  l.cancelReason = reason;
  l.updatedAt = nowIso();
  adjustUsed(db, l, -l.days);
  emitStatus(db, l);
}

function settle(db: MockDb, objectId: string, apply: (l: MockLeaveRequest) => void): void {
  const l = db.leaveRequests.find((x) => x.id === objectId);
  if (!l || l.status !== "PENDING") return;
  apply(l);
  l.updatedAt = nowIso();
  emitStatus(db, l);
}

registerWorkflowHooks("LeaveRequest", {
  noReturn: true,
  initiatorRoute: (inst) => `/leave/${inst.objectId}`,
  onApproved: ({ db, instance, actorEmployeeId }) => {
    settle(db, instance.objectId, (l) => approve(db, l, actorEmployeeId));
    return null;
  },
  onRejected: ({ db, instance, actorEmployeeId }) =>
    settle(db, instance.objectId, (l) => {
      l.status = "REJECTED";
      l.reviewedById = actorEmployeeId;
      l.reviewedAt = nowIso();
    }),
  onWithdrawn: ({ db, instance, comment }) =>
    settle(db, instance.objectId, (l) => {
      l.status = "CANCELLED";
      l.cancelReason = comment;
    }),
});
