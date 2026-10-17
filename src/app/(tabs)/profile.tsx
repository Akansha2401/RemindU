import type { ReactNode } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { useObservable, useValue } from "@legendapp/state/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/avatar";
import { BarChart } from "@/components/charts/bar-chart";
import { Heatmap, weeksThatFit } from "@/components/charts/heatmap";
import { StatTile } from "@/components/stat-tile";
import { Icon } from "@/components/ui/icon";
import { GlassIconButton } from "@/components/ui/glass-icon-button";
import { Segmented } from "@/components/ui/segmented";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { useProfile } from "@/features/profile/api";
import { useScreenTimeOnFocus, useStat } from "@/features/stats/hooks";
import {
  averageOf,
  averageVisitMs,
  dateKey,
  dayStreak,
  focusByDay,
  focusSummary,
  fromDateKey,
  heatmap,
  monthStarts,
  peakHour,
  screenTimeBars,
  totalCheckIns,
} from "@/features/stats/logic";
import { useTheme } from "@/hooks/useTheme";
import { useNow } from "@/hooks/useNow";
import { useSessionPolling } from "@/hooks/useSessionPolling";
import { formatDuration, formatHour, formatMonth, formatShortDate } from "@/lib/format";
import { history$ } from "@/store/history.store";
import type { ChartRange, HeatCell } from "@/types/stats";

const copy = strings.profile;
const RANGES: ChartRange[] = ["week", "month", "year"];

/** Profile: who you are, your streak, activity grid, screen time and an overview. */
export default function ProfileScreen() {
  useScreenTimeOnFocus();
  // Activity reads the timers' usage logs; keep them fresh without 1s polling.
  useSessionPolling(30_000);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="px-5 pb-10 pt-2">
        <View className="flex-row justify-end">
          <GlassIconButton icon="gear" accessibilityLabel={copy.settings} onPress={() => router.push("/settings")} />
        </View>
        <Identity />
        <Activity />
        <ScreenTime />
        <Overview />
      </ScrollView>
    </SafeAreaView>
  );
}

function Identity() {
  const theme = useTheme();
  const profile = useProfile();
  const streak = useStat((r) => dayStreak(r, Date.now()));
  const name = profile.data?.name ?? "";
  return (
    <View className="mb-8 items-center">
      <Avatar uri={profile.data?.avatarUrl} name={name} />
      <Text accessibilityRole="header" className="mt-3 text-title font-extrabold">
        {name}
      </Text>
      <View className="mt-2 flex-row items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5">
        <Icon name="flame" size={16} color={theme.primary} />
        <Text className="text-label font-bold text-accent-foreground">{copy.streak(streak)}</Text>
      </View>
    </View>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-section font-extrabold">{title}</Text>
      {hint ? <Text className="mt-0.5 text-caption text-muted-foreground">{hint}</Text> : null}
      <View className="mt-3 rounded-card bg-card shadow-card p-4">{children}</View>
    </View>
  );
}

function dayText(c: HeatCell) {
  const date = formatShortDate(fromDateKey(c.date).getTime());
  if (c.status === "none") return copy.dayDetail.none(date);
  return copy.dayDetail[c.status](date, formatDuration(c.usedMs), formatDuration(c.limitMs));
}

/** GitHub-style, but positive: days within the app limits light up (about four months). */
function Activity() {
  const { width } = useWindowDimensions();
  // Card padding (2 × 16) and screen padding (2 × 20).
  const weeks = weeksThatFit(width - 72);
  const grid = useStat((r) => heatmap(focusByDay(r, Date.now()), Date.now(), weeks));
  const selected$ = useObservable<string | null>(null);
  const selected = useValue(selected$);
  const today = dateKey(useNow());
  const summary = focusSummary(grid);
  const months = monthStarts(grid).map((m) => ({ week: m.week, label: formatMonth(m.month) }));
  const shown = grid.flat().find((c) => c.date === (selected ?? today));
  const tracked = summary.trackedDays > 0;

  return (
    <Section
      title={copy.activityTitle}
      hint={tracked ? copy.activityHelp(summary.withinDays, summary.trackedDays) : copy.activityIntro}
    >
      <Heatmap
        weeks={grid}
        months={months}
        dayLabels={copy.weekdays}
        today={today}
        selected={selected}
        onSelect={(d) => selected$.set((cur) => (cur === d ? null : d))}
        cellLabel={dayText}
        lessLabel={copy.overLimit}
        moreLabel={copy.wellUnder}
      />
      <Text className="mt-3 text-caption text-walnut">{tracked ? (shown ? dayText(shown) : null) : copy.activityEmpty}</Text>
      {tracked && (
        <View className="mt-4 flex-row gap-3 border-t border-border pt-4">
          <StatTile icon="check" label={copy.daysWithin} value={String(summary.withinDays)} />
          <View className="w-hairline bg-border" />
          <StatTile icon="flame" label={copy.bestRun} value={copy.runDays(summary.bestRun)} />
          <View className="w-hairline bg-border" />
          <StatTile
            icon="timer"
            label={copy.avgUsed}
            value={summary.averageUsedMs != null ? formatDuration(summary.averageUsedMs) : copy.noValue}
          />
        </View>
      )}
    </Section>
  );
}

function ScreenTime() {
  const range$ = useObservable<ChartRange>("week");
  const range = useValue(range$);
  const bars = useValue(() => screenTimeBars(history$.screenTime.get(), range$.get(), Date.now()));
  const avg = averageOf(bars);
  return (
    <Section title={copy.screenTimeTitle}>
      <Segmented options={RANGES} labels={copy.ranges} value={range} onChange={(r) => range$.set(r)} />
      <View className="mb-4 mt-4">
        <Text className="text-caption text-muted-foreground">{copy.dailyAverage}</Text>
        <Text className="text-title font-extrabold">{avg != null ? formatDuration(avg) : copy.noValue}</Text>
      </View>
      {avg != null ? (
        <BarChart bars={bars} highlightKey={range === "year" ? undefined : bars.at(-1)?.key /* today */} formatValue={formatDuration} />
      ) : (
        <Text className="py-6 text-center text-sm text-muted-foreground">{copy.noData}</Text>
      )}
    </Section>
  );
}

function Overview() {
  const avg = useStat(averageVisitMs);
  const peak = useStat(peakHour);
  const breaths = useStat(totalCheckIns);
  return (
    <Section title={copy.overviewTitle}>
      <View className="flex-row gap-3">
        <StatTile icon="timer" label={copy.avgSession} value={avg != null ? formatDuration(avg) : copy.noValue} />
        <View className="w-hairline bg-border" />
        <StatTile icon="history" label={copy.peakTime} value={peak != null ? formatHour(peak) : copy.noValue} />
        <View className="w-hairline bg-border" />
        <StatTile icon="wind" label={copy.breaths} value={String(breaths)} />
      </View>
    </Section>
  );
}
