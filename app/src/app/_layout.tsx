import { useEffect, useRef } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from "expo-router";
import Toast from "react-native-toast-message";
import type { NotificationResponse } from "expo-notifications";
import "@/global.css";

// Must run before any other module (Redux store included) so Reactotron can
// hook into everything from the start — this ordering is intentional, hence
// the imports below the require() call instead of at the very top of the file.
/* eslint-disable import/first, @typescript-eslint/no-require-imports */
if (__DEV__) {
  require("../lib/ReactotronConfig");
}

import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import OfflineBanner from "@/components/OfflineBanner";
import { initSentry } from "@/lib/sentry";
import { configureRevenueCat, loginRevenueCat, logoutRevenueCat } from "@/lib/revenuecat";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { logger } from "@/lib/logger";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Initialize Sentry once at module load (no-op if DSN not set)
initSentry();

// ─── Inner layout — has Redux store access ───────────────────────────────────
function InnerLayout() {
  const colorScheme = useColorScheme();
  const user = useAppSelector(selectCurrentUser);
  const hasConfiguredRevenueCat = useRef(false);

  // RevenueCat.configure() must run exactly once at startup — re-calling it on every
  // login/logout resets SDK state. Subsequent identity changes use logIn/logOut instead.
  useEffect(() => {
    const userId = user?.id ? String(user.id) : null;

    if (!hasConfiguredRevenueCat.current) {
      configureRevenueCat(userId);
      hasConfiguredRevenueCat.current = true;
      return;
    }

    if (userId) {
      loginRevenueCat(userId);
    } else {
      logoutRevenueCat();
    }
  }, [user?.id]);

  // Register for push notifications
  useNotifications({
    onTokenReady: (pushToken: string) => {
      // TODO: dispatch(updateDeviceToken({ device_token: pushToken }));
      logger.log("[Layout] Push token:", pushToken);
    },
    onNotificationResponse: (_response: NotificationResponse) => {
      // TODO: navigate to relevant screen based on response.notification.request.content.data
    },
  });

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Slot />
      <OfflineBanner />
      <Toast />
    </ThemeProvider>
  );
}

// ─── Root Layout — all providers ────────────────────────────────────────────
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ReduxProvider>
        <InnerLayout />
      </ReduxProvider>
    </ErrorBoundary>
  );
}
