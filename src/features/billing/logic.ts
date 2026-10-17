import type { CustomerInfo } from "react-native-purchases";
import type { SubscriptionState } from "@/types/billing";

export const FREE: SubscriptionState = {
  ready: false,
  isPro: false,
  productId: null,
  expiresAt: null,
  willRenew: false,
  periodType: null,
  managementUrl: null,
};

/**
 * Whether `pkg` can get a timer: always with Pro; otherwise the apps that already have one plus
 * the ones being picked must stay within the free limit. Re-picking a running app replaces its
 * timer, so it doesn't count twice. If Pro lapses, existing timers keep running.
 */
export function canAddApp(pkg: string, taken: Iterable<string>, isPro: boolean, limit: number) {
  if (isPro) return true;
  const apps = new Set(taken);
  return apps.has(pkg) || apps.size < limit;
}

/** Pro status from CustomerInfo; `entitlements.active` already accounts for expiry and grace periods. */
export function toSubscription(info: CustomerInfo, entitlement: string): SubscriptionState {
  const active = info.entitlements.active[entitlement];
  if (!active) return { ...FREE, ready: true, managementUrl: info.managementURL };
  return {
    ready: true,
    isPro: true,
    productId: active.productIdentifier,
    expiresAt: active.expirationDate,
    willRenew: active.willRenew,
    periodType: active.periodType,
    managementUrl: info.managementURL,
  };
}
