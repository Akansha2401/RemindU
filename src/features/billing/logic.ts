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
