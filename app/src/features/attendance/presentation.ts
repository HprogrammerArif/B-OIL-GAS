import type { Tone } from "@/constants/theme";
import type { DayStatus, PunchResult, RequestStatus } from "@/types/domain/attendance";
import type { IconName } from "@/components/ui";

export const DAY_TONE: Record<DayStatus, Tone> = {
  PRESENT: "success",
  LATE: "warning",
  EARLY_LEAVE: "warning",
  ABSENT: "danger",
  ON_LEAVE: "info",
  HOLIDAY: "purple",
  WEEKEND: "neutral",
  FIELD_DUTY: "accent",
  HALF_DAY: "warning",
};

export const RESULT_TONE: Record<PunchResult, Tone> = {
  ACCEPTED: "success",
  PENDING_REGULARISATION: "warning",
  REJECTED_OUTSIDE_FENCE: "danger",
  REJECTED_ACCURACY: "danger",
  REJECTED_MOCK: "danger",
};

export const RESULT_ICON: Record<PunchResult, IconName> = {
  ACCEPTED: "checkmark-circle",
  PENDING_REGULARISATION: "hourglass-outline",
  REJECTED_OUTSIDE_FENCE: "close-circle",
  REJECTED_ACCURACY: "close-circle",
  REJECTED_MOCK: "close-circle",
};

export const REQUEST_TONE: Record<RequestStatus, Tone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

export const REGULARISATION_TYPES = ["MISSED_PUNCH", "FIELD_DUTY", "LATE_JUSTIFICATION", "REMOTE_WORK"] as const;

/** "7 h 32 min" from minutes, through the shared time keys so both languages stay correct. */
export function workedLabel(
  minutes: number,
  t: (key: "time.hoursShort" | "time.minutesShort", o: { n: string }) => string,
  fmtNumber: (n: number) => string,
): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const parts = [h > 0 ? t("time.hoursShort", { n: fmtNumber(h) }) : "", m > 0 || h === 0 ? t("time.minutesShort", { n: fmtNumber(m) }) : ""];
  return parts.filter(Boolean).join(" ");
}

/** Wire distance: metres under a kilometre, then one-decimal km. */
export function distanceLabel(m: number, fmtNumber: (n: number, d?: number) => string, units: { m: string; km: string }): string {
  return m >= 1000 ? `${fmtNumber(m / 1000, 1)} ${units.km}` : `${fmtNumber(Math.round(m))} ${units.m}`;
}
