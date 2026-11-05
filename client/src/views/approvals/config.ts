/**
 * Approvals — per-role queue configuration.
 *
 * Which items land in an approver's inbox is decided here, in one place,
 * instead of with inline `role === …` conditionals in the view. Mirrors the
 * routing rules in docs/platform/06 (BR-AP) at prototype fidelity:
 *   - Chairman signs high-value procurement/finance files (≥ ৳1,00,000).
 *   - Finance HOD clears claims, mid-value procurement, vehicle bookings and
 *     leave for their own department.
 *   - Plant GM clears plant-site procurement and vehicle bookings.
 *   - HR clears leave and HR files.
 * Nobody sees their own requests in their inbox.
 */
import { useMemo } from 'react';
import type { AppRole } from '../../types';
import { useApprovalStore, type ApprovalItem } from '../../store/approvalStore';
import { useNotesheetStore, isTurnOf, type NoteFile } from '../../store/notesheetStore';
import { useCurrentUser, type CurrentUser } from '../../auth/session';

type Category = ApprovalItem['category'];

export interface ApprovalsRoleConfig {
  /** Queues this approver decides; also drives the category chips. */
  categories: Category[];
  /** Whether multi-select batch approval is offered. */
  canBatch: boolean;
  /** Extra predicate beyond category membership. */
  accepts?: (item: ApprovalItem, user: CurrentUser) => boolean;
}

const EXECUTIVE_THRESHOLD_BDT = 100_000;
const FINANCE_PROCUREMENT_CEILING_BDT = 1_000_000;

const PLANT_DEPTS = new Set([
  'Plant Operations',
  'Plant Maintenance',
  'HSE & Compliance',
  'Quality Lab',
  'Refinery Utilities',
  'Transport & Logistics',
  'Security Administration',
]);

export const APPROVALS_CONFIG: Partial<Record<AppRole, ApprovalsRoleConfig>> = {
  chairman: {
    categories: ['procurement', 'finance'],
    canBatch: true,
    accepts: (item) => (item.costTk ?? 0) >= EXECUTIVE_THRESHOLD_BDT,
  },
  hod: {
    categories: ['finance', 'procurement', 'fleet', 'leave'],
    canBatch: false,
    accepts: (item, user) => {
      if (item.category === 'procurement') return (item.costTk ?? 0) < FINANCE_PROCUREMENT_CEILING_BDT;
      if (item.category === 'leave') return item.dept === user.dept;
      return true;
    },
  },
  plant_gm: {
    categories: ['procurement', 'fleet', 'leave'],
    canBatch: false,
    accepts: (item) => PLANT_DEPTS.has(item.dept),
  },
  hr_admin: {
    categories: ['leave', 'hr'],
    canBatch: true,
  },
};

export const CATEGORY_LABELS: Record<Category, [string, string]> = {
  procurement: ['Procurement & Spares', 'ক্রয় ও খুচরা যন্ত্রাংশ'],
  finance: ['Travel & Expense Claims', 'ভ্রমণ ও যাতায়াত বিল'],
  fleet: ['Vehicle Bookings', 'গাড়ির আবেদন'],
  leave: ['Staff Leave', 'ছুটির আবেদন'],
  hr: ['HR Files', 'মানবসম্পদ নথি'],
};

/**
 * Predicate selecting the items this user decides. Items mirrored from a
 * note-sheet additionally follow the file's signatory route: they appear
 * only in the inbox of the officer whose signature is due next.
 */
export function approvalQueuePredicate(
  user: CurrentUser,
  noteFiles: readonly NoteFile[] = [],
): (item: ApprovalItem) => boolean {
  const cfg = APPROVALS_CONFIG[user.role];
  if (!cfg) return () => false;
  const cats = new Set<Category>(cfg.categories);
  return (item) => {
    if (!cats.has(item.category) || item.requester === user.name) return false;
    if (cfg.accepts && !cfg.accepts(item, user)) return false;
    if (item.sourceType === 'notesheet' && item.sourceId) {
      const file = noteFiles.find((f) => f.id === item.sourceId || f.fileNo === item.sourceId);
      if (file) return isTurnOf(file, user.role);
    }
    return true;
  };
}

/**
 * The signed-in user's pending and decided queues. Used by the Approvals view,
 * the sidebar badge, the notification centre and the dashboards so every
 * count on screen agrees.
 */
export function useMyApprovalQueue() {
  const user = useCurrentUser();
  const { approvalItems, decidedItems } = useApprovalStore();
  const { files: noteFiles } = useNotesheetStore();
  const inQueue = useMemo(
    () => (user ? approvalQueuePredicate(user, noteFiles) : () => false),
    [user, noteFiles],
  );
  const pending = useMemo(() => approvalItems.filter(inQueue), [approvalItems, inQueue]);
  const decided = useMemo(
    () =>
      decidedItems.filter(
        (d) =>
          inQueue(d) ||
          (user ? d.authorizedBy?.startsWith(user.name) || d.rejectedBy?.startsWith(user.name) : false),
      ),
    [decidedItems, inQueue, user],
  );
  return { user, config: user ? APPROVALS_CONFIG[user.role] : undefined, pending, decided };
}
