const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres (doc 06 §11.5). Used for the client pre-check and the mock verdict. */
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export interface CircleFence {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

/**
 * The fence the point is inside (closest centre wins), else the nearest fence.
 * Inside is strict, with no accuracy tolerance (BR-10-01).
 */
export function nearestFence<T extends CircleFence>(fences: T[], lat: number, lng: number): { fence: T; distanceM: number; inside: boolean } | null {
  const ranked = fences
    .map((fence) => {
      const distanceM = distanceMeters(lat, lng, fence.centerLat, fence.centerLng);
      return { fence, distanceM, inside: distanceM <= fence.radiusMeters };
    })
    .sort((a, b) => Number(b.inside) - Number(a.inside) || a.distanceM - b.distanceM);
  return ranked[0] ?? null;
}
