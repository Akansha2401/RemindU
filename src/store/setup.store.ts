import { observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { persistPlugin } from "@/lib/persist";
import type { OnboardingState, SetupState } from "@/types/onboarding";

export const SETUP_DEFAULTS: SetupState = {
  goal: "",
  why: "",
  lengthMin: 60,
  frequency: "once",
  everyHours: 1,
  apps: {},
  appLabels: {},
  sessionsStarted: 0,
};

/** Session setup, remembered between sessions (SET-07). */
export const setup$ = observable<SetupState>({ ...SETUP_DEFAULTS });

syncObservable(setup$, {
  persist: { name: "setup", plugin: persistPlugin },
});

export const setupActions = {
  /** Pre-fills Setup from the onboarding answers. */
  fromOnboarding(o: OnboardingState) {
    setup$.assign({
      goal: o.goal.text,
      why: o.why.source === "skipped" ? "" : o.why.text,
      apps: { ...o.apps },
      appLabels: { ...o.appLabels },
    });
  },
  reset() {
    setup$.set({ ...SETUP_DEFAULTS });
  },
};
