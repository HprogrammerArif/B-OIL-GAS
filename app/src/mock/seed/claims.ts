import { addDays, dateKey } from "@/lib/calendar";
import type { ClaimCategory, ClaimStatus, ClaimType } from "@/types/domain/claims";
import { hoursFromNow } from "../clock";
import type { MockClaim, MockClaimLine, MockDb, MockWfInstance } from "../db/schema";
import { bandFor } from "../engine/claims";
import { empId } from "./org";

const line = (id: string, date: string, category: ClaimCategory, description: string, amount: number, receipt: boolean, extra: Partial<MockClaimLine> = {}): MockClaimLine => ({
  id, date, category, description, fromPlace: null, toPlace: null, distanceKm: null, amount,
  isDeclaration: !receipt && ["CNG", "RICKSHAW", "MEALS", "DA"].includes(category), receiptFileId: receipt ? `seed_receipt_${id}` : null, ...extra,
});

function statusOf(inst: MockWfInstance): ClaimStatus {
  switch (inst.status) {
    case "APPROVED": return "APPROVED";
    case "REJECTED": return "REJECTED";
    case "RETURNED": return "RETURNED";
    case "WITHDRAWN": return "CANCELLED";
    default: return inst.steps.find((s) => s.status === "ACTIVE")?.stepNo === 1 ? "PENDING_MANAGER" : "PENDING_FINANCE";
  }
}

function build(db: MockDb, inst: MockWfInstance, type: ClaimType): MockClaim {
  const emp = db.employees.find((e) => e.id === inst.initiatorEmployeeId);
  const policy = bandFor(emp?.grade.code ?? "O4");
  const amount = Number(inst.summary.amount ?? 0);
  const end = addDays(dateKey(new Date(inst.submittedAt)), -1);
  const lines: MockClaimLine[] = [];
  let start: string;
  let destination: string | null = null;
  const id = inst.objectId;

  if (type === "TADA") {
    start = addDays(end, -3);
    destination = /chattogram/i.test(inst.summary.title) ? "Chattogram" : "Dhaka";
    const rate = destination === "Dhaka" ? policy.daDhaka : policy.daDistrict;
    const days = 4;
    for (let i = 0; i < days; i++) lines.push(line(`${id}_da${i}`, addDays(start, i), "DA", "Daily allowance", rate, false));
    const rest = Math.max(amount - rate * days, 0);
    const hotel = Math.round(rest * 0.6);
    lines.push(line(`${id}_h`, start, "HOTEL", "Hotel (VAT receipt attached)", hotel, true));
    lines.push(line(`${id}_t`, start, "TRANSPORT", "Bus tickets", rest - hotel, true, { fromPlace: "Dhaka", toPlace: destination }));
  } else {
    start = addDays(end, -2);
    const a = Math.round(amount * 0.2);
    const b = Math.round(amount * 0.35);
    lines.push(line(`${id}_1`, start, "CNG", "CNG fare — client visit", a, false));
    lines.push(line(`${id}_2`, addDays(start, 2), "RIDE_SHARE", "Ride-share — dealer follow-up", b, id !== "clm_cnv_0961"));
    lines.push(line(`${id}_3`, addDays(start, 2), "RIDE_SHARE", "Ride-share — dealer follow-up", amount - a - b, id !== "clm_cnv_0961"));
  }
  const claimNo = inst.summary.refNo;
  return {
    id, claimNo, claimantId: inst.initiatorEmployeeId, type, purpose: inst.summary.details, destination, periodStart: start, periodEnd: end,
    travelMode: null, costCenter: emp?.department.code ?? null, status: statusOf(inst), lines, policyFlags: [],
    totalAmount: amount, policyAmount: amount, voucherNo: null, createdAt: inst.submittedAt, updatedAt: inst.completedAt ?? inst.submittedAt, workflowInstanceId: inst.id,
  };
}

/** Claims mirror the seeded `Claim` workflow instances (TADA / CNV), plus one settled bill for history. */
export function seedClaims(db: MockDb): void {
  for (const inst of db.workflow) {
    if (inst.objectType !== "Claim") continue;
    const type: ClaimType | null = inst.summary.refNo.startsWith("TADA") ? "TADA" : inst.summary.refNo.startsWith("CNV") ? "CONVEYANCE" : null;
    if (type) db.claims.push(build(db, inst, type));
  }
  const tanvir = empId("EMP-1042");
  const end = addDays(dateKey(), -40);
  const start = addDays(end, -4);
  const created = hoursFromNow(-38 * 24);
  db.claims.push({
    id: "clm_cnv_0870", claimNo: "CNV-2026-0870", claimantId: tanvir, type: "CONVEYANCE", purpose: "Local travel for dealer visits in Dhaka",
    destination: null, periodStart: start, periodEnd: end, travelMode: null, costCenter: db.employees.find((e) => e.id === tanvir)?.department.code ?? null, status: "SETTLED",
    lines: [
      line("clm_cnv_0870_1", start, "CNG", "CNG fares", 900, false),
      line("clm_cnv_0870_2", addDays(start, 2), "RIDE_SHARE", "Ride-share to Narayanganj", 2300, true),
    ],
    policyFlags: [], totalAmount: 3200, policyAmount: 3200, voucherNo: "VCH-2026-00412", createdAt: created, updatedAt: created, workflowInstanceId: null,
  });
  db.claims.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
