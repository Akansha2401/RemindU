import { router } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { AppPicker } from "@/features/onboarding/components/AppPicker";
import { OnboardingScreen } from "@/features/onboarding/components/OnboardingScreen";
import { selectedPackages } from "@/features/onboarding/logic";
import { useOnboardingStep } from "@/features/onboarding/useOnboardingStep";
import { onboarding$, onboardingActions } from "@/store/onboarding.store";

const copy = strings.onboarding.apps;

// Screen 5: suggested apps pre-toggled (APP-03); at least one app required.
export default function AppsScreen() {
  useOnboardingStep("apps");
  const count = useValue(() => selectedPackages(onboarding$.apps.get()).length);

  return (
    <OnboardingScreen
      step="apps"
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <Button disabled={count === 0} onPress={() => router.push("/permissions")}>
          <Text>{count === 0 ? copy.pickOne : copy.cta}</Text>
        </Button>
      }
    >
      <AppPicker
        selected$={onboarding$.apps}
        labels$={onboarding$.appLabels}
        onLoaded={onboardingActions.prefillApps}
      />
    </OnboardingScreen>
  );
}
