/** Feature flags. Billing is Phase 2 (BRD 6.9), so the trial screen is off for the MVP. */
export const FLAGS = {
  trialScreen: false,
} as const;

/** Trial copy inputs; the real price will come from Play Billing in Phase 2. */
export const TRIAL_CONFIG = {
  price: "₹99/month",
  reminderDay: 5,
  endDay: 7,
} as const;
