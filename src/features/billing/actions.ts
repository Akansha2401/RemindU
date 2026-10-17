import { useQuery } from "@tanstack/react-query";
import Purchases, {
  PURCHASES_ERROR_CODE,
  type PurchasesError,
  type PurchasesPackage,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { BILLING } from "@/config/billing";
import { strings } from "@/constants/strings";
import { applyCustomerInfo, isPurchasesConfigured } from "@/lib/purchases";
import { subscription$ } from "@/store/subscription.store";

const copy = strings.billing;

export const billingKeys = { offering: ["offering"] as const };

function ensureConfigured() {
  if (!isPurchasesConfigured()) throw new Error(copy.unavailable);
}

function isPurchasesError(e: unknown): e is PurchasesError {
  return typeof e === "object" && e !== null && "code" in e && "userCancelled" in e;
}

/** What to show for a failed billing call; null when the user simply backed out. */
export function billingErrorMessage(e: unknown): string | null {
  if (!isPurchasesError(e)) return e instanceof Error ? e.message : strings.common.tryAgain;
  switch (e.code) {
    case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return null;
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return copy.pending;
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return strings.common.offline;
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return copy.notAllowed;
    default:
      return strings.common.tryAgain;
  }
}

/**
 * Shows the RevenueCat paywall of the current offering (designed in the dashboard), unless the
 * user already has Pro. Resolves true when they end up with Pro.
 */
export async function showPaywall(): Promise<boolean> {
  ensureConfigured();
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: BILLING.entitlement,
  });
  // The customer info listener has already updated subscription$ by now.
  switch (result) {
    case PAYWALL_RESULT.PURCHASED:
    case PAYWALL_RESULT.RESTORED:
    case PAYWALL_RESULT.NOT_PRESENTED:
      return true;
    case PAYWALL_RESULT.ERROR:
      throw new Error(strings.common.tryAgain);
    default:
      return false;
  }
}

/**
 * Gate for Pro features: true right away for Pro users, otherwise opens the paywall straight
 * away (no extra "go Pro" popup) and resolves true if they bought or restored.
 */
export async function requirePro(): Promise<boolean> {
  if (subscription$.isPro.peek()) return true;
  return showPaywall();
}

/** RevenueCat Customer Center: cancel, change plan, refunds, restore and the store's manage page. */
export async function openCustomerCenter() {
  ensureConfigured();
  await RevenueCatUI.presentCustomerCenter({
    callbacks: {
      onRestoreCompleted: ({ customerInfo }) => applyCustomerInfo(customerInfo),
    },
  });
  // Plan changes and cancellations happen in the store; pull the latest state on return.
  applyCustomerInfo(await Purchases.getCustomerInfo());
}

/** Restores purchases made with this store account. Resolves true when Pro is active afterwards. */
export async function restorePurchases(): Promise<boolean> {
  ensureConfigured();
  applyCustomerInfo(await Purchases.restorePurchases());
  return subscription$.isPro.peek();
}

/** For a custom upgrade UI: buys one package of the current offering (monthly or yearly). */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  ensureConfigured();
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  applyCustomerInfo(customerInfo);
  return subscription$.isPro.peek();
}

async function fetchOffering() {
  ensureConfigured();
  const offerings = await Purchases.getOfferings();
  if (!offerings.current) throw new Error(copy.unavailable);
  const { current } = offerings;
  return { offering: current, monthly: current.monthly, yearly: current.annual };
}

/** The current offering with its monthly and yearly packages (localized prices included). */
export function useOffering() {
  return useQuery({ queryKey: billingKeys.offering, queryFn: fetchOffering, staleTime: 30 * 60_000 });
}
