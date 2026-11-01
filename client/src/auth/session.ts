/**
 * Session store: who is signed in, with which permissions and data scope.
 *
 * Follows the project's observable-store pattern (subscribe / notify) so it
 * can be read from stores and components alike. Credentials are checked
 * against a SHA-256 digest of the demo password; the switcher used for
 * presentations lives behind the hidden demo panel, not in the UI.
 */
import { useSyncExternalStore } from 'react';
import { AppRole, ROLE_META, RoleMetaItem } from '../types';
import { Permission, ScopeKind, can, permissionsFor, scopeKindFor } from './permissions';

export interface CurrentUser extends RoleMetaItem {
  role: AppRole;
  permissions: ReadonlySet<Permission>;
  scope: Scope;
}

export interface Scope {
  kind: ScopeKind;
  empId: string;
  name: string;
  site: RoleMetaItem['site'];
  dept: string;
}

export type LoginResult = { ok: true } | { ok: false; reason: 'invalid_credentials' | 'locked' };

interface SessionState {
  user: CurrentUser | null;
  loginAttempts: number;
}

const SESSION_KEY = 'oneops.session.v1';
// sha256('bogcl2026') — demo credential; real deployments use argon2id server-side.
const DEMO_PASSWORD_SHA256 = '95665bd975b309827cbc17b25a0776ba447701bd70909ae63ba8da93560de34d';
const MAX_ATTEMPTS = 5;

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function buildUser(role: AppRole): CurrentUser {
  const meta = ROLE_META[role];
  return {
    ...meta,
    role,
    permissions: permissionsFor(role),
    scope: { kind: scopeKindFor(role), empId: meta.empId, name: meta.name, site: meta.site, dept: meta.dept },
  };
}

function readPersisted(): AppRole | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY) ?? window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: string };
    return parsed.role && parsed.role in ROLE_META ? (parsed.role as AppRole) : null;
  } catch {
    return null;
  }
}

function persist(role: AppRole | null, remember: boolean) {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    if (role) {
      const target = remember ? window.localStorage : window.sessionStorage;
      target.setItem(SESSION_KEY, JSON.stringify({ role, at: Date.now() }));
    }
  } catch {
    /* storage unavailable */
  }
}

const initialRole = typeof window !== 'undefined' ? readPersisted() : null;
let state: SessionState = { user: initialRole ? buildUser(initialRole) : null, loginAttempts: 0 };
const listeners = new Set<() => void>();

function setState(next: Partial<SessionState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function resolveIdentifier(identifier: string): AppRole | null {
  const id = identifier.trim().toLowerCase().replace(/\s+/g, '');
  if (!id) return null;
  const roles = Object.keys(ROLE_META) as AppRole[];
  return (
    roles.find((r) => {
      const m = ROLE_META[r];
      return (
        m.email.toLowerCase() === id ||
        m.empId.toLowerCase() === id ||
        m.phone.replace(/[\s-]/g, '') === id.replace(/[\s-]/g, '')
      );
    }) ?? null
  );
}

export const sessionStore = {
  getState: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async login(identifier: string, password: string, remember: boolean): Promise<LoginResult> {
    if (state.loginAttempts >= MAX_ATTEMPTS) return { ok: false, reason: 'locked' };
    const role = resolveIdentifier(identifier);
    // Always hash so timing does not reveal whether the identifier exists.
    const digest = await sha256Hex(password);
    const passwordOk = digest === DEMO_PASSWORD_SHA256;
    if (!role || !passwordOk) {
      setState({ loginAttempts: state.loginAttempts + 1 });
      return { ok: false, reason: 'invalid_credentials' };
    }
    persist(role, remember);
    setState({ user: buildUser(role), loginAttempts: 0 });
    return { ok: true };
  },

  logout() {
    persist(null, false);
    setState({ user: null });
  },

  /** Demo-panel only: switch the signed-in persona without credentials. */
  switchPersona(role: AppRole) {
    persist(role, true);
    setState({ user: buildUser(role) });
  },
};

/* ─── Hooks & helpers ───────────────────────────────────────────────────── */

export function useSession(): SessionState {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getState, sessionStore.getState);
}

export function useCurrentUser(): CurrentUser | null {
  return useSession().user;
}

/** `useCan('approvals:decide')` — false when signed out. */
export function useCan(permission: Permission): boolean {
  const user = useCurrentUser();
  return user ? can(user.role, permission) : false;
}

export function useScope(): Scope | null {
  return useCurrentUser()?.scope ?? null;
}

/** Imperative accessor for stores and non-React code. */
export function currentUser(): CurrentUser | null {
  return state.user;
}

/**
 * Scope predicate for list filtering. Records expose whichever identity
 * fields they have; missing fields are treated as not matching.
 */
export function inScope(
  scope: Scope,
  record: { empId?: string; ownerName?: string; site?: string; dept?: string },
): boolean {
  switch (scope.kind) {
    case 'all':
      return true;
    case 'site':
      return record.site === undefined || record.site === scope.site;
    case 'department':
      return record.dept === undefined || record.dept === scope.dept;
    case 'self':
      return record.empId === scope.empId || record.ownerName === scope.name;
  }
}
