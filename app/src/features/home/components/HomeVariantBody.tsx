import { usePermissions } from "@/hooks/usePermission";
import { ApprovalsHomeCard } from "@/features/approvals/components/ApprovalsHomeCard";
import type { HomeVariant } from "../persona-resolver";

/**
 * Variant-specific cards (punch card, inbox summary, trip console, gate queue…).
 * Each card is owned by its module and gated by permission; modules register here as they land.
 */
export function HomeVariantBody({ variant }: { variant: HomeVariant }) {
  const perms = usePermissions();
  const showApprovals = (variant === "approver" || variant === "executive") && perms.can("workflow:inbox");
  return showApprovals ? <ApprovalsHomeCard /> : null;
}
