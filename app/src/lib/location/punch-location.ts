import * as Location from "expo-location";
import { Linking } from "react-native";

export interface PunchLocation {
  lat: number;
  lng: number;
  accuracyM: number;
  isMock: boolean;
  capturedAt: string;
}

export type PunchErrorCode = "PERMISSION_DENIED" | "LOCATION_OFF" | "TIMEOUT";

/** A recoverable reason the fix could not be taken; the UI maps the code to a message. */
export class PunchError extends Error {
  constructor(readonly code: PunchErrorCode) {
    super(code);
  }
}

export const MAX_ACCURACY_M = 50;
const MAX_WAIT_MS = 20_000;

export const openLocationSettings = () => Linking.openSettings();

/** Current foreground permission without prompting. */
export async function locationPermission(): Promise<"granted" | "denied" | "undetermined"> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === "granted" ? "granted" : status === "denied" ? "denied" : "undetermined";
}

/**
 * Takes the best fix within 20 s, stopping early at ≤ 50 m (doc 05 §8.2). A weak fix is returned, not thrown,
 * so the caller decides whether to retry; mocked fixes are flagged and still submitted for the server verdict.
 */
export async function capturePunchLocation(onProgress?: (accuracyM: number) => void): Promise<PunchLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new PunchError("PERMISSION_DENIED");
  if (!(await Location.hasServicesEnabledAsync())) throw new PunchError("LOCATION_OFF");

  const deadline = Date.now() + MAX_WAIT_MS;
  let best: Location.LocationObject | null = null;
  while (Date.now() < deadline) {
    try {
      const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const acc = fix.coords.accuracy ?? Number.POSITIVE_INFINITY;
      if (!best || acc < (best.coords.accuracy ?? Number.POSITIVE_INFINITY)) best = fix;
      if (Number.isFinite(acc)) onProgress?.(Math.round(acc));
      if (acc <= MAX_ACCURACY_M) break;
    } catch {
      if (!(await Location.hasServicesEnabledAsync())) throw new PunchError("LOCATION_OFF");
    }
  }
  if (!best) throw new PunchError("TIMEOUT");
  return {
    lat: best.coords.latitude,
    lng: best.coords.longitude,
    accuracyM: Math.round((best.coords.accuracy ?? 9999) * 100) / 100,
    isMock: best.mocked ?? false,
    capturedAt: new Date(best.timestamp).toISOString(),
  };
}
