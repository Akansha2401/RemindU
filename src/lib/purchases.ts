import Purchases, { LOG_LEVEL, type CustomerInfo } from "react-native-purchases";
import { BILLING } from "@/config/billing";
import { toSubscription } from "@/features/billing/logic";
import { authStore$ } from "@/store/auth.store";
import { subscription$ } from "@/store/subscription.store";

let configured = false;

export const isPurchasesConfigured = () => configured;

/** Every CustomerInfo the SDK hands us (launch, purchase, restore, renewal, logIn) lands here. */
export function applyCustomerInfo(info: CustomerInfo) {
  subscription$.set(toSubscription(info, BILLING.entitlement));
}

/**
 * Configures RevenueCat once per launch, called from the root layout. The RevenueCat app user
 * id is the Supabase user id, so Pro follows the account across reinstalls and devices (and
 * webhooks can be matched to `profiles`). In Expo Go the SDK runs in preview mode with mocks.
 */
export function initPurchases() {
  if (configured) return;
  if (!BILLING.apiKey) {
    console.warn("RevenueCat API key missing: set EXPO_PUBLIC_REVENUECAT_*_API_KEY in .env");
    return;
  }
  if (__DEV__) void Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  Purchases.configure({ apiKey: BILLING.apiKey, appUserID: authStore$.userId.peek() });
  configured = true;

  Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
  Purchases.getCustomerInfo()
    .then(applyCustomerInfo)
    .catch((e) => console.warn("could not read customer info", e));

  // Sign-in / sign-out after launch: switch the RevenueCat user with the Supabase session.
  authStore$.userId.onChange(({ value }) => {
    identify(value).catch((e) => console.warn("RevenueCat identify failed", e));
  });
}

async function identify(userId: string | null) {
  if (userId) {
    const { customerInfo } = await Purchases.logIn(userId);
    applyCustomerInfo(customerInfo);
  } else if (!(await Purchases.isAnonymous())) {
    // logOut throws for an already-anonymous user.
    applyCustomerInfo(await Purchases.logOut());
  }
}
