import { z } from "zod";
import { commit } from "../db";
import type { MockClaim } from "../db/schema";
import { canSeeEmployee } from "../engine/attendance";
import { canWithdraw, computationWire, computeClaim, detailWire, itemWire, policyWire, resubmitClaim, submitClaim } from "../engine/claims";
import { isStepApprover, performAction } from "../engine/workflow";
import { forbidden, invalidTransition, notFound, ok, paginate } from "../http";
import { parse } from "../parse";
import { register, requireAuth, type AuthContext, type HandlerContext } from "../router";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const CATEGORIES = ["DA", "HOTEL", "TRANSPORT", "FUEL", "MEALS", "RICKSHAW", "CNG", "RIDE_SHARE", "MILEAGE", "OTHER"] as const;
const MODES = ["AC_BUS", "BUS", "TRAIN", "AC_TRAIN", "FIRST_CLASS_TRAIN", "CNG", "RIDE_SHARE", "RICKSHAW", "POOL_CAR", "COMPANY_CAR", "DOMESTIC_AIR"] as const;

const lineSchema = z.object({
  date: dateStr,
  category: z.enum(CATEGORIES),
  description: z.string().trim().max(200),
  fromPlace: z.string().trim().max(80).nullish(),
  toPlace: z.string().trim().max(80).nullish(),
  distanceKm: z.number().positive().max(2000).nullish(),
  amount: z.string().regex(/^\d{1,9}(\.\d{1,2})?$/, "errors:invalidAmount").optional(),
  isDeclaration: z.boolean().optional(),
  receiptFileId: z.string().max(64).nullish(),
});

const claimBody = z.object({
  type: z.enum(["TADA", "CONVEYANCE"]),
  purpose: z.string().trim().min(5, "errors:min5").max(300),
  destination: z.string().trim().max(120).nullish(),
  periodStart: dateStr,
  periodEnd: dateStr,
  travelMode: z.enum(MODES).nullish(),
  lines: z.array(lineSchema).max(60),
});

const listQuery = z.object({
  status: z.enum(["DRAFT", "PENDING_MANAGER", "PENDING_FINANCE", "APPROVED", "RETURNED", "REJECTED", "SETTLED", "CANCELLED"]).optional(),
});

const withdrawBody = z.object({ reason: z.string().trim().max(500).optional() }).nullish();

/** Owner, a workflow approver, or anyone `claims:read` reaches; others get 404 so ids do not leak. */
function readable(ctx: HandlerContext, auth: AuthContext, c: MockClaim): boolean {
  if (c.claimantId === auth.employee.id) return true;
  const inst = ctx.db.workflow.find((w) => w.id === c.workflowInstanceId);
  if (inst?.steps.some((s) => isStepApprover(auth, s) || s.decidedByEmployeeId === auth.employee.id)) return true;
  const owner = ctx.db.employees.find((e) => e.id === c.claimantId);
  return !!owner && canSeeEmployee(ctx, auth, "claims:read", owner);
}

function find(ctx: HandlerContext, auth: AuthContext): MockClaim {
  const c = ctx.db.claims.find((x) => x.id === ctx.params.id);
  if (!c || !readable(ctx, auth, c)) throw notFound("Claim");
  return c;
}

function clean(body: z.infer<typeof claimBody>) {
  return { ...body, destination: body.destination ?? null, travelMode: body.travelMode ?? null, lines: body.lines.map((l) => ({ ...l })) };
}

register([
  { method: "GET", path: "/claims/policy", permission: "claims:read", handler: (ctx) => ok(policyWire(ctx.db, requireAuth(ctx).employee)) },
  {
    method: "POST",
    path: "/claims/compute",
    permission: "claims:create",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      return ok(computationWire(computeClaim(ctx.db, auth.employee, clean(parse(claimBody, ctx.body)))));
    },
  },
  {
    method: "GET",
    path: "/claims",
    permission: "claims:read",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const { status } = parse(listQuery, ctx.query);
      const items = ctx.db.claims
        .filter((c) => c.claimantId === auth.employee.id && (!status || c.status === status))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(itemWire);
      return paginate(items, ctx.query, 30);
    },
  },
  {
    method: "POST",
    path: "/claims",
    permission: "claims:create",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const c = submitClaim(ctx.db, auth, clean(parse(claimBody, ctx.body)));
      commit();
      return ok(detailWire(ctx.db, c, auth), 201);
    },
  },
  {
    method: "GET",
    path: "/claims/:id",
    permission: "claims:read",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      return ok(detailWire(ctx.db, find(ctx, auth), auth));
    },
  },
  {
    method: "POST",
    path: "/claims/:id/resubmit",
    permission: "claims:submit",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const c = resubmitClaim(ctx.db, auth, find(ctx, auth), clean(parse(claimBody, ctx.body)));
      commit();
      return ok(detailWire(ctx.db, c, auth));
    },
  },
  {
    method: "POST",
    path: "/claims/:id/withdraw",
    permission: "claims:create",
    handler: async (ctx) => {
      const auth = requireAuth(ctx);
      const c = find(ctx, auth);
      if (c.claimantId !== auth.employee.id) throw forbidden("Only the claimant can withdraw");
      if (!canWithdraw(c, auth.employee.id)) throw invalidTransition("This claim can no longer be withdrawn");
      const body = parse(withdrawBody, ctx.body);
      const inst = ctx.db.workflow.find((w) => w.id === c.workflowInstanceId);
      if (inst) await performAction(ctx.db, auth, inst, { type: "WITHDRAW", comment: body?.reason });
      else c.status = "CANCELLED";
      c.updatedAt = new Date().toISOString();
      commit();
      return ok(detailWire(ctx.db, c, auth));
    },
  },
]);

