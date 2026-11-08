/**
 * Role → permission matrix for the prototype.
 *
 * Views and actions are gated by `module:action` strings instead of
 * `role === '…'` checks so every screen reads the same identity model.
 * Mirrors docs/platform/06 (permission catalogue) at prototype fidelity.
 */
import type { AppRole, AppView } from '../types';

export type Permission =
  // Dashboards
  | 'dashboard:executive'
  | 'dashboard:plant'
  | 'dashboard:hr'
  | 'dashboard:transport'
  | 'dashboard:department'
  | 'dashboard:self'
  | 'dashboard:driver'
  // Approvals & documents
  | 'approvals:view'
  | 'approvals:decide'
  | 'notesheet:view'
  | 'notesheet:create'
  | 'notesheet:sign'
  | 'notesheet:view_all'
  // Leadership chat & notices
  | 'chat:leadership'
  | 'chat:directive'
  | 'notices:broadcast'
  | 'notices:publish'
  // Compliance
  | 'compliance:view'
  | 'compliance:manage'
  | 'compliance:renew'
  | 'compliance:dispatch_letter'
  | 'compliance:approve_fund'
  // Fleet & bus
  | 'fleet:request'
  | 'fleet:dispatch'
  | 'fleet:drive'
  | 'fleet:view_all'
  | 'bus:view'
  | 'bus:view_all'
  | 'bus:manage'
  // Parcels, visitors, incidents
  | 'parcel:view'
  | 'parcel:dispatch'
  | 'parcel:deliver'
  | 'guest:invite'
  | 'guest:gate'
  | 'guest:view_all'
  | 'incident:report'
  | 'incident:investigate'
  | 'incident:view_all'
  // People & money
  | 'attendance:self'
  | 'attendance:team'
  | 'attendance:all'
  | 'leave:approve'
  | 'claims:submit'
  | 'claims:approve_hod'
  | 'claims:approve_finance'
  | 'claims:view_all'
  | 'workforce:view'
  | 'workforce:manage'
  // Assets
  | 'asset:view_own'
  | 'asset:view_all'
  | 'asset:manage'
  | 'asset:request'
  | 'asset:approve_disposal'
  // Admin
  | 'settings:sync_status';

const EVERYONE: Permission[] = ['attendance:self', 'claims:submit', 'asset:view_own', 'parcel:view', 'incident:report', 'notesheet:view'];

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  chairman: [
    ...EVERYONE,
    'dashboard:executive',
    'approvals:view', 'approvals:decide',
    'notesheet:sign', 'notesheet:view_all',
    'chat:leadership', 'chat:directive', 'notices:broadcast', 'notices:publish',
    'compliance:view', 'compliance:dispatch_letter',
    'guest:view_all', 'incident:view_all',
    'attendance:all', 'workforce:view',
    'asset:view_all', 'asset:approve_disposal',
    'claims:view_all',
    'settings:sync_status',
  ],
  plant_gm: [
    ...EVERYONE,
    'dashboard:plant',
    'approvals:view', 'approvals:decide',
    'notesheet:create', 'notesheet:sign', 'notesheet:view_all',
    'chat:leadership',
    'compliance:view', 'compliance:manage', 'compliance:renew',
    'guest:invite', 'guest:view_all',
    'incident:investigate', 'incident:view_all',
    'attendance:team', 'leave:approve',
    'asset:view_all', 'asset:manage', 'asset:request',
    'parcel:dispatch',
    'settings:sync_status',
  ],
  hr_admin: [
    ...EVERYONE,
    'dashboard:hr',
    'approvals:view', 'approvals:decide',
    'notesheet:create', 'notesheet:view_all',
    'chat:leadership', 'notices:publish',
    'compliance:view',
    'fleet:request', 'fleet:view_all',
    'bus:view', 'bus:view_all',
    'guest:invite', 'guest:view_all',
    'incident:view_all',
    'attendance:all', 'leave:approve',
    'claims:view_all',
    'workforce:view', 'workforce:manage',
    'asset:view_all', 'asset:manage', 'asset:request',
    'parcel:dispatch',
    'settings:sync_status',
  ],
  transport_admin: [
    ...EVERYONE,
    'dashboard:transport',
    'notesheet:create',
    'fleet:request', 'fleet:dispatch', 'fleet:view_all',
    'bus:view', 'bus:manage',
    'guest:gate', 'guest:view_all',
    'parcel:dispatch',
    'incident:investigate', 'incident:view_all',
    'attendance:team',
    'claims:view_all',
    'asset:view_all', 'asset:request',
  ],
  hod: [
    ...EVERYONE,
    'dashboard:department',
    'approvals:view', 'approvals:decide',
    'notesheet:create', 'notesheet:sign', 'notesheet:view_all',
    'chat:leadership',
    'compliance:view', 'compliance:approve_fund',
    'fleet:request',
    'guest:invite',
    'incident:view_all',
    'attendance:team', 'leave:approve',
    'claims:approve_hod', 'claims:approve_finance', 'claims:view_all',
    'workforce:view',
    'asset:view_all', 'asset:approve_disposal',
  ],
  employee: [
    ...EVERYONE,
    'dashboard:self',
    'notesheet:create',
    'fleet:request',
    'bus:view',
    'guest:invite',
    'asset:request',
  ],
  driver: [
    ...EVERYONE,
    'dashboard:driver',
    'fleet:drive',
    'parcel:deliver',
    'asset:request',
  ],
};

const PERMISSION_SETS = (Object.keys(ROLE_PERMISSIONS) as AppRole[]).reduce(
  (acc, r) => {
    acc[r] = new Set(ROLE_PERMISSIONS[r]);
    return acc;
  },
  {} as Record<AppRole, ReadonlySet<Permission>>,
);

export function permissionsFor(role: AppRole): ReadonlySet<Permission> {
  return PERMISSION_SETS[role];
}

export function can(role: AppRole, permission: Permission): boolean {
  return PERMISSION_SETS[role].has(permission);
}

/** Any one of the listed permissions unlocks the view. */
export const VIEW_PERMISSIONS: Record<AppView, Permission[]> = {
  dashboard: ['dashboard:executive', 'dashboard:plant', 'dashboard:hr', 'dashboard:transport', 'dashboard:department', 'dashboard:self', 'dashboard:driver'],
  inner_circle: ['chat:leadership'],
  workforce: ['workforce:view'],
  notesheet: ['notesheet:view'],
  compliance: ['compliance:view'],
  fleet: ['fleet:request', 'fleet:dispatch', 'fleet:drive', 'fleet:view_all'],
  vehicle_request: ['fleet:request'],
  bus: ['bus:view', 'bus:manage'],
  parcel: ['parcel:view'],
  attendance: ['attendance:self'],
  incident: ['incident:report'],
  approvals: ['approvals:view'],
  claims: ['claims:submit'],
  asset: ['asset:view_own'],
  guest: ['guest:invite', 'guest:gate', 'guest:view_all'],
};

export function canAccessView(role: AppRole, view: AppView): boolean {
  return VIEW_PERMISSIONS[view].some((p) => can(role, p));
}

export function allowedViews(role: AppRole): Set<AppView> {
  return new Set((Object.keys(VIEW_PERMISSIONS) as AppView[]).filter((v) => canAccessView(role, v)));
}

/* ─── Data scope ────────────────────────────────────────────────────────── */

export type ScopeKind = 'all' | 'site' | 'department' | 'self';

const ROLE_SCOPE: Record<AppRole, ScopeKind> = {
  chairman: 'all',
  plant_gm: 'site',
  hr_admin: 'all',
  transport_admin: 'all',
  hod: 'department',
  employee: 'self',
  driver: 'self',
};

export function scopeKindFor(role: AppRole): ScopeKind {
  return ROLE_SCOPE[role];
}
