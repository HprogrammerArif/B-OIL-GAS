import { z } from "zod";
import { dateKey } from "@/lib/calendar";
import { commit } from "../db";
import type { MockLeaveRequest } from "../db/schema";
import { canSeeEmployee } from "../engine/attendance";
import {
  balancesFor,
  cancelApprovedLeave,
  canCancel,
  createLeave,
  detailWire,
  leavePolicy,
  leaveTypeWire,
  requestWire,
} from "../engine/leave";
import { LEAVE_POLICY } from "../engine/policy";
import { isStepApprover, performAction } from "../engine/workflow";
import { forbidden, invalidTransition, notFound, ok, paginate } from "../http";
import { parse } from "../parse";
import { register, requireAuth, type AuthContext, type HandlerContext } from "../router";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

const createBody = z.object({
  leaveTypeId: z.string().min(1, "Choose a leave type").max(64),
  startDate: dateStr,
  endDate: dateStr,
  halfDay: z.enum(["FIRST", "SECOND"]).nullable(),
  reason: z.string().trim().min(LEAVE_POLICY.reasonMin, "errors:min5").max(LEAVE_POLICY.reasonMax),
  attachmentFileId: z.string().max(64).optional(),
});

const listQuery = z.object({
  scope: z.enum(["mine", "team"]).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
});

const cancelBody = z.object({ reason: z.string().trim().max(500).optional() }).nullish();

/** Owner, a workflow approver, or anyone `leave:read` reaches; others get 404 so ids do not leak. */
function readable(ctx: HandlerContext, auth: AuthContext, l: MockLeaveRequest): boolean {
  if (l.employeeId === auth.employee.id) return true;
  const inst = ctx.db.workflow.find((w) => w.id === l.workflowInstanceId);
  if (inst?.steps.some((s) => isStepApprover(auth, s) || s.decidedByEmployeeId === auth.employee.id)) return true;
  const owner = ctx.db.employees.find((e) => e.id === l.employeeId);
  return !!owner && canSeeEmployee(ctx, auth, "leave:read", owner);
}

function find(ctx: HandlerContext, auth: AuthContext): MockLeaveRequest {
  const l = ctx.db.leaveRequests.find((x) => x.id === ctx.params.id);
  if (!l || !readable(ctx, auth, l)) throw notFound("Leave request");
  return l;
}

register([
  { method: "GET", path: "/leave/types", handler: (ctx) => (requireAuth(ctx), ok(ctx.db.leaveTypes.map(leaveTypeWire))) },
  { method: "GET", path: "/leave/policy", handler: (ctx) => (requireAuth(ctx), ok(leavePolicy())) },
  {
    method: "GET",
    path: "/leave/balances",
    permission: ["leave:request", "leave:read"],
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const year = Number(ctx.query.year) || new Date().getFullYear();
      return ok(balancesFor(ctx.db, auth.employee.id, year));
    },
  },
  {
    method: "GET",
    path: "/leave/requests",
    permission: ["leave:request", "leave:read", "leave:approve"],
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const { scope = "mine", status } = parse(listQuery, ctx.query);
      const items = ctx.db.leaveRequests
        .filter((l) => {
          if (status && l.status !== status) return false;
          if (scope === "mine") return l.employeeId === auth.employee.id;
          const owner = ctx.db.employees.find((e) => e.id === l.employeeId);
          return !!owner && owner.id !== auth.employee.id && canSeeEmployee(ctx, auth, "leave:read", owner);
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((l) => requestWire(ctx.db, l));
      return paginate(items, ctx.query, 30);
    },
  },
  {
    method: "POST",
    path: "/leave/requests",
    permission: "leave:request",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const l = createLeave(ctx.db, auth, parse(createBody, ctx.body));
      commit();
      return ok(detailWire(ctx.db, l, auth), 201);
    },
  },
  {
    method: "GET",
    path: "/leave/requests/:id",
    permission: ["leave:request", "leave:read", "leave:approve"],
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      return ok(detailWire(ctx.db, find(ctx, auth), auth));
    },
  },
  {
    method: "POST",
    path: "/leave/requests/:id/cancel",
    permission: "leave:request",
    handler: async (ctx) => {
      const auth = requireAuth(ctx);
      const l = find(ctx, auth);
      if (l.employeeId !== auth.employee.id) throw forbidden("Only the requester can cancel");
      const body = parse(cancelBody, ctx.body);
      if (!canCancel(l, auth.employee.id, dateKey())) throw invalidTransition("This leave can no longer be cancelled");
      const inst = l.status === "PENDING" ? ctx.db.workflow.find((w) => w.id === l.workflowInstanceId) : undefined;
      if (inst) await performAction(ctx.db, auth, inst, { type: "WITHDRAW", comment: body?.reason });
      else cancelApprovedLeave(ctx.db, l, body?.reason ?? null);
      commit();
      return ok(detailWire(ctx.db, l, auth));
    },
  },
]);
