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
import type { AppRole } from '../../types';
import type { ApprovalItem } from '../../store/approvalStore';
import type { CurrentUser } from '../../auth/session';

type Category = ApprovalItem['category'];

export interface ApprovalsRoleConfig {
  /** Queues this approver decides; also drives the category chips. */
  categories: Category[];
  /** Heading + description shown above the inbox (EN, BN). */
  title: [string, string];
  description: [string, string];
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
    title: ['Approvals awaiting your signature', 'আপনার স্বাক্ষরের অপেক্ষায় থাকা অনুমোদন'],
    description: [
      'High-value purchase files and financial sanctions endorsed by the departments and ready for executive decision.',
      'বিভাগীয় সুপারিশসহ উচ্চমূল্যের ক্রয় নথি ও আর্থিক অনুমোদন, নির্বাহী সিদ্ধান্তের জন্য প্রস্তুত।',
    ],
    canBatch: true,
    accepts: (item) => (item.costTk ?? 0) >= EXECUTIVE_THRESHOLD_BDT,
  },
  hod: {
    categories: ['finance', 'procurement', 'fleet', 'leave'],
    title: ['Finance approval inbox', 'অর্থ বিভাগের অনুমোদন ইনবক্স'],
    description: [
      'Expense claims, purchase requests under ৳10 lakh, vehicle bookings and leave applications from your department.',
      'ভ্রমণ বিল, ১০ লক্ষ টাকার নিচের ক্রয় আবেদন, গাড়ির বুকিং এবং আপনার বিভাগের ছুটির আবেদন।',
    ],
    canBatch: false,
    accepts: (item, user) => {
      if (item.category === 'procurement') return (item.costTk ?? 0) < FINANCE_PROCUREMENT_CEILING_BDT;
      if (item.category === 'leave') return item.dept === user.dept;
      return true;
    },
  },
  plant_gm: {
    categories: ['procurement', 'fleet', 'leave'],
    title: ['Plant approvals', 'প্ল্যান্ট অনুমোদন'],
    description: [
      'Spares and services for Keraniganj, plant vehicle bookings and leave for plant staff.',
      'কেরানীগঞ্জ প্ল্যান্টের যন্ত্রাংশ ও সেবা, প্ল্যান্টের গাড়ির বুকিং এবং প্ল্যান্ট কর্মীদের ছুটি।',
    ],
    canBatch: false,
    accepts: (item) => PLANT_DEPTS.has(item.dept),
  },
  hr_admin: {
    categories: ['leave', 'hr'],
    title: ['Leave & HR approvals', 'ছুটি ও মানবসম্পদ অনুমোদন'],
    description: [
      'Leave applications and HR files awaiting policy clearance.',
      'নীতিমালা অনুযায়ী ছাড়পত্রের অপেক্ষায় থাকা ছুটির আবেদন ও মানবসম্পদ নথি।',
    ],
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

/** Predicate selecting the items this user decides. */
export function approvalQueuePredicate(user: CurrentUser): (item: ApprovalItem) => boolean {
  const cfg = APPROVALS_CONFIG[user.role];
  if (!cfg) return () => false;
  const cats = new Set<Category>(cfg.categories);
  return (item) =>
    cats.has(item.category) &&
    item.requester !== user.name &&
    (cfg.accepts ? cfg.accepts(item, user) : true);
}
