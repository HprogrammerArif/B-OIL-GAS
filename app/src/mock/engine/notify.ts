import type { AppNotification } from "@/types/domain/notification";
import { nowIso } from "../clock";
import { newId } from "../crypto";
import type { MockDb } from "../db/schema";
import { mockEvents } from "../events";

export type NotifySpec = Omit<AppNotification, "id" | "readAt" | "ackedAt" | "createdAt" | "ackRequired"> & {
  ackRequired?: boolean;
  createdAt?: string;
  readAt?: string | null;
};

/** Notification engine stand-in (doc 00 §6.3): persist per recipient, then push over the realtime bus. */
export function notify(db: MockDb, userIds: (string | undefined)[], spec: NotifySpec): void {
  const recipients = Array.from(new Set(userIds.filter((id): id is string => !!id)));
  for (const userId of recipients) {
    const record = {
      ...spec,
      id: newId("ntf"),
      userId,
      ackRequired: spec.ackRequired ?? spec.priority === "CRITICAL",
      ackedAt: null,
      readAt: spec.readAt ?? null,
      createdAt: spec.createdAt ?? nowIso(),
    };
    db.notifications.unshift(record);
    const { userId: _u, ...wire } = record;
    mockEvents.emit("notification:new", [userId], wire);
  }
}
