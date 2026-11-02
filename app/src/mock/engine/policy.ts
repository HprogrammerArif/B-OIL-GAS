import type { WorkCalendar } from "@/lib/calendar";
import type { LeaveCode } from "@/types/domain/leave";

/** `Setting calendar.*` stand-in: Bangladesh weekend (Fri/Sat) and gazetted holidays. */
export const WORK_CALENDAR: WorkCalendar = {
  weekendDays: [5, 6],
  holidays: [
    { date: "2026-12-16", name: "Victory Day", nameBn: "বিজয় দিবস" },
    { date: "2026-12-25", name: "Christmas Day", nameBn: "বড়দিন" },
    { date: "2027-02-21", name: "Language Martyrs' Day", nameBn: "শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস" },
    { date: "2027-03-26", name: "Independence Day", nameBn: "স্বাধীনতা দিবস" },
    { date: "2027-04-14", name: "Pohela Boishakh", nameBn: "পহেলা বৈশাখ" },
    { date: "2027-05-01", name: "May Day", nameBn: "মে দিবস" },
  ],
};

/** `Setting attendance.*` (doc 06 BR-10-01…07). */
export const ATTENDANCE_POLICY = {
  maxAccuracyM: 50,
  duplicateWindowMin: 5,
  clockSkewMin: 10,
  regularisationWindowDays: 7,
  fieldDutyAheadDays: 30,
  earlyLeaveMin: 30,
  overtimeBufferMin: 30,
  reasonMin: 10,
  reasonMax: 500,
  regularisationSlaHours: 48,
} as const;

/** `Setting leave.*` (doc 06 BR-10-09…12, doc 03 §16.2 validation). */
export const LEAVE_POLICY = {
  maxConsecutiveCl: 3,
  hrReviewAboveDays: 5,
  hrReviewTypes: ["ML", "LWP"] as LeaveCode[],
  backdateDays: 3,
  backdateTypes: ["SL", "LWP"] as LeaveCode[],
  docRequiredAboveDays: 2,
  reasonMin: 5,
  reasonMax: 500,
  lineManagerSlaHours: 24,
  hrSlaHours: 24,
} as const;
