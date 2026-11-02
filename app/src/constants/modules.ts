import type { IconName } from "@/components/ui/Icon";
import type { Tone } from "./theme";
import type { ModuleKey } from "@/types/domain/identity";

export interface ModuleMeta {
  key: ModuleKey;
  icon: IconName;
  tone: Tone;
  href: string;
}

/** Mobile module registry (doc 00 §7); order is the More-grid order. */
export const MODULES: ModuleMeta[] = [
  { key: "dashboards", icon: "analytics-outline", tone: "executive", href: "/dashboard" },
  { key: "approvals", icon: "checkmark-done-outline", tone: "accent", href: "/inbox" },
  { key: "notices", icon: "megaphone-outline", tone: "info", href: "/notices" },
  { key: "note-sheets", icon: "document-text-outline", tone: "purple", href: "/note-sheets" },
  { key: "chat", icon: "chatbubbles-outline", tone: "executive", href: "/chat" },
  { key: "attendance", icon: "finger-print-outline", tone: "success", href: "/attendance" },
  { key: "leave", icon: "calendar-outline", tone: "success", href: "/leave" },
  { key: "claims", icon: "receipt-outline", tone: "warning", href: "/claims" },
  { key: "fleet", icon: "car-sport-outline", tone: "info", href: "/fleet" },
  { key: "bus", icon: "bus-outline", tone: "info", href: "/bus" },
  { key: "parcels", icon: "cube-outline", tone: "purple", href: "/parcels" },
  { key: "visitors", icon: "id-card-outline", tone: "accent", href: "/visitors" },
  { key: "incidents", icon: "warning-outline", tone: "danger", href: "/incidents" },
  { key: "assets", icon: "construct-outline", tone: "neutral", href: "/assets" },
  { key: "compliance", icon: "shield-checkmark-outline", tone: "warning", href: "/compliance" },
  { key: "employees", icon: "people-outline", tone: "neutral", href: "/workforce" },
];

export const moduleMeta = (key: ModuleKey): ModuleMeta | undefined => MODULES.find((m) => m.key === key);
