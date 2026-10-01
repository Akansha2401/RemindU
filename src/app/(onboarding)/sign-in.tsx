import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { signInWithGoogle } from "@/features/auth/actions";
import { OnboardingScreen } from "@/features/onboarding/components/OnboardingScreen";
import { useOnboardingStep } from "@/features/onboarding/useOnboardingStep";

const copy = strings.auth.signIn;

// Screen 7: Google (ONB-02) or email code (ONB-03). New and returning users share this flow.
export default function SignInScreen() {
  useOnboardingStep("sign-in");
  const { returning } = useLocalSearchParams<{ returning?: string }>();

  const google = useMutation({
    mutationFn: signInWithGoogle,
  });

  return (
    <OnboardingScreen
      step="sign-in"
      title={returning ? copy.titleReturning : copy.title}
      subtitle={returning ? copy.subtitleReturning : copy.subtitle}
      footer={
        <>
          <Button disabled={google.isPending} onPress={() => google.mutate()}>
            <Text>{copy.google}</Text>
          </Button>
          <Button variant="outline" onPress={() => router.push("/email")}>
            <Icon name="mail" />
            <Text>{copy.email}</Text>
          </Button>
          <Text className="mt-1 text-center text-caption text-muted-foreground">{copy.terms}</Text>
        </>
      }
    >
      {google.data === false && <Text className="text-muted-foreground">{copy.googleCancelled}</Text>}
      {google.error && <Text className="text-destructive">{google.error.message || strings.common.tryAgain}</Text>}
    </OnboardingScreen>
  );
}
