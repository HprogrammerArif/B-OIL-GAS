import type { GrantScope, PermissionGrant, PermissionKey } from "@/types/domain/identity";
import type { MockDb, MockEmployee, MockSession, MockUser } from "./db/schema";
import { forbidden, HttpError, type HttpMethod, type MockRequest, type MockResponse } from "./http";

export interface AuthContext {
  user: MockUser;
  employee: MockEmployee;
  session: MockSession;
  grants: PermissionGrant[];
}

export interface HandlerContext<TBody = unknown> {
  req: MockRequest;
  params: Record<string, string>;
  query: Record<string, string>;
  body: TBody;
  db: MockDb;
  auth: AuthContext | null;
}

export type Handler = (ctx: HandlerContext) => MockResponse | Promise<MockResponse>;

export interface RouteDef {
  method: HttpMethod;
  path: string;
  /** Public routes (login/refresh) set `auth: false`. */
  auth?: boolean;
  /** Any one of these keys admits the caller (doc 03 `x-permission`). */
  permission?: PermissionKey | PermissionKey[];
  handler: Handler;
}

interface CompiledRoute extends RouteDef {
  regex: RegExp;
  keys: string[];
}

const routes: CompiledRoute[] = [];

function compile(path: string): { regex: RegExp; keys: string[] } {
  const keys: string[] = [];
  const pattern = path
    .split("/")
    .map((seg) => {
      if (seg.startsWith(":")) {
        keys.push(seg.slice(1));
        return "([^/]+)";
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return { regex: new RegExp(`^${pattern}$`), keys };
}

export function register(defs: RouteDef[]): void {
  for (const def of defs) routes.push({ ...def, ...compile(def.path) });
}

export function match(
  method: HttpMethod,
  path: string,
): { route: CompiledRoute; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    const m = route.regex.exec(path);
    if (!m) continue;
    const params: Record<string, string> = {};
    route.keys.forEach((k, i) => {
      params[k] = decodeURIComponent(m[i + 1] ?? "");
    });
    return { route, params };
  }
  return null;
}

/* ─── Authorisation helpers used inside handlers ─────────────────────────── */

const SCOPE_RANK: Record<GrantScope, number> = { SELF: 0, TEAM: 1, DEPARTMENT: 2, SITE: 3, COMPANY: 4 };

export function requireAuth(ctx: HandlerContext): AuthContext {
  if (!ctx.auth) throw new HttpError("UNAUTHENTICATED", "Authentication required");
  return ctx.auth;
}

export function grantOf(ctx: HandlerContext, key: PermissionKey): PermissionGrant | undefined {
  return ctx.auth?.grants.find((g) => g.key === key);
}

export function hasGrant(auth: AuthContext, key: PermissionKey, atLeast: GrantScope = "SELF"): boolean {
  const g = auth.grants.find((x) => x.key === key);
  return !!g && SCOPE_RANK[g.scope] >= SCOPE_RANK[atLeast];
}

export function can(ctx: HandlerContext, key: PermissionKey, atLeast: GrantScope = "SELF"): boolean {
  return !!ctx.auth && hasGrant(ctx.auth, key, atLeast);
}

export function requirePermission(ctx: HandlerContext, key: PermissionKey, atLeast: GrantScope = "SELF"): PermissionGrant {
  const g = grantOf(ctx, key);
  if (!g || SCOPE_RANK[g.scope] < SCOPE_RANK[atLeast]) throw forbidden();
  return g;
}

/** Fields a scoped record exposes for row-level filtering (doc 01 `scopeWhere`). */
export interface ScopedRecord {
  ownerEmployeeId?: string | null;
  departmentId?: string | null;
  siteId?: string | null;
  teamManagerId?: string | null;
}

/** Row-level filter: the widest grant scope for `key` decides which records are visible. */
export function inScope(ctx: HandlerContext, key: PermissionKey, record: ScopedRecord): boolean {
  const auth = ctx.auth;
  const g = grantOf(ctx, key);
  if (!auth || !g) return false;
  const me = auth.employee;
  switch (g.scope) {
    case "COMPANY":
      return true;
    case "SITE":
      return record.siteId == null || record.siteId === me.site.id || record.ownerEmployeeId === me.id;
    case "DEPARTMENT":
      return record.departmentId == null || record.departmentId === me.department.id || record.ownerEmployeeId === me.id;
    case "TEAM":
      return record.teamManagerId === me.id || record.ownerEmployeeId === me.id;
    case "SELF":
      return record.ownerEmployeeId === me.id;
  }
}
