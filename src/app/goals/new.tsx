import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useObservable, useValue } from "@legendapp/state/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { GOAL_MAX, WHY_MAX } from "@/config/onboarding";
import { strings } from "@/constants/strings";
import { useCreateGoal, useGoals } from "@/features/goals/api";
import { isGoalValid } from "@/features/onboarding/logic";

const copy = strings.goals;
const CHALLENGES = ["none", "7", "21", "30"] as const;

/** Create a goal, optionally as an N-day challenge. */
export default function NewGoalScreen() {
  const goals = useGoals();
  const create = useCreateGoal();
  const hasFocus = !!goals.data?.some((g) => g.is_active);
  const form$ = useObservable({ text: "", why: "", challenge: "none" as (typeof CHALLENGES)[number], focus: !hasFocus });
  const text = useValue(form$.text);
  const why = useValue(form$.why);
  const challenge = useValue(form$.challenge);
  const focus = useValue(form$.focus);
  const valid = isGoalValid(text);

  function save() {
    create.mutate(
      {
        goal: { text, why, challengeDays: challenge === "none" ? null : Number(challenge) },
        focus: form$.focus.peek(),
      },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScreenHeader title={copy.newTitle} back />
        <ScrollView contentContainerClassName="gap-6 px-5 pb-6 pt-2" keyboardShouldPersistTaps="handled">
          <View>
            <Text className="mb-2 text-label font-bold text-cocoa">{copy.textLabel}</Text>
            <Input
              value={text}
              onChangeText={(t) => form$.text.set(t)}
              placeholder={copy.textPlaceholder}
              maxLength={GOAL_MAX}
              autoFocus
              accessibilityLabel={copy.textLabel}
            />
          </View>
          <View>
            <Text className="mb-2 text-label font-bold text-cocoa">{copy.whyLabel}</Text>
            <Input
              value={why}
              onChangeText={(t) => form$.why.set(t)}
              placeholder={copy.whyPlaceholder}
              maxLength={WHY_MAX}
              multiline
              className="min-h-[88px]"
              textAlignVertical="top"
              accessibilityLabel={copy.whyLabel}
            />
          </View>
          <View>
            <Text className="mb-2 text-label font-bold text-cocoa">{copy.challengeLabel}</Text>
            <View accessibilityRole="radiogroup" className="flex-row gap-2 rounded-[18px] bg-muted p-3">
              {CHALLENGES.map((c) => (
                <Chip
                  key={c}
                  className="flex-1 px-2"
                  label={copy.challengeOptions[c]}
                  selected={challenge === c}
                  onPress={() => form$.challenge.set(c)}
                />
              ))}
            </View>
          </View>
          <View className="flex-row items-center gap-3 rounded-input bg-card px-4 py-3.5">
            <View className="flex-1">
              <Text className="font-semibold">{copy.makeFocus}</Text>
              <Text className="text-caption text-muted-foreground">{copy.focusHelp}</Text>
            </View>
            <Switch checked={focus} onPress={() => form$.focus.set((v) => !v)} accessibilityLabel={copy.makeFocus} />
          </View>
          {create.error ? <Text className="text-center text-destructive">{strings.common.tryAgain}</Text> : null}
        </ScrollView>
        <View className="px-5 pb-4 pt-3">
          <Button disabled={!valid || create.isPending} onPress={save}>
            <Text>{create.isPending ? copy.saving : copy.save}</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
