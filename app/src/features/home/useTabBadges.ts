import { usePermissions } from "@/hooks/usePermission";
import { useGetInboxSummaryQuery } from "@/features/approvals/api";
import { useGetUnreadCountQuery } from "@/features/notifications/api";

/** Inbox tab badge: pending approvals for approvers, unread notifications for everyone else. */
export function useTabBadges(): { inbox: number; unread: number } {
  const perms = usePermissions();
  const isApprover = perms.can("workflow:inbox");
  const summary = useGetInboxSummaryQuery(undefined, { skip: !isApprover });
  const unread = useGetUnreadCountQuery(undefined, { skip: !perms.loaded });
  const unreadTotal = unread.data?.total ?? 0;
  return { inbox: isApprover ? (summary.data?.pending ?? 0) : unreadTotal, unread: unreadTotal };
}
