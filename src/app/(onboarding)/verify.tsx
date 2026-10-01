import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useObservable, useValue } from "@legendapp/state/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { sendEmailCode, verifyEmailCode } from "@/features/auth/actions";
import { OnboardingScreen } from "@/features/onboarding/components/OnboardingScreen";

const copy = strings.auth.verify;
const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

/** ONB-03: clear messages for a wrong or expired code. */
function codeError(e: Error) {
  return /expired/i.test(e.message) ? copy.expired : copy.wrongCode;
}

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const state$ = useObservable({ code: "", cooldown: RESEND_SECONDS, resent: false });
  const code = useValue(state$.code);
  const cooldown = useValue(state$.cooldown);
  const resent = useValue(state$.resent);

  // Signing in flips the route guard, which swaps this stack for the app (Setup).
  const verify = useMutation({ mutationFn: (token: string) => verifyEmailCode(email, token) });
  const resend = useMutation({
    mutationFn: () => sendEmailCode(email),
    onSuccess: () => state$.assign({ cooldown: RESEND_SECONDS, resent: true }),
  });

  useEffect(() => {
    const id = setInterval(() => state$.cooldown.set((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [state$]);

  function onChange(t: string) {
    const digits = t.replace(/\D/g, "").slice(0, CODE_LENGTH);
    state$.code.set(digits);
    verify.reset();
    if (digits.length === CODE_LENGTH) verify.mutate(digits);
  }

  return (
    <OnboardingScreen
      step="sign-in"
      title={copy.title}
      subtitle={copy.subtitle(email)}
      footer={
        <Button
          disabled={code.length < CODE_LENGTH || verify.isPending}
          onPress={() => verify.mutate(code)}
        >
          <Text>{verify.isPending ? copy.verifying : copy.cta}</Text>
        </Button>
      }
    >
      <Input
        autoFocus
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={CODE_LENGTH}
        placeholder="000000"
        className="text-center text-section font-extrabold tracking-[8px]"
        accessibilityLabel={copy.title}
      />
      {verify.error && <Text className="mt-2 text-destructive">{codeError(verify.error)}</Text>}
      {resent && !resend.isPending && <Text className="mt-2 text-success">{copy.resent}</Text>}

      <View className="mt-6 gap-3">
        <Pressable
          accessibilityRole="button"
          disabled={cooldown > 0 || resend.isPending}
          onPress={() => resend.mutate()}
          hitSlop={6}
        >
          <Text className={cooldown > 0 ? "text-muted-foreground" : "font-semibold text-primary"}>
            {cooldown > 0 ? copy.resendIn(cooldown) : copy.resend}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={6}>
          <Text className="font-semibold text-primary">{copy.changeEmail}</Text>
        </Pressable>
      </View>
    </OnboardingScreen>
  );
}
