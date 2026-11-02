import { z } from "zod";
import type { ActiveBroadcast, ComposeOptions, NoticeReceipts } from "@/types/domain/notice";
import { hoursFromNow, nowIso } from "../clock";
import { newId } from "../crypto";
import { commit } from "../db";
import type { MockNotice } from "../db/schema";
import { mockEvents } from "../events";
import {
  ackReceipt,
  canComposeAudience,
  canReadNotice,
  composeAudiences,
  composeCategories,
  counts,
  isLive,
  MAX_PINNED,
  nextNoticeRef,
  NOTICE_CATEGORIES,
  noticeOrder,
  publish,
  receiptOf,
  syncNotifications,
  toNoticeListItem,
  toNoticeWire,
} from "../engine/notices";
import { personRef, userForEmployee } from "../engine/people";
import { forbidden, HttpError, invalidTransition, matchesSearch, noContent, notFound, ok, paginate, policyViolation, validationError } from "../http";
import { hasGrant, register, requireAuth, type AuthContext, type HandlerContext } from "../router";

const categoryEnum = z.enum(NOTICE_CATEGORIES);

const listQuery = z.object({
  category: categoryEnum.optional(),
  unread: z.enum(["true", "false"]).optional(),
  requiresAck: z.enum(["true", "false"]).optional(),
  q: z.string().trim().max(80).optional(),
});

const audienceRef = z.object({
  type: z.enum(["ALL", "SITE", "DEPARTMENT", "ROLE", "GRADE", "USER"]),
  refId: z.string().max(64).nullable(),
});

const createBody = z.object({
  title: z.string().trim().min(5).max(200),
  titleBn: z.string().trim().max(200).optional(),
  body: z.string().trim().min(10).max(20000),
  bodyBn: z.string().trim().max(20000).optional(),
  category: categoryEnum,
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
  isPinned: z.boolean(),
  requiresAck: z.boolean(),
  referenceNo: z.string().trim().max(60).optional(),
  audiences: z.array(audienceRef).min(1).max(10),
  channels: z.array(z.enum(["IN_APP", "PUSH", "SMS"])).max(3),
});

const broadcastBody = z.object({
  title: z.string().trim().min(5).max(200),
  titleBn: z.string().trim().max(200).optional(),
  body: z.string().trim().min(10).max(5000),
  bodyBn: z.string().trim().max(5000).optional(),
  requiresAck: z.boolean(),
  sendSms: z.boolean(),
});

function parse<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw validationError(String(issue?.path[0] ?? "body"), issue?.message ?? "Invalid request");
  }
  return parsed.data;
}

function findReadable(ctx: HandlerContext, auth: AuthContext): MockNotice {
  const n = ctx.db.notices.find((x) => x.id === ctx.params.id);
  if (!n || !canReadNotice(auth, n)) throw notFound("Notice");
  return n;
}

function recipientIds(n: MockNotice): string[] {
  return n.receipts.map((r) => r.userId);
}

/** Pushes a change to everyone who can see the notice (recipients plus the author). */
function emitUpdated(ctx: HandlerContext, n: MockNotice): void {
  const author = userForEmployee(ctx.db, n.authorEmployeeId);
  mockEvents.emit("notice:updated", [...recipientIds(n), ...(author ? [author.id] : [])], { noticeId: n.id });
}

function pinnedCount(ctx: HandlerContext): number {
  return ctx.db.notices.filter((n) => n.isPinned && isLive(n)).length;
}

function requirePinSlot(ctx: HandlerContext): void {
  if (pinnedCount(ctx) >= MAX_PINNED) {
    const message = `At most ${MAX_PINNED} notices can be pinned`;
    throw new HttpError("CONFLICT", message, [{ rule: "PIN_LIMIT", message }]);
  }
}

function activeBroadcastFor(ctx: HandlerContext, auth: AuthContext): ActiveBroadcast | null {
  const now = Date.now();
  const candidates = [...ctx.db.broadcasts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const b of candidates) {
    if (b.activeUntil && Date.parse(b.activeUntil) <= now) continue;
    const n = ctx.db.notices.find((x) => x.id === b.noticeId);
    if (!n || !isLive(n)) continue;
    const receipt = receiptOf(n, auth.user.id);
    const isAuthor = n.authorEmployeeId === auth.employee.id;
    if (!receipt && !isAuthor) continue;
    const settled = n.requiresAck ? !!receipt?.ackedAt || isAuthor : false;
    if (settled || b.dismissedBy.includes(auth.user.id)) continue;
    return {
      id: b.id,
      noticeId: n.id,
      title: n.title,
      titleBn: n.titleBn,
      body: n.body,
      bodyBn: n.bodyBn,
      requiresAck: n.requiresAck && !isAuthor,
      ackedAt: receipt?.ackedAt ?? null,
      author: personRef(ctx.db, n.authorEmployeeId),
      createdAt: b.createdAt,
      activeUntil: b.activeUntil,
    };
  }
  return null;
}

register([
  {
    method: "GET",
    path: "/notices",
    permission: "notices:read",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const { category, unread, requiresAck, q } = parse(listQuery, ctx.query);
      const items = ctx.db.notices
        .filter((n) => {
          if (!isLive(n) || !canReadNotice(auth, n)) return false;
          if (category && n.category !== category) return false;
          const receipt = receiptOf(n, auth.user.id);
          if (unread === "true" && (!receipt || receipt.readAt)) return false;
          if (requiresAck === "true" && (!n.requiresAck || !receipt || receipt.ackedAt)) return false;
          return matchesSearch(q, n.title, n.titleBn, n.refNo, n.body, n.bodyBn, n.referenceNo);
        })
        .sort(noticeOrder)
        .map((n) => toNoticeListItem(ctx.db, n, auth.user.id));
      return paginate(items, ctx.query, 30);
    },
  },
  {
    method: "GET",
    path: "/notices/compose-options",
    permission: ["notices:create", "notices:publish"],
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const body: ComposeOptions = {
        categories: composeCategories(auth),
        audiences: composeAudiences(auth),
        maxPinned: MAX_PINNED,
        pinnedCount: pinnedCount(ctx),
      };
      return ok(body);
    },
  },
  {
    method: "GET",
    path: "/notices/:id",
    permission: "notices:read",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const n = findReadable(ctx, auth);
      const receipt = receiptOf(n, auth.user.id);
      if (receipt && !receipt.readAt) {
        receipt.readAt = nowIso();
        syncNotifications(ctx.db, n.id, auth.user.id, "read");
        commit();
        mockEvents.emit("notification:count", [auth.user.id], {});
      }
      return ok(toNoticeWire(ctx.db, n, auth));
    },
  },
  {
    method: "POST",
    path: "/notices",
    permission: "notices:create",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const body = parse(createBody, ctx.body);
      if (!composeCategories(auth).includes(body.category)) {
        throw forbidden("You cannot publish notices in this category");
      }
      if (body.audiences.some((a) => !canComposeAudience(auth, a))) {
        throw forbidden("The audience is outside your publishing scope");
      }
      if (body.isPinned) requirePinSlot(ctx);
      const at = nowIso();
      const n: MockNotice = {
        id: newId("ntc"),
        refNo: nextNoticeRef(ctx.db),
        title: body.title,
        titleBn: body.titleBn || null,
        body: body.body,
        bodyBn: body.bodyBn || null,
        category: body.category,
        priority: body.priority,
        status: "DRAFT",
        isPinned: body.isPinned,
        requiresAck: body.requiresAck,
        referenceNo: body.referenceNo || null,
        publishAt: null,
        expiresAt: null,
        authorEmployeeId: auth.employee.id,
        createdAt: at,
        audiences: body.audiences.map((a) => ({ type: a.type, refId: a.refId })),
        receipts: [],
        offline: { recipients: 0, reads: 0, acks: 0 },
      };
      ctx.db.notices.unshift(n);
      commit();
      return ok(toNoticeWire(ctx.db, n, auth), 201);
    },
  },
  {
    method: "POST",
    path: "/notices/:id/publish",
    permission: "notices:publish",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const n = findReadable(ctx, auth);
      if (n.authorEmployeeId !== auth.employee.id && !hasGrant(auth, "notices:manage")) throw forbidden();
      if (n.status !== "DRAFT" && n.status !== "SCHEDULED") throw invalidTransition(`Notice is already ${n.status.toLowerCase()}`);
      if (!composeCategories(auth).includes(n.category)) throw forbidden("You cannot publish notices in this category");
      publish(ctx.db, n);
      commit();
      return ok(toNoticeWire(ctx.db, n, auth));
    },
  },
  {
    method: "POST",
    path: "/notices/:id/ack",
    permission: "notices:read",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const n = findReadable(ctx, auth);
      if (!n.requiresAck) throw policyViolation("ACK_NOT_REQUIRED", "This notice does not need acknowledgement");
      if (!receiptOf(n, auth.user.id)) throw forbidden("You are not a recipient of this notice");
      if (ackReceipt(ctx.db, n, auth.user.id)) {
        commit();
        mockEvents.emit("notification:count", [auth.user.id], {});
        emitUpdated(ctx, n);
      }
      return ok(toNoticeWire(ctx.db, n, auth));
    },
  },
  {
    method: "POST",
    path: "/notices/:id/pin",
    permission: "notices:manage",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const n = findReadable(ctx, auth);
      if (!isLive(n)) throw invalidTransition("Only published notices can be pinned");
      if (!n.isPinned) {
        requirePinSlot(ctx);
        n.isPinned = true;
        commit();
        emitUpdated(ctx, n);
      }
      return ok(toNoticeWire(ctx.db, n, auth));
    },
  },
  {
    method: "POST",
    path: "/notices/:id/unpin",
    permission: "notices:manage",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const n = findReadable(ctx, auth);
      if (n.isPinned) {
        n.isPinned = false;
        commit();
        emitUpdated(ctx, n);
      }
      return ok(toNoticeWire(ctx.db, n, auth));
    },
  },
  {
    method: "POST",
    path: "/notices/:id/archive",
    permission: "notices:manage",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const n = findReadable(ctx, auth);
      if (n.status !== "PUBLISHED" && n.status !== "EXPIRED") throw invalidTransition(`Notice is ${n.status.toLowerCase()}`);
      n.status = "ARCHIVED";
      n.isPinned = false;
      commit();
      emitUpdated(ctx, n);
      return ok(toNoticeWire(ctx.db, n, auth));
    },
  },
  {
    method: "GET",
    path: "/notices/:id/receipts",
    permission: "notices:read",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const n = findReadable(ctx, auth);
      if (n.authorEmployeeId !== auth.employee.id && !hasGrant(auth, "notices:manage")) throw forbidden();
      const rows = n.receipts
        .map((r) => {
          const user = ctx.db.users.find((u) => u.id === r.userId);
          return user ? { person: personRef(ctx.db, user.employeeId), readAt: r.readAt, ackedAt: r.ackedAt } : null;
        })
        .filter((r): r is NoticeReceipts["rows"][number] => !!r)
        .sort((a, b) => Number(!!a.ackedAt) - Number(!!b.ackedAt) || Number(!!a.readAt) - Number(!!b.readAt));
      const body: NoticeReceipts = { ...counts(n), rows };
      return ok(body);
    },
  },
  {
    method: "POST",
    path: "/broadcasts",
    permission: "notices:broadcast",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const body = parse(broadcastBody, ctx.body);
      const at = nowIso();
      const n: MockNotice = {
        id: newId("ntc"),
        refNo: nextNoticeRef(ctx.db),
        title: body.title,
        titleBn: body.titleBn || null,
        body: body.body,
        bodyBn: body.bodyBn || null,
        category: "EXECUTIVE",
        priority: "HIGH",
        status: "DRAFT",
        isPinned: pinnedCount(ctx) < MAX_PINNED,
        requiresAck: body.requiresAck,
        referenceNo: null,
        publishAt: null,
        expiresAt: null,
        authorEmployeeId: auth.employee.id,
        createdAt: at,
        audiences: [{ type: "ALL", refId: null }],
        receipts: [],
        offline: { recipients: 0, reads: 0, acks: 0 },
      };
      ctx.db.notices.unshift(n);
      const broadcast = {
        id: newId("brc"),
        noticeId: n.id,
        authorEmployeeId: auth.employee.id,
        sendSms: body.sendSms,
        activeUntil: hoursFromNow(24),
        createdAt: at,
        dismissedBy: [],
      };
      ctx.db.broadcasts.unshift(broadcast);
      publish(ctx.db, n, { type: "BROADCAST" });
      mockEvents.emit("broadcast:new", [], { broadcastId: broadcast.id, noticeId: n.id });
      commit();
      return ok({ broadcastId: broadcast.id, notice: toNoticeWire(ctx.db, n, auth) }, 201);
    },
  },
  {
    method: "GET",
    path: "/broadcasts/active",
    permission: "notices:read",
    handler: (ctx) => ok(activeBroadcastFor(ctx, requireAuth(ctx))),
  },
  {
    method: "POST",
    path: "/broadcasts/:id/dismiss",
    permission: "notices:read",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const b = ctx.db.broadcasts.find((x) => x.id === ctx.params.id);
      const n = b ? ctx.db.notices.find((x) => x.id === b.noticeId) : undefined;
      if (!b || !n || !canReadNotice(auth, n)) throw notFound("Broadcast");
      const receipt = receiptOf(n, auth.user.id);
      if (n.requiresAck && receipt && !receipt.ackedAt) {
        throw policyViolation("ACK_REQUIRED", "Acknowledge the announcement before dismissing it");
      }
      if (!b.dismissedBy.includes(auth.user.id)) b.dismissedBy.push(auth.user.id);
      commit();
      return noContent();
    },
  },
]);
