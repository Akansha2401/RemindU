import { View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { useOnboardingStep } from "@/features/onboarding/useOnboardingStep";

const copy = strings.onboarding.welcome;

// Screen 1: no back button, no progress bar.
export default function Welcome() {
  useOnboardingStep("welcome");

  return (
    <SafeAreaView className="flex-1 bg-background px-5">
      <View className="flex-1 justify-end pb-10">
        <Text className="text-caption font-bold uppercase tracking-widest text-muted-foreground">{copy.eyebrow}</Text>
        <Text accessibilityRole="header" className="mt-3 text-quote font-extrabold">
          {copy.title}
        </Text>
        <Text className="mt-3 text-walnut">{copy.subtitle}</Text>
      </View>
      <View className="gap-2 pb-4">
        <Button onPress={() => router.push("/persona")}>
          <Text>{copy.cta}</Text>
        </Button>
        <Button variant="link" onPress={() => router.push({ pathname: "/sign-in", params: { returning: "1" } })}>
          <Text>{copy.haveAccount}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
