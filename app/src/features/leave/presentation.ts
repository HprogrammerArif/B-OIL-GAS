import type { Tone } from "@/constants/theme";
import type { LeaveCode } from "@/types/domain/leave";

export const LEAVE_TONE: Record<LeaveCode, Tone> = {
  CL: "accent",
  SL: "warning",
  EL: "success",
  ML: "purple",
  PL: "info",
  LWP: "neutral",
};

/** BR-10-10: types that always take the HR review step, besides requests over the day threshold. */
export const HR_REVIEW_CODES: LeaveCode[] = ["ML", "LWP"];

/** Inclusive date range label key parts; same-day ranges collapse to one date. */
export function isSingleDay(start: string, end: string): boolean {
  return start === end;
}
