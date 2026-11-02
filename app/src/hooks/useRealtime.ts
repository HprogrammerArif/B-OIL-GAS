import { useEffect } from "react";
import i18n from "@/lib/i18n";
import { isMockApi } from "@/lib/env";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import { mockEvents, type RealtimeEvent } from "@/mock/events";
import { baseApi } from "@/redux/api/baseApi";
import { LIST, type TagType } from "@/redux/api/tags";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type { AppNotification } from "@/types/domain/notification";

type Tag = TagType | { type: TagType; id: string };

/** Socket event → cache tags to invalidate (doc 03 §6.1, doc 05 §7.6). Modules add their events here. */
const EVENT_TAGS: Record<string, (payload: Record<string, unknown>) => Tag[]> = {
  "notification:new": () => [{ type: "Notification", id: LIST }, { type: "Notification", id: "COUNT" }],
  "notification:count": () => [{ type: "Notification", id: "COUNT" }],
  "inbox:changed": () => [{ type: "Inbox", id: LIST }],
  "approval:updated": (p) => [{ type: "Inbox", id: LIST }, { type: "Approval", id: String(p.instanceId) }],
};

/** Subscribes the signed-in user to realtime events while the app shell is mounted. */
export function useRealtime(): void {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.id ?? null);

  useEffect(() => {
    if (!userId) return;
    if (!isMockApi) {
      logger.info("realtime: socket transport not configured; relying on refetchOnFocus/reconnect");
      return;
    }
    const onEvent = (e: RealtimeEvent) => {
      if (e.to.length && !e.to.includes(userId)) return;
      const tags = EVENT_TAGS[e.event]?.((e.payload ?? {}) as Record<string, unknown>);
      if (tags?.length) dispatch(baseApi.util.invalidateTags(tags));
      if (e.event === "notification:new") {
        const n = e.payload as AppNotification;
        if (n.priority === "HIGH" || n.priority === "CRITICAL") {
          const bn = i18n.language === "bn";
          toast.info(bn ? n.titleBn : n.title, bn ? n.bodyBn : n.body);
        }
      }
    };
    return mockEvents.subscribe(onEvent);
  }, [dispatch, userId]);
}
