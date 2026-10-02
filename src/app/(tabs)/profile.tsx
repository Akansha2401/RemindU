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
  dayStreak,
  heatmap,
  peakHour,
  screenTimeBars,
  totalCheckIns,
  usageByDay,
} from "@/features/stats/logic";
import { useTheme } from "@/hooks/useTheme";
import { formatDuration, formatHour } from "@/lib/format";
import { history$ } from "@/store/history.store";
import type { ChartRange } from "@/types/stats";

const copy = strings.profile;
const RANGES: ChartRange[] = ["week", "month", "year"];

/** Profile: who you are, your streak, activity grid, screen time and an overview. */
export default function ProfileScreen() {
  useScreenTimeOnFocus();
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

function Activity() {
  const { width } = useWindowDimensions();
  // Card padding (2 × 16) and screen padding (2 × 20).
  const weeks = weeksThatFit(width - 72);
  const grid = useStat((r) => heatmap(usageByDay(r), Date.now(), weeks));
  return (
    <Section title={copy.activityTitle} hint={copy.activityHelp}>
      <Heatmap weeks={grid} lessLabel={copy.less} moreLabel={copy.more} />
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
