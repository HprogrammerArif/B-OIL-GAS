// ─────────────────────────────────────────────────────────────────────────────
// Push Notifications Hook
//
// Handles:
//   1. Requesting permission
//   2. Registering for Expo Push Token
//   3. Listening for incoming notifications (foreground)
//   4. Listening for notification tap (background/killed)
//
// Usage in root _layout.tsx:
//   const { expoPushToken } = useNotifications({
//     onTokenReady: (token) => dispatch(updateDeviceToken({ device_token: token })),
//   });
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { logger } from "@/lib/logger";

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface UseNotificationsOptions {
  /** Called once when the push token is ready. Use to send token to your backend. */
  onTokenReady?: (token: string) => void;
  /** Called when a notification is received in the foreground. */
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  /** Called when the user taps a notification. */
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

interface UseNotificationsReturn {
  /** The Expo push token string, or null if not yet granted/registered. */
  expoPushToken: string | null;
  /** Whether notification permission is granted. */
  permissionGranted: boolean;
}

/**
 * useNotifications
 *
 * Register for push notifications and listen for events.
 * Call this once in the root _layout.tsx.
 *
 * The listeners are subscribed exactly once (on mount) regardless of how often the
 * caller passes new inline callback props — but the *latest* callbacks are always
 * invoked, via a ref that's kept in sync every render. This avoids both listener
 * churn (which would repeatedly tear down/rebuild push registration) and the stale-
 * closure trap of capturing the first render's callbacks forever.
 */
export function useNotifications({
  onTokenReady,
  onNotificationReceived,
  onNotificationResponse,
}: UseNotificationsOptions = {}): UseNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Always hold the latest callbacks without making them effect dependencies.
  const callbacksRef = useRef({ onTokenReady, onNotificationReceived, onNotificationResponse });
  useEffect(() => {
    callbacksRef.current = { onTokenReady, onNotificationReceived, onNotificationResponse };
  });

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        setPermissionGranted(true);
        callbacksRef.current.onTokenReady?.(token);
      }
    });

    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      logger.log("[Notifications] Received:", notification);
      callbacksRef.current.onNotificationReceived?.(notification);
    });

    // Notification tap listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      logger.log("[Notifications] Tapped:", response);
      callbacksRef.current.onNotificationResponse?.(response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, permissionGranted };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Android requires a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2B7FFF",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    logger.log("[Notifications] Permission not granted.");
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? process.env.EXPO_PUBLIC_PROJECT_ID;

    if (!projectId) {
      logger.warn("[Notifications] EXPO_PUBLIC_PROJECT_ID is not set. Cannot register push token.");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    logger.log("[Notifications] Push token:", tokenData.data);
    return tokenData.data;
  } catch (error) {
    logger.error("[Notifications] Failed to get push token:", error);
    return null;
  }
}

/**
 * Schedule a local notification (for testing or in-app alerts).
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  delaySeconds = 1,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {} },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
  });
}
