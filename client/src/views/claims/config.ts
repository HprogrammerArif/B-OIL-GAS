/**
 * Claims — scope, lifecycle labels and the "awaiting me" rule.
 *
 * Lifecycle (docs/platform/06 BR-CL): pending_hod → pending_finance →
 * approved (voucher issued) → settled (paid). Returned claims go back to the
 * claimant, who may resubmit. Only the claimant may resubmit; nobody approves
 * their own claim.
 */
import { useMemo } from 'react';
import type { ClaimItem } from '../../store/approvalStore';
import { useCurrentUser, type CurrentUser } from '../../auth/session';
import { daysUntil } from '../../lib/clock';
import type { StatusTone } from '../../components/ui';

/** Pending claims older than this are flagged as overdue. */
export const OVERDUE_AFTER_DAYS = 5;

export const CLAIM_STATUS: Record<ClaimItem['status'], { label: [string, string]; tone: StatusTone }> = {
  pending_hod: { label: ['Awaiting HOD', 'বিভাগীয় প্রধানের অপেক্ষায়'], tone: 'warn' },
  pending_finance: { label: ['Awaiting finance', 'অর্থ বিভাগের অপেক্ষায়'], tone: 'info' },
  approved: { label: ['Approved · payment due', 'অনুমোদিত · পরিশোধ বাকি'], tone: 'success' },
  settled: { label: ['Paid', 'পরিশোধিত'], tone: 'success' },
  rejected: { label: ['Returned', 'ফেরত'], tone: 'danger' },
};

export const CLAIM_TYPE: Record<ClaimItem['type'], { label: [string, string]; tone: StatusTone }> = {
  tada: { label: ['TA/DA', 'টিএ/ডিএ'], tone: 'info' },
  conveyance: { label: ['Conveyance', 'যাতায়াত'], tone: 'purple' },
  tour_event: { label: ['Event / tour', 'ইভেন্ট / সফর'], tone: 'gold' },
};

export function isMine(claim: ClaimItem, user: CurrentUser): boolean {
  return claim.claimantEmpId ? claim.claimantEmpId === user.empId : claim.claimant === user.name;
}

export function isPending(claim: ClaimItem): boolean {
  return claim.status === 'pending_hod' || claim.status === 'pending_finance';
}

/** Days a pending claim has been waiting (0 for non-pending). */
export function daysWaiting(claim: ClaimItem): number {
  if (!isPending(claim)) return 0;
  const d = -daysUntil(claim.dateSubmitted);
  return Number.isFinite(d) && d > 0 ? d : 0;
}

export function isOverdue(claim: ClaimItem): boolean {
  return daysWaiting(claim) >= OVERDUE_AFTER_DAYS;
}

/** The decision the signed-in user can take on this claim, if any. */
export type ClaimAction = 'verify' | 'approve' | 'settle' | 'resubmit' | null;

export function actionFor(claim: ClaimItem, user: CurrentUser): ClaimAction {
  const mine = isMine(claim, user);
  if (claim.status === 'rejected') return mine ? 'resubmit' : null;
  if (mine) return null;
  if (claim.status === 'pending_hod' && user.permissions.has('claims:approve_hod')) return 'verify';
  if (claim.status === 'pending_finance' && user.permissions.has('claims:approve_finance')) return 'approve';
  if (claim.status === 'approved' && user.permissions.has('claims:approve_finance')) return 'settle';
  return null;
}

export type ClaimsFilter = 'all' | 'awaiting_me' | 'mine' | 'open' | 'paid';

export function useClaimsScope(claims: readonly ClaimItem[]) {
  const user = useCurrentUser();
  return useMemo(() => {
    if (!user) return { user: null, visible: [] as ClaimItem[], canViewAll: false, isApprover: false };
    const canViewAll = user.permissions.has('claims:view_all');
    const visible = canViewAll ? [...claims] : claims.filter((c) => isMine(c, user));
    const isApprover = user.permissions.has('claims:approve_hod') || user.permissions.has('claims:approve_finance');
    return { user, visible, canViewAll, isApprover };
  }, [claims, user]);
}

export function applyFilter(claims: readonly ClaimItem[], filter: ClaimsFilter, user: CurrentUser): ClaimItem[] {
  switch (filter) {
    case 'awaiting_me':
      return claims.filter((c) => actionFor(c, user) !== null && actionFor(c, user) !== 'resubmit');
    case 'mine':
      return claims.filter((c) => isMine(c, user));
    case 'open':
      return claims.filter((c) => isPending(c) || c.status === 'rejected');
    case 'paid':
      return claims.filter((c) => c.status === 'settled' || c.status === 'approved');
    default:
      return [...claims];
  }
}
