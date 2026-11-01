import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { logger } from "@/lib/logger";

interface UseAppStateReturn {
  /** Current app state: "active" | "background" | "inactive" */
  appState: AppStateStatus;
  /** True when app is in the foreground */
  isActive: boolean;
  /** True when app is in the background */
  isBackground: boolean;
}

/**
 * useAppState
 *
 * Tracks the current React Native AppState (foreground/background).
 *
 * @example
 * const { isActive } = useAppState();
 * useEffect(() => {
 *   if (isActive) refetchData();
 * }, [isActive]);
 */
export function useAppState(): UseAppStateReturn {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      setAppState(nextState);
      logger.log("[AppState]", nextState);
    });

    return () => subscription.remove();
  }, []);

  return {
    appState,
    isActive: appState === "active",
    isBackground: appState === "background",
  };
}
