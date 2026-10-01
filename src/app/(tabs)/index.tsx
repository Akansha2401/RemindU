import { ScrollView, View } from "react-native";
import { useValue } from "@legendapp/state/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AppIcon } from "@/components/app-icon";
import { EmptyState } from "@/components/empty-state";
import { PermissionBanner } from "@/components/permission-banner";
import { StatTile } from "@/components/stat-tile";
import { openAddSheet } from "@/components/tab-bar";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { useProfile } from "@/features/profile/api";
import { SessionRow, useSessionIds } from "@/features/sessions/components";
import { useScreenTimeOnFocus, useStat } from "@/features/stats/hooks";
import { dayStreak, greetingFor, todayScreenTime } from "@/features/stats/logic";
import { useAppIcons } from "@/hooks/useGuardApps";
import { useNow } from "@/hooks/useNow";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import { useSessionPolling } from "@/hooks/useSessionPolling";
import { formatDuration, formatLongDate } from "@/lib/format";
import { history$ } from "@/store/history.store";
import { permissions$ } from "@/store/permissions.store";

const copy = strings.home;

/** Home: greeting, today's stats and every app timer. */
export default function HomeScreen() {
  usePermissionStatus();
  useSessionPolling();
  useScreenTimeOnFocus();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="px-5 pb-10 pt-4">
        <Greeting />
        <TodayStats />
        <PermissionBanner />
        <Apps />
      </ScrollView>
    </SafeAreaView>
  );
}

function Greeting() {
  const profile = useProfile();
  const now = useNow();
  const greeting = copy.greeting[greetingFor(new Date(now).getHours())];
  const firstName = profile.data?.name.split(" ")[0];
  return (
    <View className="mb-5">
      <Text className="text-label font-semibold uppercase tracking-widest text-muted-foreground">
        {formatLongDate(now)}
      </Text>
      <Text accessibilityRole="header" className="mt-1 text-title font-extrabold">
        {firstName ? copy.greetingName(greeting, firstName) : greeting}
      </Text>
    </View>
  );
}

function TodayStats() {
  const streak = useStat((r) => dayStreak(r, Date.now()));
  const today = useValue(() => todayScreenTime(history$.screenTime.get(), Date.now()));
  const usage = useValue(() => permissions$.status.get()?.usage ?? true);
  const icons = useAppIcons();
  const top = today.topApp;
  const fallback = usage ? copy.none : copy.noAccess;

  return (
    <View className="mb-6 flex-row gap-3 rounded-card bg-card p-4">
      <StatTile icon="flame" label={copy.streak} value={String(streak)} />
      <View className="w-hairline bg-border" />
      <StatTile icon="phone" label={copy.screenTime} value={today.totalMs != null ? formatDuration(today.totalMs) : fallback} />
      <View className="w-hairline bg-border" />
      <StatTile icon="star" label={copy.mostUsed} value={fallback}>
        {top ? (
          <View className="flex-row items-center gap-1.5">
            <AppIcon uri={icons[top.packageName]} size={22} label={top.label} />
            <Text numberOfLines={1} className="flex-1 font-extrabold">
              {top.label}
            </Text>
          </View>
        ) : undefined}
      </StatTile>
    </View>
  );
}

function Apps() {
  const ids = useSessionIds();
  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-section font-extrabold">{copy.appsTitle}</Text>
        {ids.length > 0 && (
          <Button size="sm" variant="ghost" onPress={() => router.navigate("/sessions")}>
            <Text>{copy.seeAll}</Text>
          </Button>
        )}
      </View>
      {ids.length ? (
        <View className="gap-2.5">
          {ids.map((id) => (
            <SessionRow key={id} id={id} />
          ))}
        </View>
      ) : (
        <EmptyState icon="timer" title={copy.emptyTitle} body={copy.emptyBody}>
          <Button onPress={openAddSheet}>
            <Text>{copy.emptyCta}</Text>
          </Button>
        </EmptyState>
      )}
    </View>
  );
}
