import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { LOCK_AFTER_BACKGROUND_MINUTES } from "@/constants";
import { useAppDispatch } from "@/redux/hooks";
import { locked } from "@/redux/slices/auth.slice";

/** Re-locks after the app has been in the background long enough (no-op unless biometrics are on). */
export function useAutoLock(): void {
  const dispatch = useAppDispatch();
  const backgroundedAt = useRef<number | null>(null);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background") {
        backgroundedAt.current = Date.now();
      } else if (next === "active" && backgroundedAt.current) {
        const away = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (away > LOCK_AFTER_BACKGROUND_MINUTES * 60_000) dispatch(locked());
      }
    });
    return () => sub.remove();
  }, [dispatch]);
}
