import { batch, observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { applyPersona, INITIAL_ONBOARDING, prefillApps } from "@/features/onboarding/logic";
import { persistPlugin } from "@/lib/persist";
import type { OnboardingState, OnboardingStep, Persona } from "@/types/onboarding";

/** Onboarding answers and position, persisted after every change so the flow can resume. */
export const onboarding$ = observable<OnboardingState>({ ...INITIAL_ONBOARDING });

syncObservable(onboarding$, {
  persist: { name: "onboarding", plugin: persistPlugin },
});

export const onboardingActions = {
  setStep(step: OnboardingStep) {
    onboarding$.step.set(step);
  },
  setPersona(persona: Persona) {
    onboarding$.set(applyPersona(onboarding$.peek(), persona));
  },
  chooseGoal(text: string, source: "suggestion" | "custom") {
    onboarding$.goal.set({ source, text });
  },
  chooseWhy(text: string, source: "suggestion" | "custom") {
    onboarding$.why.set({ source, text });
  },
  skipWhy() {
    onboarding$.why.set({ source: "skipped", text: "" });
  },
  prefillApps(installed: readonly { packageName: string; label: string }[]) {
    onboarding$.assign(prefillApps(onboarding$.peek(), installed));
  },
  setPermissionsSkipped(skipped: boolean) {
    onboarding$.permissionsSkipped.set(skipped);
  },
  complete() {
    onboarding$.completed.set(true);
  },
  finishAttribution() {
    onboarding$.attributionDone.set(true);
  },
  reset() {
    batch(() => onboarding$.set({ ...INITIAL_ONBOARDING }));
  },
};
