import * as Crypto from "expo-crypto";
import { logger } from "@/lib/logger";
import { getDb } from "./db";
import { grantsForRoles } from "./seed/rbac";
import { errorBody, forbidden, HttpError, type MockRequest, type MockResponse } from "./http";
import { match, type AuthContext } from "./router";
import "./handlers";

const latency = { min: 120, max: 380 };

/** Tests set this to zero; the presenter can slow it down to show skeletons. */
export function setMockLatency(min: number, max: number): void {
  latency.min = min;
  latency.max = Math.max(min, max);
}

const wait = (msDelay: number) => new Promise<void>((r) => setTimeout(r, msDelay));

interface IdempotentEntry {
  fingerprint: string;
  response: MockResponse;
  at: number;
}
const idempotency = new Map<string, IdempotentEntry>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000;

async function resolveAuth(req: MockRequest): Promise<AuthContext | null> {
  const header = req.headers.authorization ?? req.headers.Authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const db = await getDb();
  const session = db.sessions.find((s) => s.accessToken === token);
  if (!session || session.revokedAt) {
    throw new HttpError("UNAUTHENTICATED", "Session is no longer valid", [{ reason: "SESSION_REVOKED" }]);
  }
  if (session.accessExpiresAt < Date.now()) {
    throw new HttpError("UNAUTHENTICATED", "Access token expired", [{ reason: "TOKEN_EXPIRED" }]);
  }
  const user = db.users.find((u) => u.id === session.userId);
  const employee = user && db.employees.find((e) => e.id === user.employeeId);
  if (!user || !employee || !user.isActive) {
    throw new HttpError("UNAUTHENTICATED", "Account disabled", [{ reason: "ACCOUNT_DISABLED" }]);
  }
  session.lastSeenAt = new Date().toISOString();
  return { user, employee, session, grants: grantsForRoles(user.roles) };
}

/** Executes one request against the in-app API and returns a wire-shaped response. */
export async function handleMockRequest(req: MockRequest): Promise<MockResponse> {
  const requestId = Crypto.randomUUID();
  await wait(latency.min + Math.random() * (latency.max - latency.min));

  try {
    const found = match(req.method, req.path);
    if (!found) throw new HttpError("NOT_FOUND", `No route for ${req.method} ${req.path}`);
    const { route, params } = found;

    const auth = route.auth === false ? await resolveAuth(req).catch(() => null) : await resolveAuth(req);
    if (route.auth !== false && !auth) throw new HttpError("UNAUTHENTICATED", "Authentication required");

    if (route.permission && auth) {
      const keys = Array.isArray(route.permission) ? route.permission : [route.permission];
      if (!keys.some((k) => auth.grants.some((g) => g.key === k))) throw forbidden();
    }

    const idemKey = req.method === "POST" ? req.headers["idempotency-key"] : undefined;
    const fingerprint = idemKey ? `${auth?.user.id ?? "anon"}:${req.path}:${JSON.stringify(req.body ?? null)}` : "";
    if (idemKey) {
      const prior = idempotency.get(idemKey);
      if (prior && Date.now() - prior.at < IDEMPOTENCY_TTL) {
        if (prior.fingerprint !== fingerprint) {
          throw new HttpError("CONFLICT", "Idempotency-Key reused with a different request", [
            { reason: "IDEMPOTENCY_REPLAY_MISMATCH" },
          ]);
        }
        return prior.response;
      }
    }

    const db = await getDb();
    const response = await route.handler({ req, params, query: req.query, body: req.body, db, auth });

    if (idemKey && response.status < 500) {
      idempotency.set(idemKey, { fingerprint, response, at: Date.now() });
    }
    return response;
  } catch (err) {
    if (err instanceof HttpError) {
      return { status: err.status, body: errorBody(err, requestId) };
    }
    logger.error("mock server error", req.method, req.path, err);
    return {
      status: 500,
      body: errorBody(new HttpError("INTERNAL", "Something went wrong"), requestId),
    };
  }
}
