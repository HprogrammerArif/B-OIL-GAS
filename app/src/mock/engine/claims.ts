import { addDays, dateKey, daysBetween } from "@/lib/calendar";
import type {
  ClaimCategory,
  ClaimComputation,
  ClaimDetail,
  ClaimItem,
  ClaimLine,
  ClaimPolicy,
  ClaimStatus,
  ClaimType,
  CreateClaimRequest,
  PolicyFlag,
  TravelMode,
} from "@/types/domain/claims";
import { nowIso } from "../clock";
import { newId } from "../crypto";
import { nextRef } from "../db/refs";
import type { MockClaim, MockClaimLine, MockDb, MockEmployee } from "../db/schema";
import { HttpError, validationError } from "../http";
import type { AuthContext } from "../router";
import { personRef, userForEmployee } from "./people";
import { notify } from "./notify";
import { lineManagerStep, registerWorkflowHooks, resubmitWorkflow, startWorkflow, toWire, type StepSpec } from "./workflow";

/* ─── Policy (doc 06 BR-11-02, doc 03 §17.3) ─── */

interface BandPolicy {
  band: string;
  daDhaka: number;
  daDistrict: number;
  hotelCapPerNight: number | null;
  conveyanceMonthlyCap: number;
  mileageRatePerKm: number;
  allowedTravelModes: TravelMode[];
}

const BANDS: Record<string, BandPolicy> = {
  "G1-G2": { band: "G1–G2", daDhaka: 5000, daDistrict: 6000, hotelCapPerNight: null, conveyanceMonthlyCap: 50000, mileageRatePerKm: 18, allowedTravelModes: ["COMPANY_CAR", "DOMESTIC_AIR", "AC_TRAIN", "AC_BUS", "BUS", "TRAIN", "FIRST_CLASS_TRAIN", "CNG", "RIDE_SHARE", "RICKSHAW", "POOL_CAR"] },
  "G3-G4": { band: "G3–G4", daDhaka: 3500, daDistrict: 4500, hotelCapPerNight: 8000, conveyanceMonthlyCap: 25000, mileageRatePerKm: 18, allowedTravelModes: ["COMPANY_CAR", "DOMESTIC_AIR", "AC_TRAIN"] },
  "G5-G6": { band: "G5–G6", daDhaka: 2500, daDistrict: 3200, hotelCapPerNight: 5500, conveyanceMonthlyCap: 15000, mileageRatePerKm: 18, allowedTravelModes: ["POOL_CAR", "AC_TRAIN", "AC_BUS"] },
  "G7-G8": { band: "G7–G8", daDhaka: 1500, daDistrict: 2000, hotelCapPerNight: 3000, conveyanceMonthlyCap: 8000, mileageRatePerKm: 18, allowedTravelModes: ["AC_BUS", "FIRST_CLASS_TRAIN", "CNG", "RIDE_SHARE"] },
  "G9-G10": { band: "G9–G10", daDhaka: 800, daDistrict: 1200, hotelCapPerNight: 1800, conveyanceMonthlyCap: 5000, mileageRatePerKm: 18, allowedTravelModes: ["BUS", "TRAIN", "CNG", "RICKSHAW"] },
};

/** Seed grades (E10…S2) mapped onto the policy bands of BR-11-02; Finance confirms the mapping (doc 06 D-13). */
export function bandFor(gradeCode: string): BandPolicy {
  const letter = gradeCode.charAt(0);
  const n = Number(gradeCode.slice(1));
  if (letter === "E") return (n >= 9 ? BANDS["G1-G2"] : BANDS["G3-G4"]) as BandPolicy;
  if (letter === "M" || (letter === "O" && n >= 5)) return BANDS["G5-G6"] as BandPolicy;
  if (letter === "O") return BANDS["G7-G8"] as BandPolicy;
  return BANDS["G9-G10"] as BandPolicy;
}

export const CLAIM_RULES = {
  receiptRequiredAbove: 500,
  declarationMaxAmount: 1000,
  declarationCategories: ["RICKSHAW", "CNG", "MEALS"] as ClaimCategory[],
  halfDayPct: 50,
  mileageMaxKmPerLine: 300,
  submitWithinDays: 60,
  startWithinDays: 90,
  maxPeriodDays: 30,
  maxLines: 60,
  purposeMin: 5,
  purposeMax: 300,
};

const DA_ALLOWED: Record<ClaimType, ClaimCategory[]> = {
  TADA: ["HOTEL", "TRANSPORT", "FUEL", "MEALS", "RICKSHAW", "CNG", "RIDE_SHARE", "MILEAGE", "OTHER"],
  CONVEYANCE: ["TRANSPORT", "FUEL", "MEALS", "RICKSHAW", "CNG", "RIDE_SHARE", "MILEAGE", "OTHER"],
};

const PREFIX: Record<ClaimType, string> = { TADA: "TADA", CONVEYANCE: "CNV" };

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
const monthOf = (date: string) => date.slice(0, 7);
const isDhaka = (destination: string | null) => !!destination && /dhaka|ঢাকা/i.test(destination);

function eachDay(start: string, end: string): string[] {
  const days: string[] = [];
  for (let d = start; d <= end && days.length < 400; d = addDays(d, 1)) days.push(d);
  return days;
}

/** Month-to-date conveyance already approved or paid for the claimant (doc 03 §17.3), excluding `excludeId`. */
export function conveyanceUsed(db: MockDb, employeeId: string, month: string, excludeId?: string): number {
  return db.claims
    .filter((c) => c.claimantId === employeeId && c.type === "CONVEYANCE" && monthOf(c.periodStart) === month && c.id !== excludeId && (c.status === "APPROVED" || c.status === "SETTLED"))
    .reduce((sum, c) => sum + c.totalAmount, 0);
}

export function policyWire(db: MockDb, emp: MockEmployee, today = dateKey()): ClaimPolicy {
  const p = bandFor(emp.grade.code);
  return {
    band: p.band,
    daDhaka: money(p.daDhaka),
    daDistrict: money(p.daDistrict),
    halfDayPct: CLAIM_RULES.halfDayPct,
    hotelCapPerNight: p.hotelCapPerNight === null ? null : money(p.hotelCapPerNight),
    conveyanceMonthlyCap: money(p.conveyanceMonthlyCap),
    conveyanceUsedMonth: money(conveyanceUsed(db, emp.id, monthOf(today))),
    mileageRatePerKm: money(p.mileageRatePerKm),
    allowedTravelModes: p.allowedTravelModes,
    receiptRequiredAbove: money(CLAIM_RULES.receiptRequiredAbove),
    declarationMaxAmount: money(CLAIM_RULES.declarationMaxAmount),
    declarationCategories: CLAIM_RULES.declarationCategories,
    submitWithinDays: CLAIM_RULES.submitWithinDays,
  };
}

/* ─── Computation (BR-11-03…09, 11, 12) ─── */

export interface Computed {
  lines: MockClaimLine[];
  flags: PolicyFlag[];
  totalAmount: number;
  policyAmount: number;
  blocked: boolean;
}

function validateShape(body: CreateClaimRequest, today: string): void {
  if (body.purpose.trim().length < CLAIM_RULES.purposeMin) throw validationError("purpose", "errors:min5");
  if (body.periodEnd < body.periodStart) throw validationError("periodEnd", "End date must be on or after the start date");
  if (daysBetween(body.periodStart, body.periodEnd) + 1 > CLAIM_RULES.maxPeriodDays) {
    throw validationError("periodEnd", `A claim can cover at most ${CLAIM_RULES.maxPeriodDays} days`);
  }
  if (daysBetween(body.periodStart, today) > CLAIM_RULES.startWithinDays) {
    throw validationError("periodStart", `The period must start within the last ${CLAIM_RULES.startWithinDays} days`);
  }
  if (body.type === "CONVEYANCE" && monthOf(body.periodStart) !== monthOf(body.periodEnd)) {
    throw validationError("periodEnd", "A conveyance claim must stay within one calendar month");
  }
  if (body.type === "TADA" && !body.destination?.trim()) throw validationError("destination", "errors:required");
  if (body.lines.length > CLAIM_RULES.maxLines) throw validationError("lines", `At most ${CLAIM_RULES.maxLines} lines`);
}

export function computeClaim(db: MockDb, emp: MockEmployee, body: CreateClaimRequest, opts: { excludeId?: string; today?: string } = {}): Computed {
  const today = opts.today ?? dateKey();
  validateShape(body, today);
  const policy = bandFor(emp.grade.code);
  const flags: PolicyFlag[] = [];
  const lines: MockClaimLine[] = [];
  const allowed = DA_ALLOWED[body.type];

  body.lines.forEach((l, i) => {
    if (!allowed.includes(l.category)) throw validationError(`lines.${i}.category`, "This expense type is not allowed on this claim");
    if (!l.description.trim()) throw validationError(`lines.${i}.description`, "errors:required");
    let amount = Number(l.amount ?? 0);
    if (l.category === "MILEAGE") {
      if (!l.distanceKm || l.distanceKm <= 0) throw validationError(`lines.${i}.distanceKm`, "errors:required");
      if (!l.fromPlace?.trim() || !l.toPlace?.trim()) throw validationError(`lines.${i}.fromPlace`, "errors:required");
      amount = Math.round(l.distanceKm * policy.mileageRatePerKm * 100) / 100;
    }
    if (!Number.isFinite(amount) || amount <= 0) throw validationError(`lines.${i}.amount`, "errors:invalidAmount");
    lines.push({
      id: newId("cln"),
      date: l.date,
      category: l.category,
      description: l.description.trim(),
      fromPlace: l.fromPlace?.trim() || null,
      toPlace: l.toPlace?.trim() || null,
      distanceKm: l.category === "MILEAGE" ? (l.distanceKm ?? null) : null,
      amount,
      isDeclaration: !!l.isDeclaration,
      receiptFileId: l.receiptFileId ?? null,
    });
  });

  // BR-11-03: DA lines are system-generated, one per calendar day. A single-day trip earns the half-day rate.
  let daTotal = 0;
  if (body.type === "TADA") {
    const rate = isDhaka(body.destination ?? null) ? policy.daDhaka : policy.daDistrict;
    const days = eachDay(body.periodStart, body.periodEnd);
    const perDay = days.length === 1 ? Math.round((rate * CLAIM_RULES.halfDayPct) / 100) : rate;
    days.forEach((date) => {
      daTotal += perDay;
      lines.unshift({ id: newId("cln"), date, category: "DA", description: isDhaka(body.destination ?? null) ? "Daily allowance — Dhaka" : "Daily allowance — district", fromPlace: null, toPlace: null, distanceKm: null, amount: perDay, isDeclaration: true, receiptFileId: null });
    });
  }

  const flag = (f: PolicyFlag) => flags.push(f);
  for (const l of lines) {
    if (l.category === "DA") continue;
    if (l.date < body.periodStart || l.date > body.periodEnd) {
      flag({ lineId: l.id, rule: "DATE_OUTSIDE_PERIOD", severity: "BLOCK", message: "A line is dated outside the claim period" });
    }
    const declared = l.isDeclaration && CLAIM_RULES.declarationCategories.includes(l.category) && l.amount <= CLAIM_RULES.declarationMaxAmount;
    const needsReceipt = l.category === "HOTEL" || (l.category !== "MILEAGE" && l.amount > CLAIM_RULES.receiptRequiredAbove && !declared);
    if (needsReceipt && !l.receiptFileId) {
      flag({ lineId: l.id, rule: "RECEIPT_REQUIRED", severity: "BLOCK", message: "A receipt is required for this line", params: { description: l.description } });
    }
    if (l.category === "MILEAGE" && (l.distanceKm ?? 0) > CLAIM_RULES.mileageMaxKmPerLine) {
      flag({ lineId: l.id, rule: "MILEAGE_LONG", severity: "WARN", message: "Long mileage line; Finance will review", params: { km: l.distanceKm ?? 0 } });
    }
    const dup = db.claims.some(
      (c) => c.claimantId === emp.id && c.id !== opts.excludeId && c.status !== "REJECTED" && c.status !== "CANCELLED" &&
        c.lines.some((x) => x.date === l.date && x.category === l.category && x.amount === l.amount),
    );
    if (dup) flag({ lineId: l.id, rule: "DUPLICATE_LINE", severity: "WARN", message: "Same date, type and amount exists on another claim of yours", params: { description: l.description } });
  }

  const hotel = lines.filter((l) => l.category === "HOTEL").reduce((s, l) => s + l.amount, 0);
  const nights = Math.max(1, daysBetween(body.periodStart, body.periodEnd));
  let hotelAllowed = hotel;
  if (policy.hotelCapPerNight !== null && hotel > 0) {
    const cap = policy.hotelCapPerNight;
    hotelAllowed = Math.min(hotel, cap * nights);
    if (hotel / nights > cap * 2) flag({ lineId: null, rule: "HOTEL_CAP", severity: "BLOCK", message: "Hotel cost is more than twice the nightly cap", params: { cap, nights } });
    else if (hotel / nights > cap) flag({ lineId: null, rule: "HOTEL_CAP", severity: "WARN", message: "Hotel cost exceeds the nightly cap", params: { cap, nights } });
  }

  const totalAmount = lines.reduce((s, l) => s + l.amount, 0);
  const policyAmount = daTotal + hotelAllowed + lines.filter((l) => l.category !== "DA" && l.category !== "HOTEL").reduce((s, l) => s + l.amount, 0);

  if (body.type === "CONVEYANCE") {
    const used = conveyanceUsed(db, emp.id, monthOf(body.periodStart), opts.excludeId);
    if (used + totalAmount > policy.conveyanceMonthlyCap) {
      flag({ lineId: null, rule: "CONVEYANCE_MONTHLY_CAP", severity: "BLOCK", message: "Monthly conveyance cap exceeded", params: { cap: policy.conveyanceMonthlyCap, used, excess: Math.round((used + totalAmount - policy.conveyanceMonthlyCap) * 100) / 100 } });
    }
  }
  if (body.travelMode && !policy.allowedTravelModes.includes(body.travelMode)) {
    flag({ lineId: null, rule: "MODE_ABOVE_ENTITLEMENT", severity: "WARN", message: "Travel mode is above your entitlement; Finance decides", params: { mode: body.travelMode } });
  }
  const overlap = db.claims.find(
    (c) => c.claimantId === emp.id && c.id !== opts.excludeId && c.type === body.type && c.status !== "REJECTED" && c.status !== "CANCELLED" && c.status !== "RETURNED" &&
      c.periodStart <= body.periodEnd && body.periodStart <= c.periodEnd,
  );
  if (overlap) flag({ lineId: null, rule: "OVERLAPPING_PERIOD", severity: "BLOCK", message: "This period overlaps another claim of yours", params: { claimNo: overlap.claimNo } });
  if (daysBetween(body.periodEnd, today) > CLAIM_RULES.submitWithinDays) {
    flag({ lineId: null, rule: "LATE_SUBMISSION", severity: "BLOCK", message: "The period ended more than the allowed days ago", params: { days: CLAIM_RULES.submitWithinDays } });
  }
  if (!lines.some((l) => l.category !== "DA")) {
    flag({ lineId: null, rule: "NO_LINES", severity: "BLOCK", message: "Add at least one expense line" });
  }

  return { lines, flags, totalAmount: Math.round(totalAmount * 100) / 100, policyAmount: Math.round(policyAmount * 100) / 100, blocked: flags.some((f) => f.severity === "BLOCK") };
}

/* ─── Wire ─── */

export const lineWire = (l: MockClaimLine): ClaimLine => ({ ...l, amount: money(l.amount) });

export function computationWire(c: Computed): ClaimComputation {
  return { lines: c.lines.map(lineWire), totalAmount: money(c.totalAmount), policyAmount: money(c.policyAmount), policyFlags: c.flags, blocked: c.blocked };
}

export function itemWire(c: MockClaim): ClaimItem {
  return {
    id: c.id, claimNo: c.claimNo, type: c.type, purpose: c.purpose, destination: c.destination, periodStart: c.periodStart, periodEnd: c.periodEnd,
    status: c.status, totalAmount: money(c.totalAmount), policyAmount: money(c.policyAmount), createdAt: c.createdAt, workflowInstanceId: c.workflowInstanceId,
  };
}

export const canWithdraw = (c: MockClaim, employeeId: string): boolean =>
  c.claimantId === employeeId && (c.status === "PENDING_MANAGER" || c.status === "PENDING_FINANCE" || c.status === "RETURNED");

export function detailWire(db: MockDb, c: MockClaim, auth: AuthContext): ClaimDetail {
  const inst = c.workflowInstanceId ? db.workflow.find((w) => w.id === c.workflowInstanceId) : undefined;
  return {
    ...itemWire(c),
    claimant: personRef(db, c.claimantId),
    travelMode: c.travelMode,
    costCenter: c.costCenter,
    lines: c.lines.map(lineWire),
    policyFlags: c.policyFlags,
    voucherNo: c.voucherNo,
    workflow: inst ? toWire(db, inst, auth) : null,
    viewer: { isOwner: c.claimantId === auth.employee.id, canWithdraw: canWithdraw(c, auth.employee.id) },
  };
}

/* ─── Submit / resubmit ─── */

function stepsFor(db: MockDb, employeeId: string): StepSpec[] {
  const steps: StepSpec[] = [];
  const manager = lineManagerStep(db, employeeId, 24);
  if (manager) steps.push(manager);
  steps.push({ key: "FIN", name: "Finance verification", nameBn: "অর্থ বিভাগ যাচাই", role: "FINANCE", slaHours: 24 });
  return steps;
}

function summaryFor(c: MockClaim) {
  const travel = c.type === "TADA";
  const title = travel ? `Travel Expense Claim — ${c.destination ?? c.purpose}` : `Local Travel Expense Bill — ${c.purpose}`;
  const titleBn = travel ? `ভ্রমণ ব্যয় বিল — ${c.destination ?? c.purpose}` : `স্থানীয় যাতায়াত বিল — ${c.purpose}`;
  return {
    refNo: c.claimNo, title, titleBn, details: c.purpose, detailsBn: c.purpose,
    amount: money(c.totalAmount), quantityLabel: null, quantityLabelBn: null,
    urgency: c.totalAmount > 50_000 ? ("CRITICAL" as const) : ("NORMAL" as const), category: "CLAIMS" as const,
  };
}

function apply(c: MockClaim, body: CreateClaimRequest, computed: Computed): void {
  c.purpose = body.purpose.trim();
  c.destination = body.destination?.trim() || null;
  c.periodStart = body.periodStart;
  c.periodEnd = body.periodEnd;
  c.travelMode = body.travelMode ?? null;
  c.lines = computed.lines;
  c.policyFlags = computed.flags;
  c.totalAmount = computed.totalAmount;
  c.policyAmount = computed.policyAmount;
  c.updatedAt = nowIso();
}

function assertSubmittable(computed: Computed): void {
  if (!computed.blocked) return;
  const blocks = computed.flags.filter((f) => f.severity === "BLOCK");
  throw new HttpError("POLICY_VIOLATION", blocks[0]?.message ?? "This claim breaks a policy rule", blocks.map((f) => ({ rule: f.rule, message: f.message, lineId: f.lineId, ...f.params })));
}

export function submitClaim(db: MockDb, auth: AuthContext, body: CreateClaimRequest): MockClaim {
  const emp = auth.employee;
  const computed = computeClaim(db, emp, body);
  assertSubmittable(computed);
  const at = nowIso();
  const c: MockClaim = {
    id: newId("clm"), claimNo: nextRef(db, PREFIX[body.type], 4), claimantId: emp.id, type: body.type,
    purpose: "", destination: null, periodStart: body.periodStart, periodEnd: body.periodEnd, travelMode: null,
    costCenter: emp.department.code, status: "PENDING_MANAGER", lines: [], policyFlags: [], totalAmount: 0, policyAmount: 0,
    voucherNo: null, createdAt: at, updatedAt: at, workflowInstanceId: null,
  };
  apply(c, body, computed);
  db.claims.unshift(c);
  const inst = startWorkflow(db, { objectType: "Claim", objectId: c.id, initiatorEmployeeId: emp.id, summary: summaryFor(c), steps: stepsFor(db, emp.id) });
  c.workflowInstanceId = inst.id;
  c.status = inst.steps[0]?.key === "FIN" ? "PENDING_FINANCE" : "PENDING_MANAGER";
  return c;
}

const MAX_RESUBMITS = 3;

export function resubmitClaim(db: MockDb, auth: AuthContext, c: MockClaim, body: CreateClaimRequest): MockClaim {
  if (c.claimantId !== auth.employee.id) throw new HttpError("FORBIDDEN", "Only the claimant can resubmit");
  if (c.status !== "RETURNED") throw new HttpError("INVALID_STATE_TRANSITION", "Only a returned claim can be resubmitted");
  const inst = db.workflow.find((w) => w.id === c.workflowInstanceId);
  if (!inst) throw new HttpError("INVALID_STATE_TRANSITION", "This claim has no approval to restart");
  if (inst.actions.filter((a) => a.type === "SUBMIT").length > MAX_RESUBMITS) {
    throw new HttpError("POLICY_VIOLATION", `A claim can be resubmitted at most ${MAX_RESUBMITS} times`, [{ rule: "MAX_RESUBMITS", message: "Too many resubmissions" }]);
  }
  if (body.type !== c.type) throw validationError("type", "The claim type cannot change");
  const computed = computeClaim(db, auth.employee, body, { excludeId: c.id });
  assertSubmittable(computed);
  apply(c, body, computed);
  const steps = stepsFor(db, auth.employee.id);
  resubmitWorkflow(db, inst, summaryFor(c), steps);
  c.status = steps[0]?.key === "FIN" ? "PENDING_FINANCE" : "PENDING_MANAGER";
  return c;
}

/* ─── Workflow hooks ─── */

function settle(db: MockDb, objectId: string, status: ClaimStatus): MockClaim | undefined {
  const c = db.claims.find((x) => x.id === objectId);
  if (!c) return undefined;
  c.status = status;
  c.updatedAt = nowIso();
  return c;
}

function tell(db: MockDb, c: MockClaim, title: string, titleBn: string): void {
  notify(db, [userForEmployee(db, c.claimantId)?.id], {
    type: "CLAIM_STATUS", priority: "NORMAL", category: "APPROVALS", title: `${c.claimNo} ${title}`, titleBn: `${c.claimNo} ${titleBn}`,
    body: c.purpose, bodyBn: c.purpose, data: { module: "claims", objectType: "Claim", objectId: c.id, route: `/claims/${c.id}` },
  });
}

registerWorkflowHooks("Claim", {
  initiatorRoute: (inst) => `/claims/${inst.objectId}`,
  onStepApproved: ({ db, instance }) => {
    const c = db.claims.find((x) => x.id === instance.objectId);
    if (c && instance.steps.some((s) => s.status === "WAITING")) settle(db, c.id, "PENDING_FINANCE");
  },
  onApproved: ({ db, instance }) => {
    const c = settle(db, instance.objectId, "APPROVED");
    if (c) tell(db, c, "approved for payment", "পরিশোধের জন্য অনুমোদিত");
    return null;
  },
  onRejected: ({ db, instance }) => void settle(db, instance.objectId, "REJECTED"),
  onReturned: ({ db, instance }) => void settle(db, instance.objectId, "RETURNED"),
  onWithdrawn: ({ db, instance }) => void settle(db, instance.objectId, "CANCELLED"),
});
