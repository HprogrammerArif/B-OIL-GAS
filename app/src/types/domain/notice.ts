import type { PersonRef, Priority } from "./common";

export type NoticeCategory = "HR" | "ADMIN" | "SAFETY" | "POLICY" | "OPERATIONS" | "FINANCE" | "EXECUTIVE";
export type NoticeStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "EXPIRED" | "ARCHIVED";
export type AudienceType = "ALL" | "SITE" | "DEPARTMENT" | "ROLE" | "GRADE" | "USER";

export interface NoticeAudienceRef {
  type: AudienceType;
  refId: string | null;
}

/** Audience as displayed, with the resolved headcount (doc 03 §7 `audience/preview`). */
export interface NoticeAudience extends NoticeAudienceRef {
  label: string;
  labelBn: string;
  recipientCount: number;
}

/** The caller's own receipt; `null` when the caller is not a recipient (e.g. the author). */
export interface NoticeReceipt {
  readAt: string | null;
  ackedAt: string | null;
}

/** Doc 03 §7 list row; both languages are sent so the app can switch without refetching. */
export interface NoticeListItem {
  id: string;
  refNo: string;
  title: string;
  titleBn: string | null;
  excerpt: string;
  excerptBn: string | null;
  category: NoticeCategory;
  priority: Priority;
  status: NoticeStatus;
  isPinned: boolean;
  requiresAck: boolean;
  isBroadcast: boolean;
  publishAt: string | null;
  expiresAt: string | null;
  author: PersonRef;
  recipientCount: number;
  ackCount: number;
  receipt: NoticeReceipt | null;
}

/** Server-computed affordances; the UI never derives these from roles. */
export interface NoticeViewer {
  canAck: boolean;
  canPin: boolean;
  canArchive: boolean;
  canViewReceipts: boolean;
}

export interface Notice extends NoticeListItem {
  body: string;
  bodyBn: string | null;
  referenceNo: string | null;
  audiences: NoticeAudience[];
  readCount: number;
  viewer: NoticeViewer;
}

export interface NoticeQuery {
  category?: NoticeCategory;
  unread?: boolean;
  requiresAck?: boolean;
  q?: string;
  page?: number;
}

export interface NoticeReceiptRow {
  person: PersonRef;
  readAt: string | null;
  ackedAt: string | null;
}

export interface NoticeReceipts {
  recipientCount: number;
  readCount: number;
  ackCount: number;
  /** Recipients with app accounts; the remainder are counted but not listed. */
  rows: NoticeReceiptRow[];
}

/** What the caller may publish: categories and audiences are filtered by role and scope server-side. */
export interface ComposeOptions {
  categories: NoticeCategory[];
  audiences: NoticeAudience[];
  maxPinned: number;
  pinnedCount: number;
}

export interface CreateNoticeRequest {
  title: string;
  titleBn?: string;
  body: string;
  bodyBn?: string;
  category: NoticeCategory;
  priority: Priority;
  isPinned: boolean;
  requiresAck: boolean;
  referenceNo?: string;
  audiences: NoticeAudienceRef[];
  channels: ("IN_APP" | "PUSH" | "SMS")[];
}

export interface ActiveBroadcast {
  id: string;
  noticeId: string;
  title: string;
  titleBn: string | null;
  body: string;
  bodyBn: string | null;
  requiresAck: boolean;
  ackedAt: string | null;
  author: PersonRef;
  createdAt: string;
  activeUntil: string | null;
}

export interface CreateBroadcastRequest {
  title: string;
  titleBn?: string;
  body: string;
  bodyBn?: string;
  requiresAck: boolean;
  sendSms: boolean;
}
