import { addDays, atTime, dateKey, isBusinessDay } from "@/lib/calendar";
import type { MockDb, MockGeofence, MockPunch, MockRegularisation, MockShift } from "../db/schema";
import { WORK_CALENDAR } from "../engine/policy";
import { empId } from "./org";
import { buildSeedInstance, STEP } from "./workflow";

/** Fence centres from the web prototype (`client/src/views/attendance/config.ts`); radii per BR-10-01. */
export const GEOFENCES: MockGeofence[] = [
  { id: "gf_hq", siteId: "site_hq", name: "Head Office, Baridhara", nameBn: "প্রধান কার্যালয়, বারিধারা", centerLat: 23.8103, centerLng: 90.4125, radiusMeters: 300, isActive: true },
  { id: "gf_plant", siteId: "site_plant", name: "Keraniganj Plant", nameBn: "কেরানীগঞ্জ প্ল্যান্ট", centerLat: 23.7005, centerLng: 90.3499, radiusMeters: 500, isActive: true },
  { id: "gf_ctg", siteId: "site_ctg", name: "Chattogram Terminal", nameBn: "চট্টগ্রাম টার্মিনাল", centerLat: 22.307, centerLng: 91.8, radiusMeters: 400, isActive: true },
];

export const SHIFTS: MockShift[] = [
  { id: "shf_gen", code: "GEN", name: "General", nameBn: "সাধারণ", startTime: "09:00", endTime: "17:00", graceMinutes: 15 },
  { id: "shf_hq", code: "HQ", name: "Head office", nameBn: "প্রধান কার্যালয়", startTime: "09:00", endTime: "18:00", graceMinutes: 15 },
  { id: "shf_plant", code: "PLANT", name: "Plant general", nameBn: "প্ল্যান্ট সাধারণ", startTime: "08:30", endTime: "17:30", graceMinutes: 15 },
  { id: "shf_trans", code: "TRANS", name: "Transport morning", nameBn: "পরিবহন সকাল", startTime: "08:00", endTime: "17:00", graceMinutes: 15 },
  { id: "shf_drv", code: "DRV", name: "Driver morning", nameBn: "চালক সকাল", startTime: "07:00", endTime: "16:00", graceMinutes: 15 },
  { id: "shf_a", code: "A", name: "Shift A", nameBn: "শিফট এ", startTime: "07:00", endTime: "15:00", graceMinutes: 10 },
  { id: "shf_exec", code: "EXEC", name: "Executive hours", nameBn: "নির্বাহী সময়", startTime: "09:00", endTime: "17:00", graceMinutes: 60 },
];

const ASSIGNMENTS: Record<string, string> = {
  "EMP-0001": "shf_exec",
  "EMP-0012": "shf_plant",
  "EMP-0028": "shf_hq",
  "EMP-0045": "shf_trans",
  "EMP-0062": "shf_hq",
  "EMP-1042": "shf_hq",
  "EMP-0821": "shf_drv",
  "EMP-1088": "shf_plant",
  "EMP-1104": "shf_hq",
  "EMP-0914": "shf_a",
  "EMP-0733": "shf_hq",
};

/** Staff whose overtime the prototype roster highlighted (drivers, transport, gate). */
const LONG_DAYS = new Set(["EMP-0045", "EMP-0821", "EMP-0914", "EMP-0012"]);

/** Today's first IN from the prototype roster as `HH:mm` and metres from the fence centre; demo punchers start blank. */
const TODAY_IN: Record<string, [string, number]> = {
  "EMP-0001": ["09:05", 15],
  "EMP-0012": ["08:18", 30],
  "EMP-0028": ["08:50", 22],
  "EMP-0045": ["07:52", 48],
  "EMP-0062": ["08:55", 18],
  "EMP-1104": ["09:21", 120],
  "EMP-0914": ["06:54", 12],
};

/** Deterministic 0–1 noise so reseeds produce the same history. */
function noise(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

const DEVICE = "seed-device";

export function seedAttendance(db: MockDb): void {
  db.geofences = GEOFENCES;
  db.shifts = SHIFTS;
  db.shiftAssignments = Object.fromEntries(Object.entries(ASSIGNMENTS).map(([code, shift]) => [empId(code), shift]));

  const now = new Date();
  const today = dateKey(now);
  const punches: MockPunch[] = [];
  let seq = 0;

  const punch = (employeeId: string, date: string, type: "IN" | "OUT", at: Date, siteId: string, distance: number, accuracy: number) => {
    const fence = GEOFENCES.find((g) => g.siteId === siteId) ?? GEOFENCES[0]!;
    punches.push({
      id: `pch_seed_${++seq}`, employeeId, date, type, punchedAt: at.toISOString(), receivedAt: at.toISOString(),
      lat: fence.centerLat + distance / 111_320, lng: fence.centerLng, accuracyM: accuracy, geofenceId: fence.id, siteId,
      distanceM: distance, isMockLocation: false, deviceId: DEVICE, platform: "ANDROID", result: "ACCEPTED", fieldDuty: false, regularisationId: null,
    });
  };

  const onLeave = (employeeId: string, date: string) =>
    db.leaveRequests.some((l) => l.employeeId === employeeId && l.status === "APPROVED" && l.startDate <= date && date <= l.endDate);

  for (const emp of db.employees) {
    if (emp.status === "OFFBOARDED") continue;
    const shift = SHIFTS.find((s) => s.id === db.shiftAssignments[emp.id]) ?? SHIFTS[0]!;
    for (let offset = -31; offset <= -1; offset++) {
      const date = addDays(today, offset);
      if (!isBusinessDay(date, WORK_CALENDAR) || onLeave(emp.id, date)) continue;
      const key = `${emp.empCode}|${date}`;
      if (noise(`${key}|absent`) < 0.03) continue;
      const lateRoll = noise(`${key}|late`);
      const inShift = lateRoll < 0.1 ? 16 + Math.round(lateRoll * 240) : -25 + Math.round(noise(`${key}|in`) * 33);
      const inAt = new Date(atTime(date, shift.startTime).getTime() + inShift * 60_000);
      const distance = Math.round(10 + noise(`${key}|d`) * 180);
      const accuracy = Math.round(6 + noise(`${key}|a`) * 18);
      punch(emp.id, date, "IN", inAt, emp.site.id, distance, accuracy);
      if (noise(`${key}|missing`) < 0.04) continue;
      const outRoll = noise(`${key}|out`);
      const outShift = outRoll < 0.08 ? -45 : LONG_DAYS.has(emp.empCode) ? 40 + Math.round(outRoll * 110) : -5 + Math.round(outRoll * 55);
      const outAt = new Date(atTime(date, shift.endTime).getTime() + outShift * 60_000);
      punch(emp.id, date, "OUT", outAt, emp.site.id, Math.round(distance * 0.8), accuracy);
    }

    const todayIn = TODAY_IN[emp.empCode];
    if (todayIn && isBusinessDay(today, WORK_CALENDAR) && !onLeave(emp.id, today)) {
      const target = atTime(today, todayIn[0]).getTime();
      const at = Math.min(target, now.getTime() - 2 * 60_000);
      if (at > atTime(today, "05:30").getTime()) punch(emp.id, today, "IN", new Date(at), emp.site.id, todayIn[1], 8);
    }
  }

  seedRegularisations(db, punches, today);
  db.punches = punches;
}

function seedRegularisations(db: MockDb, punches: MockPunch[], today: string): void {
  const year = today.slice(0, 4);
  const regs: MockRegularisation[] = [];

  const mizanur = empId("EMP-0914");
  const lastBusinessDay = (() => {
    let d = addDays(today, -1);
    while (!isBusinessDay(d, WORK_CALENDAR)) d = addDays(d, -1);
    return d;
  })();
  const outIdx = punches.findIndex((p) => p.employeeId === mizanur && p.date === lastBusinessDay && p.type === "OUT");
  if (outIdx >= 0) punches.splice(outIdx, 1);
  regs.push({
    id: "reg_014", refNo: `REG-${year}-014`, employeeId: mizanur, date: lastBusinessDay, type: "MISSED_PUNCH",
    requestedIn: null, requestedOut: atTime(lastBusinessDay, "15:05").toISOString(),
    reason: "Gate biometric terminal was offline at shift handover; my out-time is in the gate register.",
    status: "PENDING", createdAt: new Date(Date.now() - 20 * 3_600_000).toISOString(), workflowInstanceId: null,
  });

  if (isBusinessDay(today, WORK_CALENDAR)) {
    regs.push({
      id: "reg_015", refNo: `REG-${year}-015`, employeeId: empId("EMP-1104"), date: today, type: "LATE_JUSTIFICATION",
      requestedIn: null, requestedOut: null,
      reason: "Stopped at the DoE office in Agargaon to collect the environmental clearance hearing notice.",
      status: "PENDING", createdAt: new Date(Date.now() - 3_600_000).toISOString(), workflowInstanceId: null,
    });
  }

  const managerOf: Record<string, string> = { reg_014: "EMP-0045", reg_015: "EMP-0012" };
  const initiatorOf: Record<string, string> = { reg_014: "EMP-0914", reg_015: "EMP-1104" };
  const titles: Record<string, [string, string]> = {
    reg_014: ["Missed punch — out-time", "পাঞ্চ বাদ পড়েছে — বের হওয়ার সময়"],
    reg_015: ["Late arrival note — DoE errand", "দেরিতে আসার ব্যাখ্যা — পরিবেশ অধিদপ্তর"],
  };
  for (const r of regs) {
    const [title, titleBn] = titles[r.id] ?? ["Regularisation", "নিয়মিতকরণ"];
    const inst = buildSeedInstance({
      ref: r.refNo, type: "Regularisation", objectId: r.id, initiator: initiatorOf[r.id] ?? "EMP-0914", category: "HR", urgency: "NORMAL",
      qty: ["1 day", "১ দিন"], submittedHoursAgo: (Date.now() - Date.parse(r.createdAt)) / 3_600_000,
      title, titleBn, details: r.reason, detailsBn: r.reason,
      steps: [{ ...STEP.LM, emp: managerOf[r.id] ?? "EMP-0045", sla: 48 }],
    });
    db.workflow.push(inst);
    r.workflowInstanceId = inst.id;
  }
  db.regularisations = regs;
  db.counters[`REG-${year}`] = 15;
}
