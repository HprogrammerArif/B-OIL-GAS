import type { ModuleKey } from "./identity";
import type { Priority } from "./common";

export type NotificationCategory = "APPROVALS" | "SAFETY" | "TRANSPORT" | "PEOPLE" | "GENERAL";

/** Wire shape of doc 03 §4.2; both languages are sent so the app can switch without refetching. */
export interface AppNotification {
  id: string;
  type: string;
  priority: Priority;
  category: NotificationCategory;
  title: string;
  titleBn: string;
  body: string;
  bodyBn: string;
  data: { module: ModuleKey; objectType?: string; objectId?: string; route?: string };
  readAt: string | null;
  ackRequired: boolean;
  ackedAt: string | null;
  createdAt: string;
}

export interface UnreadCount {
  total: number;
  critical: number;
  byModule: Partial<Record<ModuleKey, number>>;
}

export interface NotificationQuery {
  unread?: boolean;
  category?: NotificationCategory;
  page?: number;
}
