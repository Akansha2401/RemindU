import { useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { track } from "@/lib/analytics";
import { onboarding$, onboardingActions } from "@/store/onboarding.store";
import type { OnboardingStep } from "@/types/onboarding";
import { hrefForStep, previousStep, resumeStep } from "./logic";

// Once per app launch, the welcome screen forwards to wherever the user left off.
let resumeChecked = false;

/**
 * Call at the top of every onboarding screen. On focus it records the step (persisted, so
 * the flow resumes after Android Settings or a restart) and fires `onboarding_step`.
 */
export function useOnboardingStep(step: OnboardingStep) {
  useFocusEffect(
    useCallback(() => {
      if (!resumeChecked) {
        resumeChecked = true;
        const target = resumeStep(onboarding$.peek());
        if (step === "welcome" && target !== "welcome") {
          router.replace(hrefForStep(target));
          return;
        }
      }
      onboardingActions.setStep(step);
      track("onboarding_step", { step });
    }, [step]),
  );
}

/** Back that also works after a resume, when there's no history to pop. */
export function goBack(step: OnboardingStep) {
  if (router.canGoBack()) return router.back();
  const prev = previousStep(step);
  if (prev) router.replace(hrefForStep(prev));
}
