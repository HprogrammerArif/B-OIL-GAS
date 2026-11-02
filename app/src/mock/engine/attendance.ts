import { format } from "date-fns";
import { bn, enUS } from "date-fns/locale";
import { atTime, dateKey, holidayOf, isBusinessDay, isWeekend, parseDateKey } from "@/lib/calendar";
import { toBengaliDigits } from "@/lib/i18n/format";
import { nearestFence } from "@/lib/location/haversine";
import type {
  AttendanceDay,
  AttendanceSummary,
  DayStatus,
  Punch,
  PunchResult,
  Regularisation,
  RegularisationType,
  RosterRow,
  Shift,
} from "@/types/domain/attendance";
import type { SiteRef } from "@/types/domain/identity";
import { nowIso } from "../clock";
import { newId } from "../crypto";
import { nextRef } from "../db/refs";
import type { MockDb, MockEmployee, MockGeofence, MockPunch, MockRegularisation, MockShift } from "../db/schema";
import { mockEvents } from "../events";
import { inScope, type AuthContext, type HandlerContext } from "../router";
import { personRef } from "./people";
import { ATTENDANCE_POLICY, WORK_CALENDAR } from "./policy";
import { lineManagerStep, registerWorkflowHooks, startWorkflow } from "./workflow";

const MINUTE = 60_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

/* ─── Lookups ─── */

export function shiftFor(db: MockDb, employeeId: string): MockShift {
  const id = db.shiftAssignments[employeeId];
  return db.shifts.find((s) => s.id === id) ?? db.shifts[0]!;
}

export function shiftWire(s: MockShift): Shift {
  return { id: s.id, code: s.code, name: s.name, nameBn: s.nameBn, startTime: s.startTime, endTime: s.endTime, graceMinutes: s.graceMinutes };
}

export function siteRef(db: MockDb, siteId: string | null): SiteRef | null {
  return siteId ? (db.sites.find((s) => s.id === siteId) ?? null) : null;
}

/** `attendance.allowAnySiteFence = true` (doc 06 §11.10): any active company fence counts unless a site is named. */
export function activeFences(db: MockDb, siteId?: string): MockGeofence[] {
  return db.geofences.filter((g) => g.isActive && (!siteId || g.siteId === siteId));
}

export function activeEmployees(db: MockDb): MockEmployee[] {
  return db.employees.filter((e) => e.status !== "OFFBOARDED");
}

/** Records the caller may see under `key`, plus their direct reports (line managers always see their team). */
export function canSeeEmployee(ctx: HandlerContext, auth: AuthContext, key: `${string}:${string}`, emp: MockEmployee): boolean {
  return (
    emp.lineManager?.id === auth.employee.id ||
    inScope(ctx, key, { ownerEmployeeId: emp.id, departmentId: emp.department.id, siteId: emp.site.id, teamManagerId: emp.lineManager?.id })
  );
}

/* ─── Punch verdict (BR-10-01/02) ─── */

export interface PunchInput {
  lat: number;
  lng: number;
  accuracyM: number | null;
  isMockLocation: boolean;
  siteId?: string;
  fieldDutyRequested?: boolean;
}

export interface Verdict {
  result: PunchResult;
  fence: MockGeofence | null;
  distanceM: number | null;
  fieldDuty: boolean;
}

function hasApprovedFieldDuty(db: MockDb, employeeId: string, date: string): boolean {
  return db.regularisations.some((r) => r.employeeId === employeeId && r.date === date && r.type === "FIELD_DUTY" && r.status === "APPROVED");
}

/** Rejection order: mock → accuracy → fence; an approved FIELD_DUTY covers an outside punch. */
export function evaluatePunch(db: MockDb, employeeId: string, date: string, input: PunchInput): Verdict {
  const near = nearestFence(activeFences(db, input.siteId), input.lat, input.lng);
  const base = { fence: near?.fence ?? null, distanceM: near ? round2(near.distanceM) : null, fieldDuty: false };
  if (input.isMockLocation) return { ...base, result: "REJECTED_MOCK" };
  if (input.accuracyM === null || input.accuracyM > ATTENDANCE_POLICY.maxAccuracyM) return { ...base, result: "REJECTED_ACCURACY" };
  if (near?.inside) return { ...base, result: "ACCEPTED" };
  if (hasApprovedFieldDuty(db, employeeId, date)) return { ...base, result: "ACCEPTED", fieldDuty: true };
  if (input.fieldDutyRequested) return { ...base, result: "PENDING_REGULARISATION" };
  return { ...base, result: "REJECTED_OUTSIDE_FENCE" };
}

/* ─── Day computation (BR-10-05/06) ─── */

const EFFECTIVE: PunchResult[] = ["ACCEPTED", "PENDING_REGULARISATION"];
const isEffective = (p: MockPunch) => EFFECTIVE.includes(p.result);

export function punchWire(db: MockDb, p: MockPunch): Punch {
  return { id: p.id, type: p.type, punchedAt: p.punchedAt, result: p.result, site: siteRef(db, p.siteId), distanceM: p.distanceM, accuracyM: p.accuracyM };
}

function leaveCovering(db: MockDb, employeeId: string, date: string) {
  const covering = db.leaveRequests.filter(
    (l) => l.employeeId === employeeId && (l.status === "APPROVED" || l.status === "PENDING") && l.startDate <= date && date <= l.endDate,
  );
  return covering.find((l) => l.status === "APPROVED") ?? covering[0];
}

const minIso = (values: string[]) => (values.length ? values.reduce((a, b) => (a < b ? a : b)) : null);
const maxIso = (values: string[]) => (values.length ? values.reduce((a, b) => (a > b ? a : b)) : null);

export function computeDay(db: MockDb, emp: MockEmployee, date: string, now: Date = new Date()): AttendanceDay {
  const today = dateKey(now);
  const shift = shiftFor(db, emp.id);
  const punches = db.punches.filter((p) => p.employeeId === emp.id && p.date === date).sort((a, b) => a.punchedAt.localeCompare(b.punchedAt));
  const effective = punches.filter(isEffective);
  const regs = db.regularisations.filter((r) => r.employeeId === emp.id && r.date === date);
  const approved = regs.filter((r) => r.status === "APPROVED");
  const leave = isBusinessDay(date, WORK_CALENDAR) ? leaveCovering(db, emp.id, date) : undefined;
  const holiday = holidayOf(date, WORK_CALENDAR);

  const firstInAt = minIso([...effective.filter((p) => p.type === "IN").map((p) => p.punchedAt), ...approved.flatMap((r) => (r.requestedIn ? [r.requestedIn] : []))]);
  const lastOutAt = maxIso([...effective.filter((p) => p.type === "OUT").map((p) => p.punchedAt), ...approved.flatMap((r) => (r.requestedOut ? [r.requestedOut] : []))]);
  const lastEffective = effective[effective.length - 1];

  const day: AttendanceDay = {
    date,
    status: null,
    firstInAt,
    lastOutAt,
    lateMinutes: 0,
    workedMinutes: 0,
    overtimeMinutes: 0,
    site: siteRef(db, lastEffective?.siteId ?? (firstInAt ? emp.site.id : null)),
    holiday: holiday ? { name: holiday.name, nameBn: holiday.nameBn } : null,
    flags: { missingOut: false, earlyLeave: false, pendingReview: punches.some((p) => p.result === "PENDING_REGULARISATION") || regs.some((r) => r.status === "PENDING") },
    leave: leave ? { id: leave.id, refNo: leave.refNo, typeCode: db.leaveTypes.find((t) => t.id === leave.leaveTypeId)?.code ?? "", status: leave.status } : null,
    punches: punches.map((p) => punchWire(db, p)),
  };

  if (leave?.status === "APPROVED") {
    day.status = "ON_LEAVE";
    return day;
  }
  if (!firstInAt) {
    if (holiday) day.status = "HOLIDAY";
    else if (isWeekend(date, WORK_CALENDAR)) day.status = "WEEKEND";
    else if (approved.some((r) => r.type === "FIELD_DUTY")) day.status = "FIELD_DUTY";
    else if (date < today) day.status = "ABSENT";
    return day;
  }

  const start = atTime(date, shift.startTime).getTime();
  const end = atTime(date, shift.endTime).getTime();
  const shiftMinutes = (end - start) / MINUTE;
  const inAt = Date.parse(firstInAt);
  const outAt = lastOutAt ? Date.parse(lastOutAt) : null;
  const isToday = date === today;
  const until = outAt ?? (isToday ? now.getTime() : end);
  day.workedMinutes = Math.max(0, Math.round((until - inAt) / MINUTE));
  day.flags.missingOut = !outAt && !isToday;

  const late = inAt > start + shift.graceMinutes * MINUTE;
  const excused = approved.some((r) => r.type === "LATE_JUSTIFICATION");
  day.lateMinutes = late && !excused ? Math.round((inAt - start) / MINUTE) : 0;
  day.flags.earlyLeave = outAt !== null && outAt < end - ATTENDANCE_POLICY.earlyLeaveMin * MINUTE;
  if (outAt !== null) day.overtimeMinutes = Math.max(0, day.workedMinutes - shiftMinutes - ATTENDANCE_POLICY.overtimeBufferMin);

  const fieldDuty = approved.some((r) => r.type === "FIELD_DUTY") || effective.some((p) => p.fieldDuty);
  let status: DayStatus = "PRESENT";
  if (fieldDuty) status = "FIELD_DUTY";
  else if (outAt !== null && day.workedMinutes < shiftMinutes / 2) status = "HALF_DAY";
  else if (day.lateMinutes > 0) status = "LATE";
  else if (day.flags.earlyLeave) status = "EARLY_LEAVE";
  day.status = status;
  return day;
}

export function nextPunchType(day: AttendanceDay): "IN" | "OUT" {
  const last = [...day.punches].reverse().find((p) => EFFECTIVE.includes(p.result));
  return last?.type === "IN" ? "OUT" : "IN";
}

const WORKED: (DayStatus | null)[] = ["PRESENT", "LATE", "EARLY_LEAVE", "HALF_DAY", "FIELD_DUTY"];

export function summarise(days: AttendanceDay[]): AttendanceSummary {
  return days.reduce<AttendanceSummary>(
    (s, d) => ({
      present: s.present + (WORKED.includes(d.status) ? 1 : 0),
      late: s.late + (d.status === "LATE" ? 1 : 0),
      absent: s.absent + (d.status === "ABSENT" ? 1 : 0),
      leave: s.leave + (d.status === "ON_LEAVE" ? 1 : 0),
      fieldDuty: s.fieldDuty + (d.status === "FIELD_DUTY" ? 1 : 0),
      workedMinutes: s.workedMinutes + d.workedMinutes,
      overtimeMinutes: s.overtimeMinutes + d.overtimeMinutes,
    }),
    { present: 0, late: 0, absent: 0, leave: 0, fieldDuty: 0, workedMinutes: 0, overtimeMinutes: 0 },
  );
}

/** Month-to-date overtime; only dates with punches can earn it. */
export function overtimeMtd(db: MockDb, emp: MockEmployee, now: Date = new Date()): number {
  const month = dateKey(now).slice(0, 7);
  const dates = new Set(db.punches.filter((p) => p.employeeId === emp.id && p.date.startsWith(month)).map((p) => p.date));
  let total = 0;
  dates.forEach((d) => (total += computeDay(db, emp, d, now).overtimeMinutes));
  return total;
}

export function rosterRow(db: MockDb, emp: MockEmployee, selfId: string, now: Date = new Date()): RosterRow {
  const day = computeDay(db, emp, dateKey(now), now);
  const effective = db.punches.filter((p) => p.employeeId === emp.id && p.date === day.date && isEffective(p));
  const last = effective.sort((a, b) => a.punchedAt.localeCompare(b.punchedAt))[effective.length - 1];
  return {
    employee: personRef(db, emp.id),
    site: siteRef(db, emp.site.id) ?? emp.site,
    shift: shiftWire(shiftFor(db, emp.id)),
    day,
    insideFence: last?.type === "IN" && last.result === "ACCEPTED" && !last.fieldDuty,
    distanceM: last?.distanceM ?? null,
    overtimeMinutesMtd: overtimeMtd(db, emp, now),
    isSelf: emp.id === selfId,
  };
}

/* ─── Regularisations (doc 06 §11.3, workflow ATTENDANCE_REGULARISATION) ─── */

const REG_LABEL: Record<RegularisationType, [string, string]> = {
  MISSED_PUNCH: ["Missed punch", "পাঞ্চ বাদ পড়েছে"],
  FIELD_DUTY: ["Field duty", "মাঠ পর্যায়ের দায়িত্ব"],
  LATE_JUSTIFICATION: ["Late arrival note", "দেরিতে আসার ব্যাখ্যা"],
  REMOTE_WORK: ["Remote work", "দূর থেকে কাজ"],
};

function dayLabel(date: string): [string, string] {
  const d = parseDateKey(date);
  return [format(d, "d MMM", { locale: enUS }), toBengaliDigits(format(d, "d MMM", { locale: bn }))];
}

export function regularisationWire(db: MockDb, r: MockRegularisation): Regularisation {
  return {
    id: r.id, refNo: r.refNo, employee: personRef(db, r.employeeId), date: r.date, type: r.type,
    requestedIn: r.requestedIn, requestedOut: r.requestedOut, reason: r.reason, status: r.status,
    createdAt: r.createdAt, workflowInstanceId: r.workflowInstanceId,
  };
}

/** Linked field-duty punches become effective on approval and revert to an outside-fence rejection otherwise. */
function settlePunches(db: MockDb, r: MockRegularisation): void {
  for (const p of db.punches) {
    if (p.regularisationId !== r.id || p.result !== "PENDING_REGULARISATION") continue;
    if (r.status === "APPROVED") {
      p.result = "ACCEPTED";
      p.fieldDuty = r.type === "FIELD_DUTY";
    } else {
      p.result = "REJECTED_OUTSIDE_FENCE";
    }
  }
}

function emitChanged(db: MockDb, employeeId: string): void {
  const emp = db.employees.find((e) => e.id === employeeId);
  mockEvents.emit("attendance:punch", [], { employeeId, siteId: emp?.site.id ?? null });
}

export interface RegularisationSpec {
  date: string;
  type: RegularisationType;
  requestedIn: string | null;
  requestedOut: string | null;
  reason: string;
}

export function createRegularisation(db: MockDb, employeeId: string, spec: RegularisationSpec): MockRegularisation {
  const r: MockRegularisation = {
    id: newId("reg"),
    refNo: nextRef(db, "REG", 3),
    employeeId,
    ...spec,
    status: "PENDING",
    createdAt: nowIso(),
    workflowInstanceId: null,
  };
  db.regularisations.unshift(r);
  const step = lineManagerStep(db, employeeId, ATTENDANCE_POLICY.regularisationSlaHours);
  if (!step) {
    r.status = "APPROVED";
    settlePunches(db, r);
    return r;
  }
  const [label, labelBn] = REG_LABEL[spec.type];
  const [day, dayBn] = dayLabel(spec.date);
  const inst = startWorkflow(db, {
    objectType: "Regularisation",
    objectId: r.id,
    initiatorEmployeeId: employeeId,
    summary: {
      refNo: r.refNo,
      title: `${label} — ${day}`,
      titleBn: `${labelBn} — ${dayBn}`,
      details: spec.reason,
      detailsBn: spec.reason,
      amount: null,
      quantityLabel: `1 day · ${label.toLowerCase()}`,
      quantityLabelBn: `১ দিন · ${labelBn}`,
      urgency: "NORMAL",
      category: "HR",
    },
    steps: [step],
  });
  r.workflowInstanceId = inst.id;
  return r;
}

function settleRegularisation(db: MockDb, objectId: string, status: MockRegularisation["status"]): void {
  const r = db.regularisations.find((x) => x.id === objectId);
  if (!r) return;
  r.status = status;
  settlePunches(db, r);
  emitChanged(db, r.employeeId);
}

registerWorkflowHooks("Regularisation", {
  noReturn: true,
  initiatorRoute: () => "/attendance",
  onApproved: ({ db, instance }) => {
    settleRegularisation(db, instance.objectId, "APPROVED");
    return null;
  },
  onRejected: ({ db, instance }) => settleRegularisation(db, instance.objectId, "REJECTED"),
  onWithdrawn: ({ db, instance }) => settleRegularisation(db, instance.objectId, "CANCELLED"),
});
