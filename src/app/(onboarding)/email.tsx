import { router } from "expo-router";
import { useObservable, useValue } from "@legendapp/state/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { sendEmailCode } from "@/features/auth/actions";
import { OnboardingScreen } from "@/features/onboarding/components/OnboardingScreen";

const copy = strings.auth.email;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function EmailScreen() {
  const email$ = useObservable("");
  const email = useValue(email$);
  const valid = EMAIL.test(email.trim());

  const send = useMutation({
    mutationFn: () => sendEmailCode(email),
    onSuccess: () => router.push({ pathname: "/verify", params: { email: email.trim().toLowerCase() } }),
  });

  return (
    <OnboardingScreen
      step="sign-in"
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <Button disabled={!valid || send.isPending} onPress={() => send.mutate()}>
          <Text>{send.isPending ? copy.sending : copy.cta}</Text>
        </Button>
      }
    >
      <Input
        autoFocus
        value={email}
        onChangeText={(t) => email$.set(t)}
        placeholder={copy.placeholder}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={() => valid && send.mutate()}
        accessibilityLabel={copy.title}
      />
      {email.length > 3 && !valid && <Text className="mt-2 text-caption text-destructive">{copy.invalid}</Text>}
      {send.error && <Text className="mt-2 text-destructive">{send.error.message || strings.common.tryAgain}</Text>}
    </OnboardingScreen>
  );
}
