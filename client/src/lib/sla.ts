/**
 * Live SLA clock for approval items (BR-17-19).
 *
 * Seed data only stores `slaHoursLeft`, the window that was left when the item
 * entered the queue. The countdown starts at `slaStartedAt` (set for items
 * created during this session) or, for seeded items, at the moment the demo
 * session started, so the remaining time visibly ticks down while presenting.
 */
import { useSyncExternalStore } from 'react';
import { t, type Lang } from '../types';

const SESSION_START = Date.now();
const TICK_MS = 30_000;

export const SLA_URGENT_MINUTES = 12 * 60;
export const SLA_DAY_MINUTES = 24 * 60;

interface SlaSource {
  slaHoursLeft: number;
  slaStartedAt?: number;
}

/** Whole minutes left (negative once overdue). */
export function slaMinutesLeft(item: SlaSource, now: number): number {
  const startedAt = item.slaStartedAt ?? SESSION_START;
  return Math.floor(item.slaHoursLeft * 60 - (now - startedAt) / 60_000);
}

/* ── One shared ticker so every consumer re-renders together ── */
const listeners = new Set<() => void>();
let current = Date.now();
let timer: number | undefined;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === undefined) {
    current = Date.now();
    timer = window.setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot(): number {
  return current;
}

/** Wall-clock timestamp that refreshes every 30 s while a consumer is mounted. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export type SlaTone = 'overdue' | 'danger' | 'warn' | 'ok';

export function slaTone(minutes: number): SlaTone {
  if (minutes <= 0) return 'overdue';
  if (minutes < SLA_URGENT_MINUTES) return 'danger';
  if (minutes < SLA_DAY_MINUTES) return 'warn';
  return 'ok';
}

function digits(n: number, lang: Lang): string {
  return lang === 'bn' ? n.toLocaleString('bn-BD', { useGrouping: false }) : String(n);
}

function span(totalMinutes: number, lang: Lang): string {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m < 60) return t(`${digits(m, 'en')}m`, `${digits(m, 'bn')} মিনিট`, lang);
  if (m < SLA_DAY_MINUTES) {
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return t(
      rest ? `${h}h ${rest}m` : `${h}h`,
      rest ? `${digits(h, 'bn')} ঘণ্টা ${digits(rest, 'bn')} মিনিট` : `${digits(h, 'bn')} ঘণ্টা`,
      lang,
    );
  }
  const d = Math.floor(m / SLA_DAY_MINUTES);
  const h = Math.floor((m % SLA_DAY_MINUTES) / 60);
  return t(
    h ? `${d}d ${h}h` : `${d}d`,
    h ? `${digits(d, 'bn')} দিন ${digits(h, 'bn')} ঘণ্টা` : `${digits(d, 'bn')} দিন`,
    lang,
  );
}

/** "5h 12m left" / "Overdue by 40m". */
export function slaLabel(minutes: number, lang: Lang): string {
  if (minutes <= 0) {
    const late = span(-minutes, lang);
    return minutes === 0
      ? t('Due now', 'এখনই শেষ', lang)
      : t(`Overdue by ${late}`, `${late} অতিক্রান্ত`, lang);
  }
  const left = span(minutes, lang);
  return t(`${left} left`, `${left} বাকি`, lang);
}
