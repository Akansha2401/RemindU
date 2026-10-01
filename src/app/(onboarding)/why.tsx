import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useObservable, useValue } from "@legendapp/state/react";
import { OptionTile } from "@/components/option-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { WHY_MAX } from "@/config/onboarding";
import { strings } from "@/constants/strings";
import { OnboardingScreen } from "@/features/onboarding/components/OnboardingScreen";
import { suggestionsFor } from "@/features/onboarding/logic";
import { useOnboardingStep } from "@/features/onboarding/useOnboardingStep";
import { onboarding$, onboardingActions } from "@/store/onboarding.store";

const copy = strings.onboarding.why;

// Screen 4: skippable. Saved as goals.why and shown under the goal at every check-in.
export default function WhyScreen() {
  useOnboardingStep("why");
  const persona = useValue(onboarding$.persona);
  const why = useValue(onboarding$.why);
  const writing$ = useObservable(why.source === "custom");
  const writing = useValue(writing$);
  const { whys } = suggestionsFor(persona);

  function pick(text: string) {
    writing$.set(false);
    onboardingActions.chooseWhy(text, "suggestion");
    router.push("/apps");
  }

  function writeOwn() {
    writing$.set(true);
    if (why.source !== "custom") onboardingActions.chooseWhy("", "custom");
  }

  function skip() {
    onboardingActions.skipWhy();
    router.push("/apps");
  }

  return (
    <OnboardingScreen
      step="why"
      title={copy.title}
      subtitle={copy.subtitle}
      headerRight={
        <Pressable accessibilityRole="button" onPress={skip} hitSlop={10}>
          <Text className="font-semibold text-muted-foreground">{strings.common.skip}</Text>
        </Pressable>
      }
      footer={
        writing ? (
          <Button disabled={why.text.trim().length === 0} onPress={() => router.push("/apps")}>
            <Text>{strings.common.continue}</Text>
          </Button>
        ) : undefined
      }
    >
      <View className="gap-3">
        {whys.map((w) => (
          <OptionTile
            key={w}
            label={w}
            selected={!writing && why.source === "suggestion" && why.text === w}
            onPress={() => pick(w)}
          />
        ))}
        <OptionTile icon="plus" label={copy.ownWords} selected={writing} onPress={writeOwn} />
        {writing && (
          <Input
            autoFocus
            multiline
            value={why.text}
            onChangeText={(t) => onboardingActions.chooseWhy(t, "custom")}
            placeholder={copy.placeholder}
            maxLength={WHY_MAX}
            className="min-h-[96px]"
            textAlignVertical="top"
            accessibilityLabel={copy.ownWords}
          />
        )}
      </View>
    </OnboardingScreen>
  );
}
