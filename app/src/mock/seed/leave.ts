import { addDays, dateKey, nthBusinessDay, parseDateKey } from "@/lib/calendar";
import { hoursFromNow } from "../clock";
import type { MockDb, MockLeaveBalance, MockLeaveRequest, MockLeaveType } from "../db/schema";
import { WORK_CALENDAR } from "../engine/policy";
import { empId } from "./org";
import { buildSeedInstance, STEP } from "./workflow";

export const LEAVE_TYPES: MockLeaveType[] = [
  { id: "lt_cl", code: "CL", name: "Casual leave", nameBn: "নৈমিত্তিক ছুটি", annualQuota: 10, requiresDoc: false, halfDayAllowed: true, checksBalance: true },
  { id: "lt_sl", code: "SL", name: "Sick leave", nameBn: "অসুস্থতাজনিত ছুটি", annualQuota: 14, requiresDoc: false, halfDayAllowed: true, checksBalance: true },
  { id: "lt_el", code: "EL", name: "Earned leave", nameBn: "অর্জিত ছুটি", annualQuota: 20, requiresDoc: false, halfDayAllowed: false, checksBalance: true },
  { id: "lt_ml", code: "ML", name: "Maternity leave", nameBn: "মাতৃত্বকালীন ছুটি", annualQuota: 112, requiresDoc: true, halfDayAllowed: false, checksBalance: true },
  { id: "lt_pl", code: "PL", name: "Paternity leave", nameBn: "পিতৃত্বকালীন ছুটি", annualQuota: 7, requiresDoc: false, halfDayAllowed: false, checksBalance: true },
  { id: "lt_lwp", code: "LWP", name: "Leave without pay", nameBn: "বিনা বেতনে ছুটি", annualQuota: 0, requiresDoc: false, halfDayAllowed: false, checksBalance: false },
];

/** Days already taken this year before the app went live, per employee code (CL, SL, EL). */
const PRIOR_USED: Record<string, [number, number, number]> = {
  "EMP-0001": [0, 0, 0],
  "EMP-0012": [4, 1, 6],
  "EMP-0028": [3, 2, 5],
  "EMP-0045": [5, 0, 4],
  "EMP-0062": [2, 3, 7],
  "EMP-1042": [4, 2, 2],
  "EMP-0821": [3, 1, 0],
  "EMP-1088": [4, 0, 3],
  "EMP-1104": [2, 1, 2],
  "EMP-0914": [6, 2, 5],
  "EMP-0733": [3, 0, 4],
};

interface LeaveSeed {
  id: string;
  ref: string;
  emp: string;
  type: "lt_cl" | "lt_sl" | "lt_el";
  start: string;
  days: number;
  reason: string;
  createdHoursAgo: number;
  decision?: { by: string; hoursAgo: number; status: "APPROVED" | "REJECTED"; comment: string };
}

const bday = (from: string, n: number) => nthBusinessDay(from, n, WORK_CALENDAR);

function specs(today: string): LeaveSeed[] {
  const next = bday(today, 1);
  return [
    {
      id: "lv_089", ref: "LV-2026-089", emp: "EMP-0733", type: "lt_sl", start: next, days: 5, createdHoursAgo: 4,
      reason: "Post-surgery medical rest recommended by Evercare Hospital doctor. Daily work handed over to colleague.",
    },
    {
      id: "lv_084", ref: "LV-2026-084", emp: "EMP-1088", type: "lt_cl", start: next, days: 2, createdHoursAgo: 52,
      reason: "Family medical checkup in Dhaka.",
      decision: { by: "EMP-0012", hoursAgo: 30, status: "APPROVED", comment: "Approved. Shahid covers the boiler PM rounds." },
    },
    {
      id: "lv_071", ref: "LV-2026-071", emp: "EMP-1042", type: "lt_el", start: bday(addDays(today, -32), 1), days: 3, createdHoursAgo: 40 * 24,
      reason: "Family wedding in Sylhet — travel and ceremonies.",
      decision: { by: "EMP-0062", hoursAgo: 39 * 24, status: "APPROVED", comment: "Enjoy the wedding. Hand over dealer follow-ups to Rakib." },
    },
    {
      id: "lv_077", ref: "LV-2026-077", emp: "EMP-0821", type: "lt_cl", start: bday(addDays(today, -18), 1), days: 2, createdHoursAgo: 22 * 24,
      reason: "Village visit for a family land registration in Mymensingh.",
      decision: { by: "EMP-0045", hoursAgo: 21 * 24, status: "APPROVED", comment: "Approved. Relief driver Jamal covers your route." },
    },
    {
      id: "lv_080", ref: "LV-2026-080", emp: "EMP-1042", type: "lt_cl", start: bday(addDays(today, -9), 1), days: 1, createdHoursAgo: 12 * 24,
      reason: "Personal errand at the passport office.",
      decision: { by: "EMP-0062", hoursAgo: 11 * 24, status: "REJECTED", comment: "Quarter-end dealer reconciliation that day — please pick another date." },
    },
  ];
}

const TYPE_TEXT: Record<LeaveSeed["type"], [string, string]> = {
  lt_cl: ["Casual leave", "নৈমিত্তিক ছুটি"],
  lt_sl: ["Sick leave", "অসুস্থতাজনিত ছুটি"],
  lt_el: ["Earned leave", "অর্জিত ছুটি"],
};

/** Leave types, this year's balances and requests; LV-2026-089's workflow already lives in the approvals seed. */
export function seedLeave(db: MockDb): void {
  const today = dateKey();
  const year = parseDateKey(today).getFullYear();
  db.leaveTypes = LEAVE_TYPES;

  const requests: MockLeaveRequest[] = specs(today).map((s) => {
    const end = bday(s.start, s.days);
    const created = hoursFromNow(-s.createdHoursAgo);
    const decidedAt = s.decision ? hoursFromNow(-s.decision.hoursAgo) : null;
    let workflowInstanceId = `wfi_${s.ref.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    if (s.decision) {
      const [name, nameBn] = TYPE_TEXT[s.type];
      const inst = buildSeedInstance({
        ref: s.ref, type: "LeaveRequest", objectId: s.id, initiator: s.emp, category: "LEAVE", urgency: "NORMAL",
        qty: [`${s.days} days · ${name.toLowerCase()}`, `${s.days} দিন · ${nameBn}`], submittedHoursAgo: s.createdHoursAgo,
        title: `${name} — ${s.days} day${s.days === 1 ? "" : "s"}`, titleBn: `${nameBn} — ${s.days} দিন`,
        details: s.reason, detailsBn: s.reason,
        steps: [{ ...STEP.LM, emp: s.decision.by, sla: 24, done: { by: s.decision.by, hoursAgo: s.decision.hoursAgo, comment: s.decision.comment, decision: s.decision.status } }],
      });
      db.workflow.push(inst);
      workflowInstanceId = inst.id;
    }
    return {
      id: s.id, refNo: s.ref, employeeId: empId(s.emp), leaveTypeId: s.type, startDate: s.start, endDate: end, halfDay: null,
      days: s.days, reason: s.reason, status: s.decision?.status ?? "PENDING", isInformed: true,
      reviewedById: s.decision ? empId(s.decision.by) : null, reviewedAt: decidedAt, cancelReason: null,
      createdAt: created, updatedAt: decidedAt ?? created, workflowInstanceId,
    };
  });
  db.leaveRequests = requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  db.counters[`LV-${year}`] = 89;

  const approvedDays = (employeeId: string, typeId: string) =>
    requests.filter((r) => r.employeeId === employeeId && r.leaveTypeId === typeId && r.status === "APPROVED").reduce((sum, r) => sum + r.days, 0);

  const balances: MockLeaveBalance[] = [];
  for (const emp of db.employees) {
    if (emp.status === "OFFBOARDED") continue;
    const prior = PRIOR_USED[emp.empCode] ?? [0, 0, 0];
    (["lt_cl", "lt_sl", "lt_el"] as const).forEach((typeId, i) => {
      const quota = LEAVE_TYPES.find((t) => t.id === typeId)?.annualQuota ?? 0;
      balances.push({ employeeId: emp.id, leaveTypeId: typeId, year, entitled: quota, used: (prior[i] ?? 0) + approvedDays(emp.id, typeId) });
    });
    balances.push({ employeeId: emp.id, leaveTypeId: "lt_lwp", year, entitled: 0, used: 0 });
  }
  db.leaveBalances = balances;
}
