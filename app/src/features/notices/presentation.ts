import type { IconName } from "@/components/ui/Icon";
import type { Tone } from "@/constants/theme";
import type { Priority } from "@/types/domain/common";
import type { NoticeAudienceRef, NoticeCategory } from "@/types/domain/notice";

export const CATEGORY_META: Record<NoticeCategory, { icon: IconName; tone: Tone }> = {
  EXECUTIVE: { icon: "ribbon-outline", tone: "executive" },
  SAFETY: { icon: "warning-outline", tone: "danger" },
  OPERATIONS: { icon: "construct-outline", tone: "info" },
  HR: { icon: "people-outline", tone: "purple" },
  ADMIN: { icon: "briefcase-outline", tone: "neutral" },
  POLICY: { icon: "document-text-outline", tone: "accent" },
  FINANCE: { icon: "cash-outline", tone: "success" },
};

export const PRIORITY_TONE: Record<Priority, Tone> = { CRITICAL: "danger", HIGH: "warning", NORMAL: "info", LOW: "neutral" };

export const PRIORITIES: Priority[] = ["NORMAL", "HIGH", "CRITICAL"];

/** List filter row: status filters first, then categories. */
export const NOTICE_FILTERS = ["ALL", "UNREAD", "ACK", "EXECUTIVE", "SAFETY", "OPERATIONS", "HR", "POLICY", "ADMIN", "FINANCE"] as const;
export type NoticeFilter = (typeof NOTICE_FILTERS)[number];

export function audienceKey(a: NoticeAudienceRef): string {
  return `${a.type}:${a.refId ?? ""}`;
}

export function parseAudienceKey(key: string): NoticeAudienceRef {
  const [type, refId] = key.split(":");
  return { type: type as NoticeAudienceRef["type"], refId: refId || null };
}
