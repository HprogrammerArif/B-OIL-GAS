import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Platform } from "react-native";
import { logger } from "./logger";

// ─────────────────────────────────────────────────────────────────────────────
// RevenueCat API Keys
// Add these to your .env.local:
//   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxxxxxxxx
//   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxxxxxx
// ─────────────────────────────────────────────────────────────────────────────
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";

/**
 * Call this ONCE at app startup (in _layout.tsx) BEFORE any purchase calls.
 *
 * @param userId - Pass your backend user ID so RevenueCat ties purchases
 *                 to a specific user. Webhooks will include this ID.
 *                 If null, RevenueCat uses an anonymous ID.
 */
export async function configureRevenueCat(userId?: string | null): Promise<void> {
  if (!ANDROID_KEY && !IOS_KEY) {
    logger.warn(
      "[RevenueCat] No API key found. Make sure EXPO_PUBLIC_REVENUECAT_ANDROID_KEY is set in .env.local",
    );
    return;
  }

  // Enable verbose logging in development — shows exactly what RC is doing
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.setLogHandler((logLevel, message) => {
      const formattedMessage = `[RevenueCat] ${message}`;
      if (logLevel === LOG_LEVEL.ERROR) {
        if (
          message.includes("Billing service unavailable on device") ||
          message.includes("Billing is not available in this device") ||
          message.includes("BILLING_UNAVAILABLE")
        ) {
          console.warn(
            `${formattedMessage}\n(Note: This is expected on emulators/simulators without Google Play Store / Billing services.)`,
          );
        } else {
          console.warn(formattedMessage);
        }
      } else if (logLevel === LOG_LEVEL.WARN) {
        console.warn(formattedMessage);
      } else if (logLevel === LOG_LEVEL.INFO) {
        console.info(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    });
  }

  const apiKey = Platform.OS === "ios" ? IOS_KEY : ANDROID_KEY;

  Purchases.configure({
    apiKey,
    // Pass your user ID so RevenueCat can correlate purchases with your backend.
    // This is the same ID your Django backend uses.
    appUserID: userId ? String(userId) : undefined,
  });

  logger.log("[RevenueCat] SDK configured successfully.");
}

/**
 * Call after user logs in to associate purchases with their account.
 * If they purchased as anonymous, RevenueCat will merge the history.
 *
 * @param userId - Your backend user ID (string)
 */
export async function loginRevenueCat(userId: string): Promise<void> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    logger.log(
      "[RevenueCat] Logged in user:",
      userId,
      "| Active entitlements:",
      Object.keys(customerInfo.entitlements.active),
    );
  } catch (error) {
    logger.error("[RevenueCat] Login error:", error);
  }
}

/**
 * Call on user logout to reset RevenueCat to anonymous state.
 * This prevents purchase data from leaking between accounts.
 */
export async function logoutRevenueCat(): Promise<void> {
  try {
    await Purchases.logOut();
    logger.log("[RevenueCat] Logged out, reset to anonymous.");
  } catch (error) {
    // logOut throws if user is already anonymous — safe to ignore
    logger.log("[RevenueCat] logOut (already anonymous):", error);
  }
}
