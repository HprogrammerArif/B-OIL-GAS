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

/** Parse human-readable demo dates ('Today, 09:30 AM', 'Yesterday', '28 Oct 2026') to epoch ms for accurate sorting. */
export function parseApprovalDate(d?: string): number {
  if (!d) return 0;
  if (d.startsWith('Today')) {
    const timeMatch = d.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    const date = new Date();
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const mins = parseInt(timeMatch[2], 10);
      const meridian = timeMatch[3]?.toUpperCase();
      if (meridian === 'PM' && hours < 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;
      date.setHours(hours, mins, 0, 0);
    }
    return date.getTime();
  }
  if (d.startsWith('Yesterday')) {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.getTime();
  }
  const parsed = Date.parse(d);
  return isNaN(parsed) ? 0 : parsed;
}

export type SortKey =
  | 'sla'
  | 'sla_asc'
  | 'sla_desc'
  | 'amount'
  | 'amount_desc'
  | 'amount_asc'
  | 'date_desc'
  | 'date_asc'
  | 'requester'
  | 'requester_asc'
  | 'requester_desc';
