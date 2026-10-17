import { Platform } from "react-native";

/**
 * RevenueCat setup. Products, the offering and the paywall are configured in the RevenueCat
 * dashboard; these ids must match it.
 *
 * Keys are RevenueCat *public* SDK keys, so they're safe in the client bundle. The Test Store
 * key (test_…) is for development only: release builds need the platform keys (appl_… / goog_…).
 */
export const BILLING = {
  /** Entitlement unlocked by either product. */
  entitlement: "remindu_pro",
  /** Store product ids, attached to the `$rc_monthly` / `$rc_annual` packages of the current offering. */
  products: { monthly: "monthly", yearly: "yearly" },
  apiKey:
    Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    }) ||
    process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ||
    "",
} as const;
