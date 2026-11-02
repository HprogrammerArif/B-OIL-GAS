import type { Priority } from "@/types/domain/common";
import type { RoleKey } from "@/types/domain/identity";
import type { Notice, NoticeAudience, NoticeAudienceRef, NoticeCategory, NoticeListItem } from "@/types/domain/notice";
import { nowIso } from "../clock";
import type { MockDb, MockNotice, MockUser } from "../db/schema";
import { mockEvents } from "../events";
import { hasGrant, type AuthContext } from "../router";
import { DEPARTMENTS } from "../seed/org";
import { notify } from "./notify";
import { employeeById, personRef } from "./people";

export const NOTICE_CATEGORIES = [
  "EXECUTIVE", "SAFETY", "OPERATIONS", "HR", "ADMIN", "POLICY", "FINANCE",
] as const satisfies readonly NoticeCategory[];
export const MAX_PINNED = 5;
const DEFAULT_EXPIRY_DAYS = 90;
const COMPANY_HEADCOUNT = 1240;

const DEPT_HEADCOUNT: Record<string, number> = {
  dept_exec: 12, dept_plant: 164, dept_sales: 210, dept_fin: 48, dept_trans: 180, dept_hse: 18, dept_hr: 26, dept_sec: 40,
};

interface AudienceDef extends NoticeAudienceRef {
  label: string;
  labelBn: string;
  headcount: number;
}

/** Audience presets from the web prototype's publish form, plus one entry per department for scoped publishers. */
const AUDIENCES: AudienceDef[] = [
  { type: "ALL", refId: null, label: "All Group Employees", labelBn: "গ্রুপের সকল কর্মী", headcount: COMPANY_HEADCOUNT },
  { type: "SITE", refId: "site_plant", label: "Keraniganj Refinery & Field Engineering", labelBn: "কেরানীগঞ্জ রিফাইনারি ও ফিল্ড ইঞ্জিনিয়ারিং", headcount: 218 },
  { type: "SITE", refId: "site_hq", label: "Baridhara Corporate HQ", labelBn: "বারিধারা কর্পোরেট প্রধান কার্যালয়", headcount: 520 },
  { type: "ROLE", refId: "DRIVER", label: "Central Logistics & Fleet Crew", labelBn: "কেন্দ্রীয় লজিস্টিক্স ও ফ্লিট ক্রু", headcount: 142 },
  { type: "ROLE", refId: "HOD", label: "Department Heads", labelBn: "বিভাগীয় প্রধানগণ", headcount: 32 },
  ...DEPARTMENTS.map((d): AudienceDef => ({
    type: "DEPARTMENT", refId: d.id, label: d.name, labelBn: d.nameBn, headcount: DEPT_HEADCOUNT[d.id] ?? 20,
  })),
];

const sameAudience = (a: NoticeAudienceRef, b: NoticeAudienceRef) => a.type === b.type && (a.refId ?? null) === (b.refId ?? null);

function audienceDef(ref: NoticeAudienceRef): AudienceDef | undefined {
  return AUDIENCES.find((a) => sameAudience(a, ref));
}

const toAudience = ({ headcount, ...a }: AudienceDef): NoticeAudience => ({ ...a, recipientCount: headcount });

export function describeAudiences(refs: NoticeAudienceRef[]): NoticeAudience[] {
  return refs.map((r) => audienceDef(r)).filter((a): a is AudienceDef => !!a).map(toAudience);
}

/** Headcount across the audience; overlaps between presets are ignored in the mock. */
export function headcountOf(refs: NoticeAudienceRef[]): number {
  if (refs.some((r) => r.type === "ALL")) return COMPANY_HEADCOUNT;
  const sum = refs.reduce((n, r) => n + (audienceDef(r)?.headcount ?? 0), 0);
  return Math.min(sum, COMPANY_HEADCOUNT);
}

function inAudience(db: MockDb, user: MockUser, a: NoticeAudienceRef): boolean {
  const emp = employeeById(db, user.employeeId);
  switch (a.type) {
    case "ALL":
      return true;
    case "SITE":
      return emp?.site.id === a.refId;
    case "DEPARTMENT":
      return emp?.department.id === a.refId;
    case "ROLE":
      return user.roles.includes(a.refId as RoleKey);
    case "GRADE":
      return emp?.grade.id === a.refId;
    case "USER":
      return user.id === a.refId;
  }
}

/** Active, non-offboarded account holders addressed by the audience, excluding the author (BR-01-01). */
export function recipientUsers(db: MockDb, refs: NoticeAudienceRef[], authorEmployeeId: string): MockUser[] {
  return db.users.filter(
    (u) =>
      u.isActive &&
      u.employeeId !== authorEmployeeId &&
      employeeById(db, u.employeeId)?.status !== "OFFBOARDED" &&
      refs.some((a) => inAudience(db, u, a)),
  );
}

/** Categories the caller may publish (doc 06 MOD-01 permissions); empty without `notices:publish`. */
export function composeCategories(auth: AuthContext): NoticeCategory[] {
  if (!hasGrant(auth, "notices:publish")) return [];
  const roles = auth.user.roles;
  const allowed = new Set<NoticeCategory>();
  const add = (...cs: NoticeCategory[]) => cs.forEach((c) => allowed.add(c));
  if (roles.includes("CHAIRMAN") || roles.includes("DIRECTOR")) add(...NOTICE_CATEGORIES);
  if (roles.includes("HR_ADMIN")) add("HR", "ADMIN", "POLICY", "SAFETY", "OPERATIONS", "FINANCE");
  if (roles.includes("HOD") || roles.includes("PLANT_GM")) add("OPERATIONS", "SAFETY", "ADMIN");
  if (roles.includes("FINANCE")) add("FINANCE");
  if (roles.includes("HSE_OFFICER")) add("SAFETY");
  return NOTICE_CATEGORIES.filter((c) => allowed.has(c));
}

/** Audiences inside the caller's `notices:publish` scope: company-wide, own site, or own department. */
export function composeAudiences(auth: AuthContext): NoticeAudience[] {
  const grant = auth.grants.find((g) => g.key === "notices:publish");
  if (!grant) return [];
  const me = auth.employee;
  return AUDIENCES.filter((a) => {
    if (grant.scope === "COMPANY") return true;
    if (a.type === "DEPARTMENT") return a.refId === me.department.id;
    return grant.scope === "SITE" && a.type === "SITE" && a.refId === me.site.id;
  }).map(toAudience);
}

export function canComposeAudience(auth: AuthContext, ref: NoticeAudienceRef): boolean {
  return composeAudiences(auth).some((a) => sameAudience(a, ref));
}

/* ─── Read model ──────────────────────────────────────────────────────────── */

export function counts(n: MockNotice) {
  return {
    recipientCount: n.receipts.length + n.offline.recipients,
    readCount: n.receipts.filter((r) => r.readAt).length + n.offline.reads,
    ackCount: n.receipts.filter((r) => r.ackedAt).length + n.offline.acks,
  };
}

export function receiptOf(n: MockNotice, userId: string) {
  return n.receipts.find((r) => r.userId === userId) ?? null;
}

/** Recipient, author, or `notices:manage`; anyone else gets 404 so targeting does not leak. */
export function canReadNotice(auth: AuthContext, n: MockNotice): boolean {
  return !!receiptOf(n, auth.user.id) || n.authorEmployeeId === auth.employee.id || hasGrant(auth, "notices:manage");
}

function excerpt(text: string | null): string | null {
  if (!text) return null;
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > 160 ? `${flat.slice(0, 157).trimEnd()}…` : flat;
}

export function isBroadcastNotice(db: MockDb, n: MockNotice): boolean {
  return db.broadcasts.some((b) => b.noticeId === n.id);
}

export function toNoticeListItem(db: MockDb, n: MockNotice, userId: string): NoticeListItem {
  const receipt = receiptOf(n, userId);
  const { recipientCount, ackCount } = counts(n);
  return {
    id: n.id,
    refNo: n.refNo,
    title: n.title,
    titleBn: n.titleBn,
    excerpt: excerpt(n.body) ?? "",
    excerptBn: excerpt(n.bodyBn),
    category: n.category,
    priority: n.priority,
    status: n.status,
    isPinned: n.isPinned,
    requiresAck: n.requiresAck,
    isBroadcast: isBroadcastNotice(db, n),
    publishAt: n.publishAt,
    expiresAt: n.expiresAt,
    author: personRef(db, n.authorEmployeeId),
    recipientCount,
    ackCount,
    receipt: receipt ? { readAt: receipt.readAt, ackedAt: receipt.ackedAt } : null,
  };
}

export function toNoticeWire(db: MockDb, n: MockNotice, auth: AuthContext): Notice {
  const receipt = receiptOf(n, auth.user.id);
  const manage = hasGrant(auth, "notices:manage");
  const published = n.status === "PUBLISHED";
  return {
    ...toNoticeListItem(db, n, auth.user.id),
    body: n.body,
    bodyBn: n.bodyBn,
    referenceNo: n.referenceNo,
    audiences: describeAudiences(n.audiences),
    readCount: counts(n).readCount,
    viewer: {
      canAck: published && n.requiresAck && !!receipt && !receipt.ackedAt,
      canPin: published && manage,
      canArchive: published && manage,
      canViewReceipts: manage || n.authorEmployeeId === auth.employee.id,
    },
  };
}

/** Pinned first, then newest (doc 05 §9.2). */
export function noticeOrder(a: MockNotice, b: MockNotice): number {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  return (b.publishAt ?? b.createdAt).localeCompare(a.publishAt ?? a.createdAt);
}

export function isLive(n: MockNotice, now = Date.now()): boolean {
  return n.status === "PUBLISHED" && (!n.expiresAt || Date.parse(n.expiresAt) > now);
}

/* ─── Commands ────────────────────────────────────────────────────────────── */

export function nextNoticeRef(db: MockDb): string {
  const year = new Date().getFullYear();
  const key = `notice:${year}`;
  const next = (db.counters[key] ?? 0) + 1;
  db.counters[key] = next;
  return `NOT-${year}-${String(next).padStart(4, "0")}`;
}

function notificationPriority(p: Priority): Priority {
  return p === "LOW" ? "NORMAL" : p;
}

/** DRAFT → PUBLISHED: snapshot receipts, count the rest of the headcount, notify and push (BR-01-03/04). */
export function publish(db: MockDb, n: MockNotice, opts: { type?: string } = {}): void {
  const recipients = recipientUsers(db, n.audiences, n.authorEmployeeId);
  n.status = "PUBLISHED";
  n.publishAt = nowIso();
  n.expiresAt ??= new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 86_400_000).toISOString();
  n.receipts = recipients.map((u) => ({ userId: u.id, readAt: null, ackedAt: null }));
  n.offline = { recipients: Math.max(headcountOf(n.audiences) - recipients.length, 0), reads: 0, acks: 0 };
  const author = personRef(db, n.authorEmployeeId);
  notify(db, recipients.map((u) => u.id), {
    type: opts.type ?? "NOTICE_PUBLISHED",
    priority: notificationPriority(n.priority),
    category: n.category === "SAFETY" ? "SAFETY" : "GENERAL",
    title: n.title,
    titleBn: n.titleBn ?? n.title,
    body: `${n.refNo} · ${author.name}`,
    bodyBn: `${n.refNo} · ${author.nameBn}`,
    data: { module: "notices", objectType: "Notice", objectId: n.id, route: `/notices/${n.id}` },
    ackRequired: criticalAck(n),
  });
  mockEvents.emit("notice:published", recipients.map((u) => u.id), { noticeId: n.id });
}

/** CRITICAL notices needing acknowledgement raise the blocking modal through their notification (doc 05 §7.4). */
export function criticalAck(n: Pick<MockNotice, "priority" | "requiresAck">): boolean {
  return n.priority === "CRITICAL" && n.requiresAck;
}

/** Mirrors notice read/ack onto the notifications that announced it so badges clear together. */
export function syncNotifications(db: MockDb, noticeId: string, userId: string, kind: "read" | "ack"): void {
  const at = nowIso();
  for (const ntf of db.notifications) {
    if (ntf.userId !== userId || ntf.data.objectId !== noticeId) continue;
    // Like read-all, reading never clears a pending blocking acknowledgement.
    if (kind === "read" && ntf.ackRequired && !ntf.ackedAt) continue;
    ntf.readAt ??= at;
    if (kind === "ack") ntf.ackedAt ??= at;
  }
}

/** Records the caller's acknowledgement once (BR-01-05); returns false when nothing changed. */
export function ackReceipt(db: MockDb, n: MockNotice, userId: string): boolean {
  const receipt = receiptOf(n, userId);
  if (!receipt || !n.requiresAck || receipt.ackedAt) return false;
  const at = nowIso();
  receipt.ackedAt = at;
  receipt.readAt ??= at;
  syncNotifications(db, n.id, userId, "ack");
  return true;
}
