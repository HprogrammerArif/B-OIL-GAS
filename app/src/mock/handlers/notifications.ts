import { z } from "zod";
import type { AppNotification, UnreadCount } from "@/types/domain/notification";
import { nowIso } from "../clock";
import { commit } from "../db";
import type { MockNotification } from "../db/schema";
import { mockEvents } from "../events";
import { noContent, notFound, ok, paginate, validationError } from "../http";
import { register, requireAuth, type HandlerContext } from "../router";

const listQuery = z.object({
  unread: z.enum(["true", "false"]).optional(),
  category: z.enum(["APPROVALS", "SAFETY", "TRANSPORT", "PEOPLE", "GENERAL"]).optional(),
});

const toWire = ({ userId: _u, ...n }: MockNotification): AppNotification => n;

function mine(ctx: HandlerContext): MockNotification[] {
  const { user } = requireAuth(ctx);
  return ctx.db.notifications.filter((n) => n.userId === user.id);
}

function find(ctx: HandlerContext): MockNotification {
  const n = mine(ctx).find((x) => x.id === ctx.params.id);
  if (!n) throw notFound("Notification");
  return n;
}

function count(items: MockNotification[]): UnreadCount {
  const unread = items.filter((n) => !n.readAt);
  const byModule: UnreadCount["byModule"] = {};
  unread.forEach((n) => {
    byModule[n.data.module] = (byModule[n.data.module] ?? 0) + 1;
  });
  return { total: unread.length, critical: unread.filter((n) => n.priority === "CRITICAL" && !n.ackedAt).length, byModule };
}

function pushCount(ctx: HandlerContext): void {
  const { user } = requireAuth(ctx);
  const c = count(mine(ctx));
  mockEvents.emit("notification:count", [user.id], { total: c.total, critical: c.critical });
}

register([
  {
    method: "GET",
    path: "/notifications",
    handler: (ctx) => {
      const parsed = listQuery.safeParse(ctx.query);
      if (!parsed.success) throw validationError("query", "Invalid filters");
      const { unread, category } = parsed.data;
      const items = mine(ctx)
        .filter((n) => unread !== "true" || !n.readAt)
        .filter((n) => !category || n.category === category)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(toWire);
      return paginate(items, ctx.query, 30);
    },
  },
  {
    method: "GET",
    path: "/notifications/unread-count",
    handler: (ctx) => ok(count(mine(ctx))),
  },
  {
    method: "POST",
    path: "/notifications/read-all",
    handler: (ctx) => {
      const at = nowIso();
      mine(ctx).forEach((n) => {
        if (!n.readAt && !(n.ackRequired && !n.ackedAt)) n.readAt = at;
      });
      commit();
      pushCount(ctx);
      return noContent();
    },
  },
  {
    method: "POST",
    path: "/notifications/:id/read",
    handler: (ctx) => {
      const n = find(ctx);
      n.readAt ??= nowIso();
      commit();
      pushCount(ctx);
      return ok(toWire(n));
    },
  },
  {
    method: "POST",
    path: "/notifications/:id/ack",
    handler: (ctx) => {
      const n = find(ctx);
      const at = nowIso();
      n.ackedAt ??= at;
      n.readAt ??= at;
      commit();
      pushCount(ctx);
      return ok(toWire(n));
    },
  },
]);
