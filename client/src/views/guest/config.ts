/**
 * Guests & visitors — who sees which passes and who runs the gate.
 *
 * Modes (from permissions, never the role string):
 *  - gate:      `guest:gate` — security desk: check-in/out, badges, PPE, barrier, muster.
 *  - oversight: `guest:view_all` — every pass on campus, read-only at the gate.
 *  - host:      `guest:invite` only — guests they invited.
 */
import type { CurrentUser } from '../../auth/session';
import type { VisitorRecord } from '../GuestView';

export type GuestMode = 'gate' | 'oversight' | 'host';

export function guestModeFor(user: CurrentUser): GuestMode {
  if (user.permissions.has('guest:gate')) return 'gate';
  if (user.permissions.has('guest:view_all')) return 'oversight';
  return 'host';
}

const norm = (name: string) => name.replace(/\(.*?\)/g, '').trim().toLowerCase();

export const isMyGuest = (v: VisitorRecord, user: CurrentUser) => norm(v.hostEmployee) === norm(user.name);

export function visitorsVisibleTo(
  user: CurrentUser,
  mode: GuestMode,
  visitors: readonly VisitorRecord[],
  scope: 'my_guests' | 'all',
): VisitorRecord[] {
  if (mode !== 'host' && scope === 'all') return [...visitors];
  return visitors.filter((v) => isMyGuest(v, user));
}
