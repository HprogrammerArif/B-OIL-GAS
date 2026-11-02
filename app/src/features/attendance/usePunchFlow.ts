import { useCallback, useRef, useState } from "react";
import { clientPlatform, getDeviceId, newIdempotencyKey } from "@/lib/device";
import { haptic } from "@/lib/haptics";
import { nearestFence } from "@/lib/location/haversine";
import { capturePunchLocation, MAX_ACCURACY_M, PunchError, type PunchErrorCode, type PunchLocation } from "@/lib/location/punch-location";
import { toApiError } from "@/lib/api-error";
import type { Geofence, PunchResponse, PunchType } from "@/types/domain/attendance";
import { useGetGeofencesQuery, usePunchAttendanceMutation } from "./api";

export interface OutsideInfo {
  fence: Geofence;
  distanceM: number;
}

export type PunchPhase =
  | { kind: "idle" }
  | { kind: "locating"; accuracyM: number | null }
  | { kind: "error"; code: PunchErrorCode }
  | { kind: "weak"; accuracyM: number }
  | { kind: "outside"; type: PunchType; fix: PunchLocation; nearest: OutsideInfo }
  | { kind: "submitting" }
  | { kind: "failed"; message: string }
  | { kind: "result"; type: PunchType; response: PunchResponse };

/** Demo-only: pretend to stand at a site so presenters can punch from a desk (mock mode). */
export type DemoSpot = "REAL" | string;

function demoFix(fence: Geofence): PunchLocation {
  return { lat: fence.centerLat + 0.00018, lng: fence.centerLng, accuracyM: 8, isMock: false, capturedAt: new Date().toISOString() };
}

/** Drives the punch sequence of doc 05 §8.2; the server verdict stays authoritative. */
export function usePunchFlow(demoSpot: DemoSpot = "REAL") {
  const [phase, setPhase] = useState<PunchPhase>({ kind: "idle" });
  const fences = useGetGeofencesQuery();
  const [punch] = usePunchAttendanceMutation();
  const attempt = useRef(0);

  const submit = useCallback(
    async (type: PunchType, fix: PunchLocation, fieldDutyRequested: boolean, key: string) => {
      setPhase({ kind: "submitting" });
      try {
        const response = await punch({
          idempotencyKey: key,
          body: {
            type,
            punchedAt: new Date().toISOString(),
            lat: fix.lat,
            lng: fix.lng,
            accuracyM: fix.accuracyM,
            isMockLocation: fix.isMock,
            platform: clientPlatform,
            deviceId: await getDeviceId(),
            fieldDutyRequested: fieldDutyRequested || undefined,
          },
        }).unwrap();
        if (response.result === "ACCEPTED") haptic.success();
        else haptic.warning();
        setPhase({ kind: "result", type, response });
      } catch (err) {
        haptic.error();
        setPhase({ kind: "failed", message: toApiError(err).code });
      }
    },
    [punch],
  );

  const start = useCallback(
    async (type: PunchType) => {
      const id = ++attempt.current;
      const key = newIdempotencyKey();
      setPhase({ kind: "locating", accuracyM: null });
      const demo = demoSpot === "REAL" ? undefined : fences.data?.find((f) => f.id === demoSpot);
      try {
        const fix = demo
          ? demoFix(demo)
          : await capturePunchLocation((accuracyM) => attempt.current === id && setPhase({ kind: "locating", accuracyM }));
        if (attempt.current !== id) return;
        if (fix.accuracyM > MAX_ACCURACY_M) {
          setPhase({ kind: "weak", accuracyM: Math.round(fix.accuracyM) });
          return;
        }
        const near = nearestFence(fences.data ?? [], fix.lat, fix.lng);
        if (near && !near.inside) {
          setPhase({ kind: "outside", type, fix, nearest: { fence: near.fence, distanceM: Math.round(near.distanceM) } });
          return;
        }
        await submit(type, fix, false, key);
      } catch (err) {
        if (attempt.current !== id) return;
        setPhase(err instanceof PunchError ? { kind: "error", code: err.code } : { kind: "error", code: "TIMEOUT" });
      }
    },
    [demoSpot, fences.data, submit],
  );

  const confirmOutside = useCallback(() => {
    if (phase.kind === "outside") void submit(phase.type, phase.fix, true, newIdempotencyKey());
  }, [phase, submit]);

  const reset = useCallback(() => {
    attempt.current += 1;
    setPhase({ kind: "idle" });
  }, []);

  return { phase, start, confirmOutside, reset };
}
