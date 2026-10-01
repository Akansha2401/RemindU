import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { AppIcon } from "@/components/app-icon";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { useAppIcons } from "@/hooks/useGuardApps";
import { useTheme } from "@/hooks/useTheme";
import { formatCountdown } from "@/lib/format";
import { cn } from "@/lib/utils";
import { sessions$ } from "@/store/session.store";
import type { AppSession, SessionStatus } from "@/types/guard";

export const STATUS_TONE: Record<SessionStatus, StatusTone> = {
  waiting: "neutral",
  counting: "counting",
  paused: "success",
  time_up: "error",
};

// Running and time's-up timers first, then the rest in the order they were added.
const ORDER: Record<SessionStatus, number> = { counting: 0, time_up: 1, paused: 2, waiting: 3 };

/** Session ids in display order. Re-renders only when a status changes or a timer is added/removed. */
export function useSessionIds() {
  // A string compares by value, so the every-second timer updates don't re-render the list.
  const joined = useValue(() =>
    Object.values(sessions$.get() ?? {})
      .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.createdAt - b.createdAt)
      .map((s) => s.sessionId)
      .join("|"),
  );
  return joined ? joined.split("|") : [];
}

export const openSession = (id: string) => router.push({ pathname: "/session/[id]", params: { id } });

/** Countdown text for one timer; the only thing that re-renders every second. */
export function SessionTimer({ id, className }: { id: string; className?: string }) {
  const remaining = useValue(() => sessions$[id].remainingSec.get() ?? 0);
  return (
    <Text accessibilityRole="timer" className={cn("font-extrabold tabular-nums", className)}>
      {formatCountdown(remaining)}
    </Text>
  );
}

function SessionProgress({ id }: { id: string }) {
  const progress = useValue(() => {
    const s = sessions$[id].get();
    return s ? s.remainingSec / Math.max(1, s.budgetSec) : 0;
  });
  return <ProgressBar value={progress} className="h-1.5" />;
}

function SessionStatusPill({ id }: { id: string }) {
  const status = useValue(() => sessions$[id].status.get() ?? "waiting");
  return <StatusPill tone={STATUS_TONE[status]} label={strings.status[status]} className="self-start" />;
}

function useSessionInfo(id: string) {
  const label = useValue(() => sessions$[id].label.get() ?? "");
  const pkg = useValue(() => sessions$[id].packageName.get() ?? "");
  const icon = useAppIcons()[pkg];
  return { label, icon };
}

/** Compact row for Home. */
export function SessionRow({ id }: { id: string }) {
  const theme = useTheme();
  const { label, icon } = useSessionInfo(id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => openSession(id)}
      className="gap-3 rounded-input bg-card px-4 py-3.5 active:opacity-80"
    >
      <View className="flex-row items-center gap-3">
        <AppIcon uri={icon} size={40} label={label} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-bold">
            {label}
          </Text>
          <StatusText id={id} />
        </View>
        <SessionTimer id={id} className="text-section" />
        <Icon name="chevronRight" size={16} color={theme.mutedForeground} />
      </View>
      <SessionProgress id={id} />
    </Pressable>
  );
}

function StatusText({ id }: { id: string }) {
  const status = useValue(() => sessions$[id].status.get() ?? "waiting");
  return (
    <Text className={cn("text-caption", status === "time_up" ? "text-destructive" : "text-muted-foreground")}>
      {strings.status[status]}
    </Text>
  );
}

const startOfToday = () => new Date().setHours(0, 0, 0, 0);

/** Visits today (each time the app was opened). */
export function opensToday(s: Pick<AppSession, "logs">) {
  const today = startOfToday();
  return s.logs.filter(([start]) => start >= today).length;
}

/** Bigger rectangle for the Sessions tab. */
export function SessionCard({ id }: { id: string }) {
  const { label, icon } = useSessionInfo(id);
  const length = useValue(() => strings.length.label(Math.round((sessions$[id].budgetSec.get() ?? 0) / 60)));
  const frequency = useValue(() => {
    const s = sessions$[id].get();
    if (!s) return "";
    return s.frequency === "every" ? strings.length.frequencySummary.every(s.everyHours) : strings.length.frequencySummary[s.frequency];
  });
  const opens = useValue(() => {
    const s = sessions$[id].get();
    return s ? opensToday(s) : 0;
  });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => openSession(id)}
      className="gap-4 rounded-card bg-card p-4 active:opacity-80"
    >
      <View className="flex-row items-center gap-3">
        <AppIcon uri={icon} size={44} label={label} />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-button font-bold">
            {label}
          </Text>
          <Text className="text-caption text-muted-foreground">
            {length} · {frequency}
          </Text>
        </View>
        <SessionStatusPill id={id} />
      </View>
      <View className="flex-row items-end justify-between">
        <View>
          <SessionTimer id={id} className="text-display" />
          <Text className="text-caption text-muted-foreground">{strings.sessions.of(length)}</Text>
        </View>
        <Text className="text-caption text-muted-foreground">{strings.sessions.opens(opens)}</Text>
      </View>
      <SessionProgress id={id} />
    </Pressable>
  );
}
