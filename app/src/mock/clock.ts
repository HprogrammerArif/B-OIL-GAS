/** Time helpers for seeds and handlers; seeds are relative to "now" so demos never look stale. */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const ms = { MINUTE, HOUR, DAY };

export function nowIso(): string {
  return new Date().toISOString();
}

/** ISO timestamp `days` from today at local `hh:mm` (negative = past). */
export function atDay(days: number, hh = 9, mm = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

/** ISO timestamp offset from now by minutes (negative = past). */
export function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * MINUTE).toISOString();
}

export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * HOUR).toISOString();
}

/** `YYYY-MM-DD` in local time, `days` from today. */
export function dateOnly(days = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isSameLocalDay(iso: string, days = 0): boolean {
  return new Date(iso).toDateString() === new Date(atDay(days)).toDateString();
}
