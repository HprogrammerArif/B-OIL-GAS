import { useSyncExternalStore } from "react";
import { connectivity } from "@/lib/connectivity";

/** Same online signal the transport uses, so disabled actions match what requests will do. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(connectivity.subscribe, connectivity.isOnline, connectivity.isOnline);
}
