import { router } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { OnboardingScreen } from "@/features/onboarding/components/OnboardingScreen";
import { PermissionList } from "@/features/onboarding/components/PermissionList";
import { missingPermissions } from "@/features/onboarding/logic";
import { useOnboardingStep } from "@/features/onboarding/useOnboardingStep";
import { REQUIRED_PERMISSIONS } from "@/lib/guard";
import { onboardingActions } from "@/store/onboarding.store";
import { permissions$ } from "@/store/permissions.store";

const copy = strings.onboarding.permissions;

// Screen 6: "Not now" is allowed; Setup then shows the permission banner (ONB-05).
export default function PermissionsScreen() {
  useOnboardingStep("permissions");
  const ready = useValue(() => missingPermissions(permissions$.status.get(), REQUIRED_PERMISSIONS).length === 0);

  function next(skipped: boolean) {
    onboardingActions.setPermissionsSkipped(skipped);
    router.push("/sign-in");
  }

  return (
    <OnboardingScreen
      step="permissions"
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <>
          <Button disabled={!ready} onPress={() => next(false)}>
            <Text>{copy.cta}</Text>
          </Button>
          <Button variant="ghost" onPress={() => next(true)}>
            <Text>{strings.common.notNow}</Text>
          </Button>
        </>
      }
    >
      <PermissionList />
    </OnboardingScreen>
  );
}
