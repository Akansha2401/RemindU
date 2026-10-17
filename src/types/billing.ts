/** The user's RemindU Pro status, derived from RevenueCat's CustomerInfo. */
export type SubscriptionState = {
  /** False until the first CustomerInfo arrives (don't show "free" before we know). */
  ready: boolean;
  isPro: boolean;
  /** Store product id of the active subscription, e.g. "monthly" or "yearly". */
  productId: string | null;
  /** ISO date the current period ends; null for lifetime or no subscription. */
  expiresAt: string | null;
  /** False once the user has cancelled: Pro stays on until `expiresAt`. */
  willRenew: boolean;
  /** "NORMAL", "TRIAL" or "INTRO". */
  periodType: string | null;
  /** Store page where the user manages the subscription. */
  managementUrl: string | null;
};
