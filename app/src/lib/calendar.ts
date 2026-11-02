/**
 * Local-date helpers shared by the leave form and the in-app mock server.
 * Dates are `YYYY-MM-DD` keys in the device's local time zone; the live server owns the real calendar.
 */

export interface WorkCalendar {
  /** `Date.getDay()` values that are weekends (Bangladesh: Friday 5, Saturday 6). */
  weekendDays: number[];
  holidays: { date: string; name: string; nameBn: string }[];
}

const pad = (n: number) => String(n).padStart(2, "0");

export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight for a date key. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDateKey(b).getTime() - parseDateKey(a).getTime()) / 86_400_000);
}

/** Local `Date` for a date key at `HH:mm`. */
export function atTime(key: string, hhmm: string): Date {
  const d = parseDateKey(key);
  const [h, m] = hhmm.split(":").map(Number);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

export function isWeekend(key: string, cal: WorkCalendar): boolean {
  return cal.weekendDays.includes(parseDateKey(key).getDay());
}

export function holidayOf(key: string, cal: WorkCalendar) {
  return cal.holidays.find((h) => h.date === key);
}

export function isBusinessDay(key: string, cal: WorkCalendar): boolean {
  return !isWeekend(key, cal) && !holidayOf(key, cal);
}

/** Business days in the inclusive range (BR-10-10: weekends and holidays excluded). */
export function businessDaysInRange(start: string, end: string, cal: WorkCalendar): string[] {
  const out: string[] = [];
  if (end < start) return out;
  for (let k = start; k <= end; k = addDays(k, 1)) {
    if (isBusinessDay(k, cal)) out.push(k);
  }
  return out;
}

/** Nth business day on or after `start` (n = 1 is the first). */
export function nthBusinessDay(start: string, n: number, cal: WorkCalendar): string {
  let k = start;
  let count = 0;
  for (;;) {
    if (isBusinessDay(k, cal)) count += 1;
    if (count >= n) return k;
    k = addDays(k, 1);
  }
}

/** `YYYY-MM` for a date key. */
export function monthKey(key: string): string {
  return key.slice(0, 7);
}

export function monthRange(month: string): { from: string; to: string } {
  const from = `${month}-01`;
  const d = parseDateKey(from);
  d.setMonth(d.getMonth() + 1, 0);
  return { from, to: dateKey(d) };
}

export function shiftMonth(month: string, delta: number): string {
  const d = parseDateKey(`${month}-01`);
  d.setMonth(d.getMonth() + delta, 1);
  return dateKey(d).slice(0, 7);
}
