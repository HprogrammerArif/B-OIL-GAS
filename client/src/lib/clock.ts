/**
 * Demo clock. The dataset is anchored to SYSTEM_TODAY so dates in seed data
 * stay coherent; wall-clock time is used for "just now" style timestamps.
 */
import { SYSTEM_TODAY, Lang } from '../types';

/** Anchor date as a Date (local midnight). */
export function todayDate(): Date {
  return new Date(2026, 9, 29);
}

/** Display string for the anchor date, e.g. "29 Oct 2026". */
export function today(): string {
  return SYSTEM_TODAY;
}

/** Current wall-clock time, e.g. "03:51 PM". */
export function nowTime(lang: Lang = 'en'): string {
  return new Date().toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

/** "Today, 03:51 PM" style stamp used across stores. */
export function nowStamp(lang: Lang = 'en'): string {
  return lang === 'bn' ? `আজ, ${nowTime('bn')}` : `Today, ${nowTime('en')}`;
}

/** Anchor date shifted by `days` (negative for past), formatted like SYSTEM_TODAY. */
export function daysFromToday(days: number): string {
  const d = todayDate();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
}

/** Whole days between the anchor date and an ISO/parsable date string. */
export function daysUntil(date: string | Date): number {
  const target = typeof date === 'string' ? new Date(date) : date;
  return Math.round((target.getTime() - todayDate().getTime()) / 86_400_000);
}
