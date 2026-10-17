import { observable } from "@legendapp/state";
import { FREE } from "@/features/billing/logic";
import type { SubscriptionState } from "@/types/billing";

/**
 * Mirrors RevenueCat's CustomerInfo (see `lib/purchases.ts`). Not persisted: the SDK caches
 * CustomerInfo itself and answers from that cache at launch, even offline.
 */
export const subscription$ = observable<SubscriptionState>({ ...FREE });
