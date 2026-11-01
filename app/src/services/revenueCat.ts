import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";
import { logger } from "@/lib/logger";

// ─────────────────────────────────────────────────────────────────────────────
// Result Types
// ─────────────────────────────────────────────────────────────────────────────

type PurchaseResult =
  | { success: true; data: CustomerInfo; userCancelled?: false }
  | { success: false; error: string; userCancelled: boolean };

type RestoreResult = { success: true; data: CustomerInfo } | { success: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// Service Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch available subscription offerings from RevenueCat.
 * Returns null if the SDK is not configured or an error occurs.
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    logger.error(
      "[RevenueCat] getOfferings error (Normal on emulators without Play Store):",
      error,
    );
    return null;
  }
}

/**
 * Purchase a specific package from RevenueCat.
 * Returns a typed result — never throws.
 *
 * @param pkg - The PurchasesPackage to purchase (from offerings)
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    logger.log("[RevenueCat] Purchase successful:", {
      activeEntitlements: Object.keys(customerInfo.entitlements.active),
    });
    return { success: true, data: customerInfo };
  } catch (error) {
    // RevenueCat sets userCancelled: true when the user dismisses the sheet
    const err = error as { userCancelled?: boolean; message?: string };
    const userCancelled = err?.userCancelled === true;
    if (!userCancelled) {
      logger.error("[RevenueCat] Purchase error:", error);
    } else {
      logger.log("[RevenueCat] Purchase cancelled by user.");
    }
    return {
      success: false,
      error: err?.message ?? "Purchase failed. Please try again.",
      userCancelled,
    };
  }
}

/**
 * Restore previous purchases for the current user.
 * Required by Google Play and App Store policies.
 * Returns a typed result — never throws.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    logger.log("[RevenueCat] Restore successful:", {
      activeEntitlements: Object.keys(customerInfo.entitlements.active),
    });
    return { success: true, data: customerInfo };
  } catch (error) {
    logger.error("[RevenueCat] Restore error:", error);
    const err = error as { message?: string };
    return {
      success: false,
      error: err?.message ?? "Restore failed. Please try again.",
    };
  }
}
