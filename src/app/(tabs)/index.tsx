import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useObservable, useValue } from "@legendapp/state/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { isGoalValid, missingPermissions, selectedPackages } from "@/features/onboarding/logic";
import { AppsSummary, FrequencyField, GoalField, LengthField, PermissionBanner } from "@/features/setup/components";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import { track } from "@/lib/analytics";
import { guard, REQUIRED_PERMISSIONS } from "@/lib/guard";
import { permissions$ } from "@/store/permissions.store";
import { setup$ } from "@/store/setup.store";

const copy = strings.setup;

/** Setup (SET-*): opens pre-filled from onboarding, with one primary action. */
export default function SetupScreen() {
  usePermissionStatus();
  const started$ = useObservable(false);
  const started = useValue(started$);
  const firstSession = useValue(() => setup$.sessionsStarted.get() === 0);

  // SET-05: why the button is disabled, if it is.
  const blocker = useValue(() => {
    const s = setup$.get();
    if (!isGoalValid(s.goal)) return copy.disabledGoal;
    if (selectedPackages(s.apps).length === 0) return copy.disabledApps;
    if (missingPermissions(permissions$.status.get(), REQUIRED_PERMISSIONS).length) return copy.disabledPermissions;
    return null;
  });

  async function start() {
    const s = setup$.peek();
    const packages = selectedPackages(s.apps);
    // The native session engine isn't built yet; guard falls back to the BRD 11.4 mock.
    await guard.startSession({
      sessionId: `${Date.now()}`,
      goal: s.goal.trim(),
      budgetSec: s.lengthMin * 60,
      frequency: s.frequency,
      everyHours: s.frequency === "every" ? s.everyHours : undefined,
      packages,
    });
    setup$.sessionsStarted.set((n) => n + 1);
    track("session_started", { budget_sec: s.lengthMin * 60, frequency: s.frequency, apps_count: packages.length });
    started$.set(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="px-5 pb-6 pt-4" keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" className="text-title font-extrabold">
          {copy.title}
        </Text>
        <Text className="mb-6 mt-1 text-walnut">{copy.subtitle}</Text>

        <PermissionBanner />
        <GoalField />
        <LengthField />
        <FrequencyField />
        <AppsSummary />

        <Button variant="tertiary" onPress={() => router.push("/limits/new")}>
          <Text>{copy.appLimits}</Text>
        </Button>
      </ScrollView>

      <View className="gap-2 px-5 pb-4 pt-3">
        {blocker ? <Text className="text-center text-caption text-muted-foreground">{blocker}</Text> : null}
        {started && !blocker ? <Text className="text-center text-caption text-success">{copy.sessionStarted}</Text> : null}
        <Button disabled={!!blocker} onPress={start}>
          <Text>{firstSession ? copy.startFirst : copy.start}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
