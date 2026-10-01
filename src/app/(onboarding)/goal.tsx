import { View } from "react-native";
import { router } from "expo-router";
import { useObservable, useValue } from "@legendapp/state/react";
import { OptionTile } from "@/components/option-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { GOAL_MAX } from "@/config/onboarding";
import { strings } from "@/constants/strings";
import { OnboardingScreen } from "@/features/onboarding/components/OnboardingScreen";
import { isGoalValid, suggestionsFor } from "@/features/onboarding/logic";
import { useOnboardingStep } from "@/features/onboarding/useOnboardingStep";
import { onboarding$, onboardingActions } from "@/store/onboarding.store";

const copy = strings.onboarding.goal;

// Screen 3: suggestions auto-advance; "Write my own" opens a field (SET-01: 3–80 chars).
export default function GoalScreen() {
  useOnboardingStep("goal");
  const persona = useValue(onboarding$.persona);
  const goal = useValue(onboarding$.goal);
  const writing$ = useObservable(goal.source === "custom");
  const writing = useValue(writing$);
  const { goals } = suggestionsFor(persona);

  function pick(text: string) {
    writing$.set(false);
    onboardingActions.chooseGoal(text, "suggestion");
    router.push("/why");
  }

  function writeOwn() {
    writing$.set(true);
    if (goal.source !== "custom") onboardingActions.chooseGoal("", "custom");
  }

  const valid = isGoalValid(goal.text);

  return (
    <OnboardingScreen
      step="goal"
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        writing ? (
          <Button disabled={!valid} onPress={() => router.push("/why")}>
            <Text>{strings.common.continue}</Text>
          </Button>
        ) : undefined
      }
    >
      <View className="gap-3">
        {goals.map((g) => (
          <OptionTile
            key={g}
            label={g}
            selected={!writing && goal.source === "suggestion" && goal.text === g}
            onPress={() => pick(g)}
          />
        ))}
        <OptionTile icon="plus" label={copy.writeOwn} selected={writing} onPress={writeOwn} />
        {writing && (
          <View>
            <Input
              autoFocus
              value={goal.text}
              onChangeText={(t) => onboardingActions.chooseGoal(t, "custom")}
              placeholder={copy.placeholder}
              maxLength={GOAL_MAX}
              returnKeyType="next"
              onSubmitEditing={() => valid && router.push("/why")}
              accessibilityLabel={copy.writeOwn}
            />
            <View className="mt-1.5 flex-row justify-between px-1">
              <Text className="text-caption text-muted-foreground">
                {goal.text.length > 0 && !valid ? copy.tooShort : ""}
              </Text>
              <Text className="text-caption text-muted-foreground">{copy.counter(goal.text.length, GOAL_MAX)}</Text>
            </View>
          </View>
        )}
      </View>
    </OnboardingScreen>
  );
}
