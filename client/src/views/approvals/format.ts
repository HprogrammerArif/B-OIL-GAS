import { t, type Lang } from '../../types';
import type { ApprovalItem } from '../../store/approvalStore';

/** ৳48,50,000 — Bangladeshi (lakh/crore) digit grouping. */
export function formatTaka(amount: number): string {
  return `৳${amount.toLocaleString('en-IN')}`;
}

/** ৳94.12 Lakh / ৳1.20 Crore for KPI tiles; exact figure stays in the sub-label. */
export function formatTakaCompact(amount: number, lang: Lang): string {
  if (amount >= 10_000_000) return `৳${(amount / 10_000_000).toFixed(2)} ${t('Crore', 'কোটি', lang)}`;
  if (amount >= 100_000) return `৳${(amount / 100_000).toFixed(2)} ${t('Lakh', 'লক্ষ', lang)}`;
  return formatTaka(amount);
}

export type SlaTone = 'overdue' | 'danger' | 'warn' | 'ok';

export const SLA_URGENT_HOURS = 12;

export function slaTone(hoursLeft: number): SlaTone {
  if (hoursLeft <= 0) return 'overdue';
  if (hoursLeft < SLA_URGENT_HOURS) return 'danger';
  if (hoursLeft < 24) return 'warn';
  return 'ok';
}

export function slaLabel(hoursLeft: number, lang: Lang): string {
  if (hoursLeft <= 0) return t('Overdue', 'সময় অতিক্রান্ত', lang);
  if (hoursLeft < 24) return t(`${hoursLeft}h left`, `${hoursLeft} ঘণ্টা বাকি`, lang);
  const days = Math.floor(hoursLeft / 24);
  const hours = hoursLeft % 24;
  return t(`${days}d ${hours}h left`, `${days} দিন ${hours} ঘণ্টা বাকি`, lang);
}

export const URGENCY_LABEL: Record<ApprovalItem['urgency'], [string, string]> = {
  critical: ['Critical', 'অত্যন্ত জরুরি'],
  high: ['High priority', 'উচ্চ অগ্রাধিকার'],
  normal: ['Normal', 'সাধারণ'],
};

export const SOURCE_LABEL: Record<NonNullable<ApprovalItem['sourceType']>, [string, string]> = {
  notesheet: ['Note-sheet', 'নোটশিট'],
  claim: ['Expense claim', 'ব্যয় দাবি'],
  requisition: ['Vehicle requisition', 'গাড়ির আবেদন'],
  leave: ['Leave application', 'ছুটির আবেদন'],
  asset_req: ['Asset requisition', 'সম্পদ আবেদন'],
  generic: ['General request', 'সাধারণ আবেদন'],
};

const TITLE_TOKENS = new Set(['engr.', 'md.', 'mr.', 'mrs.', 'ms.', 'dr.', 'adv.', 'eng.']);

export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter((p) => p && !TITLE_TOKENS.has(p.toLowerCase()));
  const picked = parts.length >= 2 ? [parts[0], parts[1]] : parts.slice(0, 1);
  return picked.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/** Stable 0–4 bucket so each requester keeps the same avatar colour. */
export function avatarTone(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) % 997;
  return h % 5;
}

export type SortKey = 'sla' | 'amount' | 'requester';
