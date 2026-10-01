import type { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "@/components/ui/icon-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { PROGRESS_STEPS, type OnboardingStep } from "@/types/onboarding";
import { progressFor } from "../logic";
import { goBack } from "../useOnboardingStep";

type OnboardingScreenProps = {
  step: OnboardingStep;
  title: string;
  subtitle?: string;
  /** Pinned bottom area (primary button). Omit on auto-advance screens. */
  footer?: ReactNode;
  /** Top-right action, e.g. "Skip". */
  headerRight?: ReactNode;
  onBack?: () => void;
  children?: ReactNode;
};

/** Layout for one onboarding question: back button (not on welcome), progress (screens 2–6), title, content, footer. */
export function OnboardingScreen({ step, title, subtitle, footer, headerRight, onBack, children }: OnboardingScreenProps) {
  const progress = progressFor(step);
  const index = PROGRESS_STEPS.indexOf(step);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex-row items-center gap-4 px-5 pb-2 pt-2">
          {step !== "welcome" && (
            <IconButton icon="back" accessibilityLabel={strings.common.back} onPress={onBack ?? (() => goBack(step))} />
          )}
          <View className="flex-1">
            {progress !== null && (
              <ProgressBar
                value={progress}
                accessibilityLabel={strings.onboarding.progress(index + 1, PROGRESS_STEPS.length)}
              />
            )}
          </View>
          {headerRight}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          <Text accessibilityRole="header" className="text-title font-extrabold">
            {title}
          </Text>
          {subtitle ? <Text className="mt-2 text-walnut">{subtitle}</Text> : null}
          <View className="mt-6">{children}</View>
        </ScrollView>

        {footer ? <View className="gap-2 px-5 pb-4 pt-3">{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
