/**
 * Attendance — sites, geofence maths and per-role roster scope.
 *
 * The web prototype uses the browser Geolocation API when the user allows it
 * and falls back to a manual site confirmation (flagged for supervisor
 * review) when a fix is unavailable — mirroring BR-AT in docs/platform/06 at
 * prototype fidelity. Nothing here pretends to do biometrics.
 */
import { useMemo } from 'react';
import type { ShiftWorker } from '../../store/operationsStore';
import { useCurrentUser, type CurrentUser } from '../../auth/session';

export type SiteId = 'HQ_BARIDHARA' | 'PLANT_KERANIGANJ';

export interface Site {
  id: SiteId;
  label: [string, string];
  lat: number;
  lng: number;
  /** Geofence radius in metres. */
  radiusM: number;
}

export const SITES: Record<SiteId, Site> = {
  HQ_BARIDHARA: {
    id: 'HQ_BARIDHARA',
    label: ['Head Office, Baridhara', 'প্রধান কার্যালয়, বারিধারা'],
    lat: 23.8103,
    lng: 90.4125,
    radiusM: 300,
  },
  PLANT_KERANIGANJ: {
    id: 'PLANT_KERANIGANJ',
    label: ['Keraniganj Plant', 'কেরানীগঞ্জ প্ল্যান্ট'],
    lat: 23.7005,
    lng: 90.3499,
    radiusM: 500,
  },
};

export const SITE_LIST: Site[] = Object.values(SITES);

/** Shift windows per site (used for the "late" rule). */
export const SHIFT_START: Record<SiteId, { hour: number; minute: number; graceMin: number }> = {
  HQ_BARIDHARA: { hour: 9, minute: 0, graceMin: 10 },
  PLANT_KERANIGANJ: { hour: 8, minute: 30, graceMin: 10 },
};

/** Great-circle distance in metres (haversine). */
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export interface GeoFix {
  lat: number;
  lng: number;
  accuracyM: number;
}

export type GeoResult =
  | { kind: 'fix'; fix: GeoFix }
  | { kind: 'unavailable'; reason: 'denied' | 'timeout' | 'unsupported' | 'error' };

/** Ask the browser for one position; never throws. */
export function requestPosition(timeoutMs = 8000): Promise<GeoResult> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return Promise.resolve({ kind: 'unavailable', reason: 'unsupported' });
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          kind: 'fix',
          fix: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: Math.round(pos.coords.accuracy) },
        }),
      (err) =>
        resolve({
          kind: 'unavailable',
          reason: err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'error',
        }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}

/** Nearest site to a fix, with the distance to its centre. */
export function nearestSite(fix: GeoFix): { site: Site; distanceM: number } {
  return SITE_LIST.map((site) => ({ site, distanceM: distanceMeters(fix.lat, fix.lng, site.lat, site.lng) })).sort(
    (a, b) => a.distanceM - b.distanceM,
  )[0];
}

/** Whether a punch at `now` counts as late for the site's shift. */
export function isLateFor(siteId: SiteId, now = new Date()): boolean {
  const s = SHIFT_START[siteId];
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes > s.hour * 60 + s.minute + s.graceMin;
}

export function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

/** Roster rows the signed-in user may see, by scope kind. */
export function rosterVisibleTo(user: CurrentUser, roster: readonly ShiftWorker[]): ShiftWorker[] {
  if (user.permissions.has('attendance:all')) return [...roster];
  if (user.permissions.has('attendance:team')) {
    return roster.filter((w) =>
      user.scope.kind === 'site' ? w.site === user.scope.site : w.dept === user.dept || w.id === user.empId,
    );
  }
  return roster.filter((w) => w.id === user.empId);
}

export function useAttendanceScope(roster: readonly ShiftWorker[]) {
  const user = useCurrentUser();
  return useMemo(() => {
    if (!user) return { user: null, visible: [] as ShiftWorker[], seesOthers: false, seesAll: false };
    const visible = rosterVisibleTo(user, roster).sort((a, b) =>
      a.id === user.empId ? -1 : b.id === user.empId ? 1 : a.name.localeCompare(b.name),
    );
    return {
      user,
      visible,
      seesOthers: user.permissions.has('attendance:team') || user.permissions.has('attendance:all'),
      seesAll: user.permissions.has('attendance:all'),
    };
  }, [user, roster]);
}
