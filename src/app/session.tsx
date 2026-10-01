import { Alert, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { CountdownRing } from "@/components/ui/countdown-ring";
import { StatusPill } from "@/components/ui/status-pill";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { maybeShowAttribution } from "@/features/onboarding/attribution";
import { useSessionPolling } from "@/hooks/useSessionPolling";
import { formatCountdown } from "@/lib/format";
import { session$, sessionActions } from "@/store/session.store";
import { setup$ } from "@/store/setup.store";

const copy = strings.session;

/** Running session. Opened from Setup, the notification, or by the service when time is up. */
export default function SessionScreen() {
  useSessionPolling();
  const loaded = useValue(() => session$.get() !== undefined);
  const active = useValue(() => !!session$.get());
  const timeUp = useValue(() => session$.get()?.status === "time_up");

  if (!loaded) return <View className="flex-1 bg-background" />;
  if (!active) return <NoSession />;
  return timeUp ? <TimeUp /> : <Running />;
}

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

function Running() {
  function confirmEnd() {
    Alert.alert(copy.endConfirmTitle, copy.endConfirmBody, [
      { text: copy.cancel, style: "cancel" },
      {
        text: copy.endConfirm,
        style: "destructive",
        onPress: async () => {
          await sessionActions.end();
          router.replace("/");
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="items-center px-5 pb-6 pt-6">
        <Text className="text-caption font-bold uppercase tracking-widest text-muted-foreground">{copy.eyebrow}</Text>
        <View className="mt-8">
          <Ring />
        </View>
        <View className="mt-6">
          <Status />
        </View>
        <Text className="mt-2 text-center text-caption text-muted-foreground">{copy.pausedHelp}</Text>
        <GoalCard />
        <CountingApps />
      </ScrollView>
      <View className="gap-2 px-5 pb-4 pt-3">
        <Button variant="secondary" onPress={confirmEnd}>
          <Text>{copy.end}</Text>
        </Button>
        <Button variant="ghost" onPress={leave}>
          <Text>{strings.common.back}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}

// Leaf components: each one subscribes only to what it shows, so the every-second
// refresh re-renders the timer and status, not the whole screen.

function Ring() {
  const remaining = useValue(() => session$.get()?.remainingSec ?? 0);
  const budget = useValue(() => session$.get()?.budgetSec ?? 1);
  return (
    <CountdownRing progress={remaining / budget}>
      <Text accessibilityRole="timer" className="text-display font-extrabold">
        {formatCountdown(remaining)}
      </Text>
      <Text className="text-caption text-muted-foreground">{copy.untilCheckIn}</Text>
    </CountdownRing>
  );
}

function Status() {
  const label = useValue(() => {
    const s = session$.get();
    if (s?.status !== "counting") return null;
    const pkg = s.foregroundPackage ?? "";
    return setup$.appLabels[pkg].get() ?? pkg;
  });
  return label ? (
    <StatusPill tone="counting" label={copy.counting(label)} />
  ) : (
    <StatusPill tone="success" label={copy.paused} />
  );
}

function GoalCard() {
  const goal = useValue(() => session$.get()?.goal ?? "");
  const why = useValue(setup$.why);
  if (!goal) return null;
  return (
    <View className="mt-8 w-full rounded-card bg-accent px-5 py-4">
      <Text className="text-caption font-bold uppercase tracking-widest text-accent-foreground">{copy.goalLabel}</Text>
      <Text className="mt-1 text-button font-bold">{goal}</Text>
      {why ? <Text className="mt-2 text-sm text-walnut">{why}</Text> : null}
    </View>
  );
}

function CountingApps() {
  const names = useValue(() => {
    const pkgs = session$.get()?.packages ?? [];
    const labels = setup$.appLabels.get();
    return pkgs.map((p) => labels[p] ?? p).join(", ");
  });
  if (!names) return null;
  return (
    <View className="mt-3 w-full rounded-input bg-card px-4 py-3.5">
      <Text className="text-label font-bold text-cocoa">{copy.appsLabel}</Text>
      <Text className="mt-1 text-sm">{names}</Text>
    </View>
  );
}

/** Dark takeover shown when the budget runs out (the service brings the app to the front). */
function TimeUp() {
  const goal = useValue(() => session$.get()?.goal ?? "");
  const frequency = useValue(() => session$.get()?.frequency ?? "once");
  const nextLabel = useValue(() => {
    const s = session$.get();
    if (!s) return "";
    const sec = s.frequency === "every" ? (s.everyHours ?? 1) * 3600 : s.budgetSec;
    return strings.setup.lengths[sec / 60] ?? formatCountdown(sec);
  });
  const why = useValue(setup$.why);

  async function finish() {
    await sessionActions.end();
    router.replace("/");
    maybeShowAttribution();
  }

  return (
    <SafeAreaView className="flex-1 bg-takeover px-6">
      <View className="flex-1 items-center justify-center">
        <Text className="text-caption font-bold uppercase tracking-widest text-white/55">{copy.timeUpEyebrow}</Text>
        <Text className="mt-4 text-center text-quote font-extrabold text-white">“{goal}”</Text>
        {why ? <Text className="mt-3 text-center text-white/60">{why}</Text> : null}
        <Text className="mt-6 text-center text-sm text-white/60">{copy.timeUpTitle}</Text>
        <Text className="mt-1 text-center text-sm text-white/60">{copy.timeUpBody}</Text>
      </View>
      <View className="gap-2 pb-4">
        {frequency !== "once" && (
          <Button onPress={sessionActions.continue}>
            <Text>{copy.keepGoing(nextLabel)}</Text>
          </Button>
        )}
        <Button variant={frequency === "once" ? "default" : "ghost"} onPress={finish}>
          <Text className={frequency === "once" ? undefined : "text-white/70"}>{copy.finish}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}

function NoSession() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background px-5">
      <Text className="text-muted-foreground">{copy.noSession}</Text>
      <Button variant="outline" onPress={() => router.replace("/")} className="self-stretch">
        <Text>{copy.backToSetup}</Text>
      </Button>
    </SafeAreaView>
  );
}
