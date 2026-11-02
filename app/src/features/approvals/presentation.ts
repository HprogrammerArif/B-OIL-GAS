import type { IconName } from "@/components/ui/Icon";
import type { Tone } from "@/constants/theme";
import type { Urgency } from "@/types/domain/common";
import type { ApprovalCategory, InstanceStatus, StepDecision, WorkflowObjectType } from "@/types/domain/workflow";

export const CATEGORY_META: Record<ApprovalCategory, { icon: IconName; tone: Tone }> = {
  PROCUREMENT: { icon: "cart-outline", tone: "purple" },
  CLAIMS: { icon: "receipt-outline", tone: "warning" },
  FLEET: { icon: "car-outline", tone: "info" },
  LEAVE: { icon: "calendar-outline", tone: "success" },
  HR: { icon: "people-outline", tone: "neutral" },
  ASSETS: { icon: "construct-outline", tone: "accent" },
  VISITORS: { icon: "id-card-outline", tone: "accent" },
};

export const CATEGORY_FILTERS = ["ALL", "PROCUREMENT", "CLAIMS", "FLEET", "LEAVE", "ASSETS"] as const;
export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export const URGENCY_TONE: Record<Urgency, Tone> = { CRITICAL: "danger", HIGH: "warning", NORMAL: "neutral" };

export const STATUS_TONE: Record<InstanceStatus, Tone> = {
  IN_REVIEW: "info",
  APPROVED: "success",
  REJECTED: "danger",
  RETURNED: "warning",
  WITHDRAWN: "neutral",
};

export const DECISION_TONE: Record<StepDecision, Tone> = { APPROVED: "success", REJECTED: "danger", RETURNED: "warning" };

/** SLA band shown on rows and the detail header. */
export function slaTone(hoursLeft: number): Tone {
  if (hoursLeft <= 0) return "danger";
  if (hoursLeft < 12) return "warning";
  return "neutral";
}

export type PresetGroup = "claim" | "notesheet" | "requisition" | "asset" | "general";

/** Reason presets from the prototype's RejectionExplanationModal, keyed by object type. */
export const PRESETS: Record<PresetGroup, string[]> = {
  claim: ["receipts", "limit", "tripNote", "duplicate"],
  notesheet: ["budget", "quotes", "technical", "negotiate"],
  requisition: ["busy", "shuttle", "purpose"],
  asset: ["stock", "inspection", "quote"],
  general: ["papers", "manager"],
};

export function presetGroupFor(type: WorkflowObjectType): PresetGroup {
  switch (type) {
    case "Claim":
      return "claim";
    case "NoteSheet":
      return "notesheet";
    case "Requisition":
      return "requisition";
    case "AssetRequisition":
      return "asset";
    default:
      return "general";
  }
}
