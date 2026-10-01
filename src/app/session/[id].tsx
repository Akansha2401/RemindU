import { useEffect } from "react";
import { Alert, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useObservable, useValue } from "@legendapp/state/react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { CountdownRing } from "@/components/ui/countdown-ring";
import { StatusPill } from "@/components/ui/status-pill";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { maybeShowAttribution } from "@/features/onboarding/attribution";
import { SessionTimer, STATUS_TONE } from "@/features/sessions/components";
import { useAppIcons } from "@/hooks/useGuardApps";
import { useSessionPolling } from "@/hooks/useSessionPolling";
import { useTheme } from "@/hooks/useTheme";
import { formatClock, formatDuration, formatShortDate } from "@/lib/format";
import { history$ } from "@/store/history.store";
import { nextBudgetSec, sessionActions, sessions$ } from "@/store/session.store";
import { setup$ } from "@/store/setup.store";
import type { AppSession, UsageLog } from "@/types/guard";
import type { ArchivedSession } from "@/types/stats";

const copy = strings.session;

/** One app's timer: live while running, "time's up" takeover at zero, read-only once ended. */
export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useSessionPolling();
  const loaded = useValue(() => sessions$.get() !== undefined);
  const view = useValue(() => {
    const active = sessions$[id].get();
    if (active) return active.status === "time_up" ? "time_up" : "active";
    return history$.sessions[id].get() ? "ended" : "missing";
  });

  if (!loaded) return <View className="flex-1 bg-background" />;
  if (view === "time_up") return <TimeUp id={id} />;
  if (view === "missing") return <NotFound />;
  return <Detail id={id} ended={view === "ended"} />;
}

/** The active timer, or the ended one from history. */
function useSession(id: string): AppSession | ArchivedSession | undefined {
  return useValue(() => sessions$[id].get() ?? history$.sessions[id].get());
}

function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

function Detail({ id, ended }: { id: string; ended: boolean }) {
  // Static fields only; the ring, status and log subscribe to what changes.
  const label = useValue(() => (sessions$[id].label.get() ?? history$.sessions[id].label.get()) || "");

  function confirmEnd() {
    Alert.alert(copy.endConfirmTitle, copy.endConfirmBody, [
      { text: copy.cancel, style: "cancel" },
      {
        text: copy.endConfirm,
        style: "destructive",
        onPress: async () => {
          await sessionActions.end(id);
          goHome();
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title={label} back />
      <ScrollView contentContainerClassName="px-5 pb-8">
        {ended ? <EndedSummary id={id} /> : <Live id={id} />}
        <Goal id={id} />
        <Details id={id} />
        <TimeLog id={id} />
      </ScrollView>
      {!ended && (
        <View className="px-5 pb-4 pt-3">
          <Button variant="secondary" onPress={confirmEnd}>
            <Text>{copy.end}</Text>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

function Live({ id }: { id: string }) {
  const status = useValue(() => sessions$[id].status.get() ?? "waiting");
  const label = useValue(() => sessions$[id].label.get() ?? "");
  const help =
    status === "counting" ? copy.countingHelp(label) : status === "waiting" ? copy.waitingHelp : copy.pausedHelp;
  return (
    <View className="items-center pb-2 pt-4">
      <Ring id={id} />
      <StatusPill className="mt-6" tone={STATUS_TONE[status]} label={strings.status[status]} />
      <Text className="mt-2 text-center text-caption text-muted-foreground">{help}</Text>
    </View>
  );
}

function Ring({ id }: { id: string }) {
  const progress = useValue(() => {
    const s = sessions$[id].get();
    return s ? s.remainingSec / Math.max(1, s.budgetSec) : 0;
  });
  return (
    <CountdownRing progress={progress} size={220}>
      <SessionTimer id={id} className="text-display" />
      <Text className="text-caption text-muted-foreground">{copy.untilCheckIn}</Text>
    </CountdownRing>
  );
}

function EndedSummary({ id }: { id: string }) {
  const icon = useAppIcons()[history$.sessions[id].packageName.peek() ?? ""];
  const label = useValue(() => history$.sessions[id].label.get() ?? "");
  const used = useValue(() => totalMs(history$.sessions[id].logs.get() ?? []));
  return (
    <View className="items-center gap-2 pb-2 pt-4">
      <AppIcon uri={icon} size={64} label={label} />
      <Text className="text-display font-extrabold">{formatDuration(used)}</Text>
      <StatusPill tone="neutral" label={copy.ended} />
    </View>
  );
}

function Goal({ id }: { id: string }) {
  const goal = useValue(() => (sessions$[id].goal.get() ?? history$.sessions[id].goal.get()) || setup$.goal.get());
  const why = useValue(setup$.why);
  if (!goal) return null;
  return (
    <View className="mt-6 rounded-card bg-accent px-5 py-4">
      <Text className="text-caption font-bold uppercase tracking-widest text-accent-foreground">{copy.goalLabel}</Text>
      <Text className="mt-1 text-button font-bold">{goal}</Text>
      {why ? <Text className="mt-2 text-sm text-walnut">{why}</Text> : null}
    </View>
  );
}

function Details({ id }: { id: string }) {
  // Only fields that change rarely, so this doesn't re-render with the timer.
  const info = useValue(() => {
    const s = sessions$[id].get() ?? history$.sessions[id].get();
    if (!s) return null;
    return {
      length: strings.length.label(Math.round(s.budgetSec / 60)),
      frequency:
        s.frequency === "every" ? strings.length.frequencySummary.every(s.everyHours) : strings.length.frequencySummary[s.frequency],
      added: `${formatShortDate(s.createdAt)}, ${formatClock(s.createdAt)}`,
      started: s.startedAt ? `${formatShortDate(s.startedAt)}, ${formatClock(s.startedAt)}` : copy.notYet,
      checkIns: String(s.checkIns),
    };
  });
  if (!info) return null;
  const rows = [
    [copy.length, info.length],
    [copy.frequency, info.frequency],
    [copy.added, info.added],
    [copy.started, info.started],
    [copy.checkIns, info.checkIns],
  ];
  return (
    <View className="mt-6">
      <Text className="mb-2 text-label font-bold text-cocoa">{copy.details}</Text>
      <View className="rounded-card bg-card px-4 py-1">
        {rows.map(([k, v], i) => (
          <View key={k} className={i ? "flex-row justify-between border-t border-border py-3" : "flex-row justify-between py-3"}>
            <Text className="text-walnut">{k}</Text>
            <Text className="font-semibold">{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Shorter stretches are app switches, not visits.
const MIN_VISIT_MS = 5_000;

const totalMs = (logs: UsageLog[]) => logs.reduce((ms, [a, b]) => ms + (b - a), 0);

function dayLabel(at: number) {
  const day = new Date(at).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  if (day === today) return copy.today;
  if (day === today - 86_400_000) return copy.yesterday;
  return formatShortDate(at);
}

/** Every visit to the app, newest first, grouped by day. */
function TimeLog({ id }: { id: string }) {
  const s = useSession(id);
  const open = s && "status" in s && s.status === "counting";
  const logs = (s?.logs ?? []).filter(([a, b]) => b - a >= MIN_VISIT_MS).reverse();

  const groups: { day: string; logs: UsageLog[] }[] = [];
  for (const log of logs) {
    const day = dayLabel(log[0]);
    const last = groups.at(-1);
    if (last?.day === day) last.logs.push(log);
    else groups.push({ day, logs: [log] });
  }

  return (
    <View className="mt-6">
      <Text className="mb-2 text-label font-bold text-cocoa">{copy.logTitle}</Text>
      {groups.length === 0 ? (
        <View className="rounded-card bg-card px-4 py-4">
          <Text className="text-sm text-muted-foreground">{copy.logEmpty}</Text>
        </View>
      ) : (
        <View className="gap-4">
          {groups.map((g) => (
            <View key={g.day}>
              <Text className="mb-1.5 ml-1 text-caption font-bold uppercase tracking-widest text-muted-foreground">
                {g.day}
              </Text>
              <View className="rounded-card bg-card px-4 py-1">
                {g.logs.map(([a, b], i) => {
                  const live = open && g === groups[0] && i === 0;
                  return (
                    <View
                      key={a}
                      className={i ? "flex-row items-center justify-between border-t border-border py-3" : "flex-row items-center justify-between py-3"}
                    >
                      <View className="flex-row items-center gap-2">
                        <View className={live ? "h-2 w-2 rounded-full bg-primary" : "h-2 w-2 rounded-full bg-muted"} />
                        <Text className="font-semibold">
                          {copy.logRow(formatClock(a), live ? copy.logNow : formatClock(b))}
                        </Text>
                      </View>
                      <Text className="text-walnut">{formatDuration(b - a)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const BREATH_MS = 4000;

/** Dark takeover when an app's time runs out (the service brings RemindU to the front). */
function TimeUp({ id }: { id: string }) {
  const session = sessions$[id].peek();
  const goal = useValue(() => sessions$[id].goal.get() || setup$.goal.get());
  const why = useValue(setup$.why);
  const busy$ = useObservable(false);
  const busy = useValue(busy$);
  if (!session) return null;
  const nextLabel = strings.length.label(Math.round(nextBudgetSec(session) / 60));

  async function keepGoing() {
    busy$.set(true);
    await sessionActions.continue(id);
    busy$.set(false);
  }

  async function finish() {
    busy$.set(true);
    await sessionActions.end(id);
    router.replace("/");
    maybeShowAttribution();
  }

  return (
    <SafeAreaView className="flex-1 bg-takeover px-6">
      <View className="flex-1 items-center justify-center">
        <Text className="text-caption font-bold uppercase tracking-widest text-white/55">
          {copy.timeUpEyebrow(session.label)}
        </Text>
        {goal ? <Text className="mt-4 text-center text-quote font-extrabold text-white">“{goal}”</Text> : null}
        {why ? <Text className="mt-3 text-center text-white/60">{why}</Text> : null}
        <Breath />
        <Text className="mt-2 text-center text-sm text-white/60">{copy.timeUpTitle}</Text>
        <Text className="mt-1 text-center text-sm text-white/60">{copy.timeUpBody}</Text>
      </View>
      <View className="gap-2 pb-4">
        {session.frequency !== "once" && (
          <Button disabled={busy} onPress={keepGoing}>
            <Text>{copy.keepGoing(nextLabel)}</Text>
          </Button>
        )}
        <Button disabled={busy} variant={session.frequency === "once" ? "default" : "ghost"} onPress={finish}>
          <Text className={session.frequency === "once" ? undefined : "text-white/70"}>{copy.finish}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}

/** A circle that grows for 4s (breathe in) and shrinks for 4s (breathe out). */
function Breath() {
  const theme = useTheme();
  const scale = useSharedValue(0.6);
  const inhale$ = useObservable(true);
  const inhale = useValue(inhale$);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1, { duration: BREATH_MS, easing: Easing.inOut(Easing.ease) }), -1, true);
    const t = setInterval(() => inhale$.set((v) => !v), BREATH_MS);
    return () => clearInterval(t);
  }, [scale, inhale$]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View className="my-8 h-40 w-40 items-center justify-center">
      <Animated.View
        style={[style, { backgroundColor: theme.primary, opacity: 0.3 }]}
        className="absolute h-40 w-40 rounded-full"
      />
      <View className="h-24 w-24 items-center justify-center rounded-full bg-primary">
        <Text className="text-label font-bold text-white">{inhale ? copy.breatheIn : copy.breatheOut}</Text>
      </View>
    </View>
  );
}

function NotFound() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background px-5">
      <Text className="text-muted-foreground">{copy.notFound}</Text>
      <Button variant="outline" onPress={goHome} className="self-stretch">
        <Text>{copy.backHome}</Text>
      </Button>
    </SafeAreaView>
  );
}
