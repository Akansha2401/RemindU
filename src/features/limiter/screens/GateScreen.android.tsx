import { useEffect, useEffectEvent } from "react";
import { BackHandler, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { Observable } from "@legendapp/state";
import { useObservable, useValue } from "@legendapp/state/react";
import { AppLimiter, type InstalledApp } from "@modules/app-limiter";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import type { GateParams } from "@/types/limiter";
import { logCheckin } from "../api";

// Replace with the user's own goals from your goals table when that exists.
const QUICK_INTENTIONS = ["Reply to messages", "Post something", "Take a planned break"];

export default function GateScreen() {
  const { ruleId, pkg, reason } = useLocalSearchParams<GateParams>();
  // The gate screen is reused (getId), so key on the params to reset state per app.
  return <Gate key={`${ruleId}:${pkg}`} ruleId={ruleId} pkg={pkg} reason={reason} />;
}

function Gate({ ruleId, pkg, reason }: GateParams) {
  const gate$ = useObservable({
    app: (): Promise<InstalledApp | null> => AppLimiter.getAppInfo(pkg),
    state: AppLimiter.getRuleState(ruleId),
    intention: "",
  });
  // Typing only re-renders IntentionInput/StartButton, which subscribe to intention$ themselves.
  const app = useValue(gate$.app);
  const state = useValue(gate$.state);

  // Hardware back must not drop them back into the app they were blocked from.
  const onBack = useEffectEvent(() => leave());
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, []);

  function closeGate() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  function leave() {
    logCheckin({ limit_id: ruleId, package_name: pkg, intention: "", outcome: "skipped" });
    AppLimiter.goHome();
    closeGate();
  }

  function start() {
    const next = AppLimiter.startSession(ruleId);
    if (!next) {
      gate$.state.set(AppLimiter.getRuleState(ruleId)); // limit reached meanwhile
      return;
    }
    logCheckin({ limit_id: ruleId, package_name: pkg, intention: gate$.intention.peek().trim(), outcome: "started" });
    AppLimiter.openApp(pkg);
    closeGate();
  }

  const appName = app?.label ?? "this app";
  const left = state ? state.sessionsPerDay - state.used : 0;
  const limitReached = reason === "limit" || left <= 0;

  return (
    <View className="flex-1 justify-center bg-background px-6">
      <AppIcon uri={app?.icon} size={64} style={{ marginBottom: 20 }} />

      {limitReached ? (
        <>
          <Text className="mb-2 text-3xl font-bold text-foreground">That&apos;s all for {appName} today</Text>
          <Text className="mb-10 text-base text-muted-foreground">
            You used all {state?.sessionsPerDay} sessions. It opens again tomorrow.
          </Text>
          <Button onPress={leave}>
            <Text>Go to home screen</Text>
          </Button>
        </>
      ) : (
        <>
          <Text className="mb-2 text-3xl font-bold text-foreground">
            {reason === "time_up" ? `Your ${state?.sessionMinutes} minutes are up` : `Opening ${appName}`}
          </Text>
          <Text className="mb-6 text-base text-muted-foreground">
            {left} of {state?.sessionsPerDay} sessions left today. What&apos;s this one for?
          </Text>

          <View className="mb-3 flex-row flex-wrap gap-2">
            {QUICK_INTENTIONS.map((q) => (
              <IntentionChip key={q} label={q} intention$={gate$.intention} />
            ))}
          </View>
          <IntentionInput intention$={gate$.intention} />
          <StartButton intention$={gate$.intention} minutes={state?.sessionMinutes} onPress={start} />
          <Button variant="ghost" onPress={leave} className="py-3">
            <Text>Not now</Text>
          </Button>
        </>
      )}
    </View>
  );
}

// ---------- leaf components: each subscribes only to what it shows ----------

function IntentionChip({ label, intention$ }: { label: string; intention$: Observable<string> }) {
  const selected = useValue(() => intention$.get() === label);
  return <Chip label={label} selected={selected} onPress={() => intention$.set(label)} />;
}

function IntentionInput({ intention$ }: { intention$: Observable<string> }) {
  const intention = useValue(intention$);
  return (
    <Input
      value={intention}
      onChangeText={(t) => intention$.set(t)}
      placeholder="Or type your own"
      className="mb-8"
    />
  );
}

function StartButton(props: { intention$: Observable<string>; minutes?: number; onPress: () => void }) {
  const disabled = useValue(() => props.intention$.get().trim().length < 3);
  return (
    <Button disabled={disabled} onPress={props.onPress} className="mb-3">
      <Text>Start {props.minutes}-minute session</Text>
    </Button>
  );
}
