import { View } from "react-native";
import { router } from "expo-router";
import { useObservable, useValue } from "@legendapp/state/react";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { OptionTile } from "@/components/option-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { saveAttribution } from "@/features/onboarding/sync";
import { authStore$ } from "@/store/auth.store";
import { onboardingActions } from "@/store/onboarding.store";
import type { AcquisitionSource } from "@/types/onboarding";

const copy = strings.attribution;
const SOURCES: AcquisitionSource[] = ["creator", "instagram", "youtube", "friend", "other"];

/** Screen 9: shown once after the first completed session (see maybeShowAttribution). */
export default function AttributionScreen() {
  const form$ = useObservable<{ source: AcquisitionSource | null; creator: string }>({ source: null, creator: "" });
  const source = useValue(form$.source);
  const creator = useValue(form$.creator);

  const save = useMutation({
    mutationFn: async () => {
      const userId = authStore$.userId.peek();
      if (userId && source) await saveAttribution(userId, source, creator);
    },
    onSettled: () => {
      onboardingActions.finishAttribution();
      router.back();
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-background px-5">
      <Text accessibilityRole="header" className="mt-8 text-title font-extrabold">
        {copy.title}
      </Text>
      <Text className="mb-6 mt-2 text-walnut">{copy.subtitle}</Text>
      <View className="flex-1 gap-3">
        {SOURCES.map((s) => (
          <OptionTile key={s} label={copy.options[s]} selected={source === s} onPress={() => form$.source.set(s)} />
        ))}
        {source === "creator" && (
          <View className="mt-2">
            <Text className="mb-2 text-label font-bold text-cocoa">{copy.creatorLabel}</Text>
            <Input
              value={creator}
              onChangeText={(t) => form$.creator.set(t)}
              placeholder={copy.creatorPlaceholder}
              maxLength={80}
              accessibilityLabel={copy.creatorLabel}
            />
          </View>
        )}
      </View>
      <View className="pb-4">
        <Button disabled={!source || save.isPending} onPress={() => save.mutate()}>
          <Text>{copy.cta}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
