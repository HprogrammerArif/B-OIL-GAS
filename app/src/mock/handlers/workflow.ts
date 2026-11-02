import { z } from "zod";
import { isMockApi } from "@/lib/env";
import type { ActionRequest, HistoryItem, InboxItem, InboxSummary, StepDecision } from "@/types/domain/workflow";
import { ms } from "../clock";
import { commit } from "../db";
import type { MockWfInstance } from "../db/schema";
import { issueOtp } from "../engine/otp";
import {
  activeStep,
  isAssignedTo,
  isStepApprover,
  performAction,
  toInboxItem,
  toWire,
  wireSummary,
} from "../engine/workflow";
import { forbidden, HttpError, matchesSearch, notFound, ok, paginate, policyViolation, validationError } from "../http";
import { can, register, requireAuth, type AuthContext, type HandlerContext } from "../router";

const CATEGORIES = ["PROCUREMENT", "CLAIMS", "FLEET", "LEAVE", "HR", "ASSETS", "VISITORS"] as const;

const inboxQuery = z.object({
  category: z.enum(CATEGORIES).optional(),
  q: z.string().trim().max(80).optional(),
  sla: z.enum(["breached", "12h", "24h"]).optional(),
  view: z.enum(["mine", "all"]).optional(),
  sort: z.enum(["dueAt", "-submittedAt", "-amount"]).optional(),
});

const actionBody = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("APPROVE"),
    comment: z.string().trim().max(1000).optional(),
    signature: z.object({ method: z.literal("TYPED"), otpCode: z.string().regex(/^\d{6}$/) }).optional(),
  }),
  z.object({
    type: z.enum(["REJECT", "RETURN"]),
    comment: z.string().trim().min(10).max(1000),
    details: z
      .object({ reasonCategory: z.string().trim().max(80).optional(), improvementsRequired: z.string().trim().max(1000).optional() })
      .optional(),
  }),
  z.object({ type: z.enum(["COMMENT", "WITHDRAW"]), comment: z.string().trim().max(1000).optional() }),
]);

const batchBody = z.object({
  instanceIds: z.array(z.string().min(1)).min(1).max(50),
  type: z.literal("APPROVE"),
  comment: z.string().trim().max(1000).optional(),
});

function findInstance(ctx: HandlerContext, id: string | undefined): MockWfInstance {
  const inst = ctx.db.workflow.find((w) => w.id === id);
  if (!inst) throw notFound("Approval");
  return inst;
}

/** Initiator, any step approver, or `workflow:view-all`; others get 404 so ids do not leak. */
function canRead(ctx: HandlerContext, auth: AuthContext, inst: MockWfInstance): boolean {
  return (
    inst.initiatorEmployeeId === auth.employee.id ||
    inst.steps.some((s) => isStepApprover(auth, s) || s.decidedByEmployeeId === auth.employee.id) ||
    can(ctx, "workflow:view-all")
  );
}

function inboxItems(ctx: HandlerContext, auth: AuthContext, view: "mine" | "all"): InboxItem[] {
  if (view === "all" && !can(ctx, "workflow:view-all")) throw forbidden();
  return ctx.db.workflow
    .filter((w) => w.status === "IN_REVIEW")
    .map((w) => {
      const mine = isAssignedTo(auth, w);
      if (view === "mine" && !mine) return null;
      return toInboxItem(ctx.db, w, !mine);
    })
    .filter((x): x is InboxItem => !!x);
}

function amountOf(item: InboxItem): number {
  return item.summary.amount ? Number(item.summary.amount) : 0;
}

function inbox(ctx: HandlerContext) {
  const auth = requireAuth(ctx);
  const parsed = inboxQuery.safeParse(ctx.query);
  if (!parsed.success) throw validationError("query", "Invalid filters");
  const { category, q, sla, view = "mine", sort = "dueAt" } = parsed.data;
  const items = inboxItems(ctx, auth, view)
    .filter((i) => !category || i.summary.category === category)
    .filter((i) =>
      matchesSearch(q, i.summary.title, i.summary.titleBn, i.summary.refNo, i.summary.requester.name, i.summary.requester.department),
    )
    .filter((i) => {
      if (!sla) return true;
      const left = i.step.slaHoursLeft;
      return sla === "breached" ? left <= 0 : sla === "12h" ? left < 12 : left < 24;
    })
    .sort((a, b) => {
      if (sort === "-amount") return amountOf(b) - amountOf(a);
      if (sort === "-submittedAt") return b.submittedAt.localeCompare(a.submittedAt);
      return a.step.dueAt.localeCompare(b.step.dueAt);
    });
  return paginate(items, ctx.query, 50);
}

register([
  { method: "GET", path: "/workflow/inbox", permission: "workflow:inbox", handler: inbox },
  { method: "GET", path: "/approvals/inbox", permission: "workflow:inbox", handler: inbox },
  {
    method: "GET",
    path: "/workflow/inbox/summary",
    permission: "workflow:inbox",
    handler: (ctx) => {
      const items = inboxItems(ctx, requireAuth(ctx), "mine");
      const body: InboxSummary = {
        pending: items.length,
        breachingIn12h: items.filter((i) => i.step.slaHoursLeft > 0 && i.step.slaHoursLeft < 12).length,
        breached: items.filter((i) => i.step.slaHoursLeft <= 0).length,
        totalAmount: items.reduce((sum, i) => sum + amountOf(i), 0).toFixed(2),
      };
      return ok(body);
    },
  },
  {
    method: "GET",
    path: "/workflow/history",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const me = auth.employee.id;
      const decision = ctx.query.decision as StepDecision | undefined;
      const items: HistoryItem[] = [];
      for (const w of ctx.db.workflow) {
        const mySteps = w.steps.filter((s) => s.decidedByEmployeeId === me && s.decision);
        const last = mySteps[mySteps.length - 1];
        if (last?.decision && last.decidedAt) {
          items.push({
            instanceId: w.id, objectType: w.objectType, summary: wireSummary(ctx.db, w), status: w.status,
            relation: "DECIDED", myDecision: last.decision, at: last.decidedAt,
          });
        } else if (w.initiatorEmployeeId === me) {
          items.push({
            instanceId: w.id, objectType: w.objectType, summary: wireSummary(ctx.db, w), status: w.status,
            relation: "INITIATED", myDecision: null, at: w.completedAt ?? w.submittedAt,
          });
        }
      }
      const filtered = items
        .filter((i) => !decision || i.myDecision === decision)
        .sort((a, b) => b.at.localeCompare(a.at));
      return paginate(filtered, ctx.query, 30);
    },
  },
  {
    method: "GET",
    path: "/workflow/instances/:id",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const inst = findInstance(ctx, ctx.params.id);
      if (!canRead(ctx, auth, inst)) throw notFound("Approval");
      return ok(toWire(ctx.db, inst, auth));
    },
  },
  {
    method: "POST",
    path: "/workflow/instances/:id/signature-otp",
    permission: "workflow:act",
    handler: async (ctx) => {
      const auth = requireAuth(ctx);
      const inst = findInstance(ctx, ctx.params.id);
      const step = activeStep(inst);
      if (!step || !isAssignedTo(auth, inst)) throw forbidden("You are not the approver for this step");
      if (!step.requiresSignature) throw policyViolation("OTP_NOT_REQUIRED", "This step does not need a signature");
      const recent = ctx.db.otps.filter((o) => o.userId === auth.user.id && o.expiresAt > Date.now() - 5 * ms.MINUTE);
      if (recent.length >= 3) throw new HttpError("RATE_LIMITED", "Too many codes requested. Try again shortly.");
      const { code, expiresAt } = await issueOtp(ctx.db, auth.user.id, `wf:${inst.id}`);
      commit();
      return ok({ expiresAt, ...(isMockApi ? { demoCode: code } : {}) });
    },
  },
  {
    method: "POST",
    path: "/workflow/instances/:id/actions",
    handler: async (ctx) => {
      const auth = requireAuth(ctx);
      const parsed = actionBody.safeParse(ctx.body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw validationError(String(issue?.path[0] ?? "body"), issue?.message ?? "Invalid action");
      }
      const inst = findInstance(ctx, ctx.params.id);
      if (!canRead(ctx, auth, inst)) throw notFound("Approval");
      const reference = await performAction(ctx.db, auth, inst, parsed.data as ActionRequest);
      commit();
      return ok({ instance: toWire(ctx.db, inst, auth), reference });
    },
  },
  {
    method: "POST",
    path: "/workflow/instances/batch-actions",
    permission: "workflow:act",
    handler: async (ctx) => {
      const auth = requireAuth(ctx);
      const parsed = batchBody.safeParse(ctx.body);
      if (!parsed.success) throw validationError("instanceIds", "Select between 1 and 50 items");
      const results = [];
      for (const id of parsed.data.instanceIds) {
        const inst = ctx.db.workflow.find((w) => w.id === id);
        try {
          if (!inst || !canRead(ctx, auth, inst)) throw notFound("Approval");
          if (activeStep(inst)?.requiresSignature) {
            throw policyViolation("SIGNATURE_REQUIRED", "Needs an individual signature");
          }
          await performAction(ctx.db, auth, inst, { type: "APPROVE", comment: parsed.data.comment });
          results.push({ instanceId: id, ok: true });
        } catch (err) {
          const e = err instanceof HttpError ? err : new HttpError("INTERNAL", "Failed");
          results.push({ instanceId: id, ok: false, error: { code: e.code, message: e.message } });
        }
      }
      commit();
      return ok({ results });
    },
  },
]);
