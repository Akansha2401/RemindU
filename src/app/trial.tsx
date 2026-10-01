import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { TRIAL_CONFIG } from "@/config/flags";
import { strings } from "@/constants/strings";
import { onboarding$ } from "@/store/onboarding.store";

const copy = strings.onboarding.trial;

/** Screen 8, behind FLAGS.trialScreen (off for the MVP; billing is Phase 2). */
export default function TrialScreen() {
  useEffect(() => {
    onboarding$.trialSeen.set(true);
  }, []);

  const steps = [
    { title: copy.today, body: copy.todayBody },
    { title: copy.reminder(TRIAL_CONFIG.reminderDay), body: copy.reminderBody },
    { title: copy.ends(TRIAL_CONFIG.endDay), body: copy.endsBody(TRIAL_CONFIG.price) },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background px-5">
      <View className="items-end pt-2">
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10}>
          <Text className="font-semibold text-muted-foreground">{copy.maybeLater}</Text>
        </Pressable>
      </View>
      <Text accessibilityRole="header" className="mt-6 text-title font-extrabold">
        {copy.title(TRIAL_CONFIG.endDay)}
      </Text>
      <View className="mt-8 flex-1">
        {steps.map((s, i) => (
          <View key={s.title} className="flex-row gap-4">
            <View className="items-center">
              <View className={i === 0 ? "h-4 w-4 rounded-full bg-primary" : "h-4 w-4 rounded-full bg-switch-off"} />
              {i < steps.length - 1 && <View className="w-0.5 flex-1 bg-switch-off" />}
            </View>
            <View className="flex-1 pb-8">
              <Text className="font-bold">{s.title}</Text>
              <Text className="mt-1 text-sm text-walnut">{s.body}</Text>
            </View>
          </View>
        ))}
      </View>
      <View className="pb-4">
        {/* Play Billing arrives in Phase 2; until then this just closes the screen. */}
        <Button onPress={() => router.back()}>
          <Text>{copy.cta}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
