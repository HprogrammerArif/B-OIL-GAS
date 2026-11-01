import { useCallback, useEffect, useState } from "react";
import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";
import { getOfferings, purchasePackage, restorePurchases } from "@/services/revenueCat";
import { Alert } from "react-native";
import { logger } from "@/lib/logger";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface UseRevenueCatReturn {
  /** Available subscription packages from RevenueCat "default" offering */
  offerings: PurchasesOfferings | null;
  /** Current user's subscription/purchase status from RevenueCat */
  customerInfo: CustomerInfo | null;
  /** Whether offerings are being fetched */
  isLoadingOfferings: boolean;
  /** Whether a purchase is in progress (show spinner, disable button) */
  isPurchasing: boolean;
  /** Whether restore is in progress */
  isRestoring: boolean;
  /** Whether the user has an active "premium" entitlement */
  hasPremium: boolean;
  /** Trigger purchase sheet for a specific package */
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore previous purchases (required by Google Play / App Store policy) */
  restore: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useRevenueCat
 *
 * The main hook for all in-app purchase operations. Use this in your
 * SubscriptionScreen or any screen that needs to trigger purchases.
 *
 * @param onPurchaseSuccess - Optional callback called after a successful purchase.
 *   Use this to refetch your backend subscription status, invalidate RTK Query cache, etc.
 *
 * @example
 * const { offerings, isPurchasing, hasPremium, purchase, restore } = useRevenueCat({
 *   onPurchaseSuccess: () => refetchMySubscription(),
 * });
 */
export function useRevenueCat({
  onPurchaseSuccess,
}: {
  onPurchaseSuccess?: () => void;
} = {}): UseRevenueCatReturn {
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // ── Load offerings on mount ───────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsLoadingOfferings(true);
      const result = await getOfferings();
      if (isMounted) {
        setOfferings(result);
        setIsLoadingOfferings(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Listen for CustomerInfo updates in real-time ──────────────────────────
  // RevenueCat fires this listener whenever the subscription status changes
  // (purchase completes, subscription renews, etc.)
  useEffect(() => {
    const listener = (info: CustomerInfo) => {
      logger.log("[useRevenueCat] CustomerInfo updated:", {
        activeEntitlements: Object.keys(info.entitlements.active),
        activeSubscriptions: Array.from(info.activeSubscriptions),
      });
      setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  // ── Derived: does the user have premium? ─────────────────────────────────
  const hasPremium = !!customerInfo?.entitlements.active["premium"];

  // ── Purchase handler ──────────────────────────────────────────────────────
  const purchase = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      if (isPurchasing) return false;

      setIsPurchasing(true);
      try {
        const result = await purchasePackage(pkg);

        if (result.success) {
          setCustomerInfo(result.data);
          onPurchaseSuccess?.();
          return true;
        } else if (!result.userCancelled) {
          Alert.alert("Purchase Failed", result.error, [{ text: "OK" }]);
        }
        return false;
      } finally {
        setIsPurchasing(false);
      }
    },
    [isPurchasing, onPurchaseSuccess],
  );

  // ── Restore handler ───────────────────────────────────────────────────────
  const restore = useCallback(async (): Promise<void> => {
    if (isRestoring) return;

    setIsRestoring(true);
    try {
      const result = await restorePurchases();

      if (result.success) {
        setCustomerInfo(result.data);
        const hasPremiumAfterRestore = !!result.data.entitlements.active["premium"];

        if (hasPremiumAfterRestore) {
          onPurchaseSuccess?.();
          Alert.alert(
            "Purchases Restored! ✅",
            "Your subscription has been restored successfully.",
            [{ text: "Great!" }],
          );
        } else {
          Alert.alert(
            "No Purchases Found",
            "We couldn't find any previous purchases linked to your account.",
            [{ text: "OK" }],
          );
        }
      } else {
        Alert.alert("Restore Failed", result.error, [{ text: "OK" }]);
      }
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, onPurchaseSuccess]);

  return {
    offerings,
    customerInfo,
    isLoadingOfferings,
    isPurchasing,
    isRestoring,
    hasPremium,
    purchase,
    restore,
  };
}
