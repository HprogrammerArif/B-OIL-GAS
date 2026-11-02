/**
 * Parcels — who sees which consignments and who may move them.
 *
 * Modes (from permissions, never the role string):
 *  - desk:     `parcel:dispatch` — mailroom / transport desk: scans every hand-off,
 *              enters the recipient's PIN at handover, can reissue a locked PIN.
 *  - courier:  `parcel:deliver` — driver carrying the pouch: scans and enters PINs
 *              only for consignments assigned to them.
 *  - personal: everyone else — consignments they sent or are receiving.
 *
 * The delivery PIN is shown only to the recipient; the return PIN only to the
 * original sender. Whoever holds the PIN never confirms their own handover.
 */
import type { CurrentUser } from '../../auth/session';
import type { ParcelItem } from '../ParcelView';
import { sha256Hex } from '../../lib/hash';

export type ParcelMode = 'desk' | 'courier' | 'personal';

export const OTP_MAX_ATTEMPTS = 5;

export function parcelModeFor(user: CurrentUser): ParcelMode {
  if (user.permissions.has('parcel:dispatch')) return 'desk';
  if (user.permissions.has('parcel:deliver')) return 'courier';
  return 'personal';
}

const norm = (name: string) => name.replace(/\(.*?\)/g, '').trim().toLowerCase();
const samePerson = (a: string, b: string) => norm(a) === norm(b);

export const isSender = (p: ParcelItem, user: CurrentUser) => samePerson(p.sender, user.name);
export const isRecipient = (p: ParcelItem, user: CurrentUser) => samePerson(p.receiver, user.name);
export const isCourierOf = (p: ParcelItem, user: CurrentUser) => samePerson(p.courier.name, user.name);
export const isMine = (p: ParcelItem, user: CurrentUser) => isSender(p, user) || isRecipient(p, user);

export function parcelsVisibleTo(
  user: CurrentUser,
  mode: ParcelMode,
  parcels: readonly ParcelItem[],
  scope: 'personal' | 'master',
): ParcelItem[] {
  if (mode === 'desk' && scope === 'master') return [...parcels];
  if (mode === 'courier') return parcels.filter((p) => isCourierOf(p, user) || isMine(p, user));
  return parcels.filter((p) => isMine(p, user));
}

export type ParcelAction = 'scan' | 'return_pickup' | 'verify_delivery' | 'verify_return' | 'locked' | 'none';

/** The next step the signed-in user can perform on this consignment. */
export function parcelActionFor(p: ParcelItem, user: CurrentUser, mode: ParcelMode): ParcelAction {
  const handler = mode === 'desk' || (mode === 'courier' && isCourierOf(p, user));
  if (!handler) return 'none';
  if ((p.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) return 'locked';
  if (p.status === 'returned') {
    if (p.returnDetails?.returnStage === 1) return 'return_pickup';
    if (p.returnDetails?.returnStage === 2) return 'verify_return';
    return 'none';
  }
  if (p.status === 'delivered' || p.currentStage >= 5) return 'none';
  return p.currentStage === 4 ? 'verify_delivery' : 'scan';
}

/** Who may raise a return / flag a broken seal: the recipient or the desk. */
export const canRaiseIssue = (p: ParcelItem, user: CurrentUser, mode: ParcelMode) =>
  mode === 'desk' || isRecipient(p, user);

/** 4-digit PIN from the platform CSPRNG. */
export function newPin(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 9000;
  return String(1000 + n);
}

/** Tamper-evident custody hash chained to the previous entry. */
export async function custodyHash(p: ParcelItem, parts: readonly string[]): Promise<string> {
  const prev = p.chainOfCustody[p.chainOfCustody.length - 1]?.securityHash ?? '';
  const hex = await sha256Hex([prev, p.trackingNo, ...parts].join('|'));
  return `sha256:${hex.slice(0, 16)}`;
}
