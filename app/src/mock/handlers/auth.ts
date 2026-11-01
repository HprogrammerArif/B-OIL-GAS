import * as Crypto from "expo-crypto";
import { z } from "zod";
import type { LoginResponse } from "@/types/domain/identity";
import { commit } from "../db";
import type { MockDb, MockSession, MockUser } from "../db/schema";
import { ms, nowIso } from "../clock";
import { HttpError, noContent, notFound, ok, validationError } from "../http";
import { register, requireAuth } from "../router";
import { normalisePhone } from "../seed/org";

const ACCESS_TTL_S = 15 * 60;
const REFRESH_TTL = 30 * ms.DAY;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

const sha256 = (value: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);

/** Constant-time comparison of two equal-length hex digests. */
function digestsEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function findUser(db: MockDb, identifier: string): MockUser | undefined {
  const id = identifier.trim().toLowerCase();
  const phone = normalisePhone(id);
  return db.users.find((u) => {
    if (u.email.toLowerCase() === id || u.phone === phone) return true;
    const emp = db.employees.find((e) => e.id === u.employeeId);
    return emp?.empCode.toLowerCase() === id;
  });
}

const invalidCredentials = () =>
  new HttpError("UNAUTHENTICATED", "Invalid credentials", [{ reason: "INVALID_CREDENTIALS" }]);

const deviceSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(120).default("Mobile device"),
  platform: z.enum(["ANDROID", "IOS"]).default("ANDROID"),
  appVersion: z.string().max(40).optional(),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().default(true),
  device: deviceSchema,
});

const refreshSchema = z.object({ refreshToken: z.string().min(10).max(200) });

/** Opens a session and returns the doc 03 login body. Shared with the presenter persona switch. */
export async function openSession(
  db: MockDb,
  user: MockUser,
  device: z.infer<typeof deviceSchema>,
): Promise<LoginResponse> {
  const refreshToken = `mrt_${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, "");
  const session: MockSession = {
    id: `ses_${Crypto.randomUUID()}`,
    userId: user.id,
    deviceId: device.id,
    deviceName: device.name,
    platform: device.platform,
    refreshTokenHash: await sha256(refreshToken),
    accessToken: `mat_${Crypto.randomUUID()}`,
    accessExpiresAt: Date.now() + ACCESS_TTL_S * 1000,
    refreshExpiresAt: new Date(Date.now() + REFRESH_TTL).toISOString(),
    createdAt: nowIso(),
    lastSeenAt: nowIso(),
    revokedAt: null,
  };
  // One live session per device: signing in again replaces the old one.
  db.sessions.forEach((s) => {
    if (s.userId === user.id && s.deviceId === device.id && !s.revokedAt) s.revokedAt = nowIso();
  });
  db.sessions = [...db.sessions.filter((s) => !s.revokedAt || Date.now() - Date.parse(s.revokedAt) < ms.DAY), session];
  user.lastLoginAt = nowIso();
  user.failedAttempts = 0;
  user.lockedUntil = null;
  commit();
  return {
    accessToken: session.accessToken,
    expiresIn: ACCESS_TTL_S,
    tokenType: "Bearer",
    refreshToken,
    refreshExpiresAt: session.refreshExpiresAt,
    user: { id: user.id, email: user.email, roles: user.roles, preferredLang: user.preferredLang, mfaEnabled: user.mfaEnabled },
    mustChangePassword: false,
  };
}

register([
  {
    method: "POST",
    path: "/auth/login",
    auth: false,
    handler: async ({ db, body }) => {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) throw validationError("identifier", "Enter your email, phone or employee ID and password");
      const { identifier, password, device } = parsed.data;
      const user = findUser(db, identifier);
      // Always hash so response time does not reveal whether the identifier exists.
      const digest = await sha256(password);
      if (!user) throw invalidCredentials();
      if (user.lockedUntil && Date.parse(user.lockedUntil) > Date.now()) {
        throw new HttpError("UNAUTHENTICATED", "Account temporarily locked", [
          { reason: "ACCOUNT_LOCKED", lockedUntil: user.lockedUntil },
        ]);
      }
      if (!user.isActive) throw new HttpError("UNAUTHENTICATED", "Account disabled", [{ reason: "ACCOUNT_DISABLED" }]);
      if (!digestsEqual(digest, user.passwordDigest)) {
        user.failedAttempts += 1;
        if (user.failedAttempts >= MAX_FAILED) {
          user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * ms.MINUTE).toISOString();
          user.failedAttempts = 0;
        }
        commit();
        throw invalidCredentials();
      }
      return ok(await openSession(db, user, device));
    },
  },
  {
    method: "POST",
    path: "/auth/refresh",
    auth: false,
    handler: async ({ db, body }) => {
      const parsed = refreshSchema.safeParse(body);
      if (!parsed.success) throw new HttpError("UNAUTHENTICATED", "Refresh token invalid", [{ reason: "REFRESH_INVALID" }]);
      const hash = await sha256(parsed.data.refreshToken);
      const session = db.sessions.find((s) => digestsEqual(s.refreshTokenHash, hash));
      if (!session) throw new HttpError("UNAUTHENTICATED", "Refresh token invalid", [{ reason: "REFRESH_INVALID" }]);
      if (session.revokedAt) throw new HttpError("UNAUTHENTICATED", "Session revoked", [{ reason: "SESSION_REVOKED" }]);
      if (Date.parse(session.refreshExpiresAt) < Date.now()) {
        throw new HttpError("UNAUTHENTICATED", "Session expired", [{ reason: "SESSION_EXPIRED" }]);
      }
      const user = db.users.find((u) => u.id === session.userId);
      if (!user?.isActive) throw new HttpError("UNAUTHENTICATED", "Account disabled", [{ reason: "ACCOUNT_DISABLED" }]);

      const refreshToken = `mrt_${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, "");
      session.refreshTokenHash = await sha256(refreshToken);
      session.accessToken = `mat_${Crypto.randomUUID()}`;
      session.accessExpiresAt = Date.now() + ACCESS_TTL_S * 1000;
      session.lastSeenAt = nowIso();
      commit();
      const response: LoginResponse = {
        accessToken: session.accessToken,
        expiresIn: ACCESS_TTL_S,
        tokenType: "Bearer",
        refreshToken,
        refreshExpiresAt: session.refreshExpiresAt,
        user: { id: user.id, email: user.email, roles: user.roles, preferredLang: user.preferredLang, mfaEnabled: user.mfaEnabled },
        mustChangePassword: false,
      };
      return ok(response);
    },
  },
  {
    method: "POST",
    path: "/auth/logout",
    handler: (ctx) => {
      const { session } = requireAuth(ctx);
      session.revokedAt = nowIso();
      commit();
      return noContent();
    },
  },
  {
    method: "POST",
    path: "/auth/logout-all",
    handler: (ctx) => {
      const { session, user } = requireAuth(ctx);
      const keepCurrent = ctx.query.keepCurrent === "true";
      ctx.db.sessions.forEach((s) => {
        if (s.userId === user.id && !s.revokedAt && !(keepCurrent && s.id === session.id)) s.revokedAt = nowIso();
      });
      commit();
      return noContent();
    },
  },
  {
    method: "GET",
    path: "/auth/sessions",
    handler: (ctx) => {
      const { session, user } = requireAuth(ctx);
      const mine = ctx.db.sessions
        .filter((s) => s.userId === user.id && !s.revokedAt)
        .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
        .map((s) => ({
          id: s.id,
          platform: s.platform,
          deviceName: s.deviceName,
          ip: null,
          lastSeenAt: s.lastSeenAt,
          createdAt: s.createdAt,
          isCurrent: s.id === session.id,
        }));
      return ok(mine);
    },
  },
  {
    method: "DELETE",
    path: "/auth/sessions/:id",
    handler: (ctx) => {
      const { user } = requireAuth(ctx);
      const target = ctx.db.sessions.find((s) => s.id === ctx.params.id && s.userId === user.id);
      if (!target) throw notFound("Session");
      target.revokedAt = nowIso();
      commit();
      return noContent();
    },
  },
  {
    method: "POST",
    path: "/auth/devices",
    handler: (ctx) => {
      requireAuth(ctx);
      return noContent();
    },
  },
]);
