import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { EmptyState } from "@/components/empty-state";
import { ScreenHeader } from "@/components/screen-header";
import { openAddSheet } from "@/components/tab-bar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { SessionCard, useSessionIds } from "@/features/sessions/components";
import { useAppIcons } from "@/hooks/useGuardApps";
import { useSessionPolling } from "@/hooks/useSessionPolling";
import { useTheme } from "@/hooks/useTheme";
import { formatDuration, formatShortDate } from "@/lib/format";
import { history$ } from "@/store/history.store";

const copy = strings.sessions;
const PAST_LIMIT = 20;

/** Every app timer as a card; ended ones below. */
export default function SessionsScreen() {
  useSessionPolling();
  const ids = useSessionIds();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="pb-10">
        <ScreenHeader title={copy.title} subtitle={copy.subtitle} />
        <View className="px-5">
          {ids.length ? (
            <View className="gap-3">
              {ids.map((id) => (
                <SessionCard key={id} id={id} />
              ))}
            </View>
          ) : (
            <EmptyState icon="timer" title={copy.emptyTitle} body={copy.emptyBody}>
              <Button onPress={openAddSheet}>
                <Text>{strings.home.emptyCta}</Text>
              </Button>
            </EmptyState>
          )}
          <Past />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Past() {
  const theme = useTheme();
  const icons = useAppIcons();
  const past = useValue(() =>
    Object.values(history$.sessions.get())
      .sort((a, b) => b.endedAt - a.endedAt)
      .slice(0, PAST_LIMIT),
  );
  if (!past.length) return null;
  return (
    <View className="mt-8">
      <Text className="mb-3 text-section font-extrabold">{copy.past}</Text>
      <View className="overflow-hidden rounded-card bg-card">
        {past.map((s) => {
          const used = s.logs.reduce((ms, [a, b]) => ms + (b - a), 0);
          return (
            <Pressable
              key={s.sessionId}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/session/[id]", params: { id: s.sessionId } })}
              className="flex-row items-center gap-3 border-b border-border px-4 py-3 active:bg-muted"
            >
              <AppIcon uri={icons[s.packageName]} size={32} label={s.label} />
              <View className="flex-1">
                <Text numberOfLines={1} className="font-semibold">
                  {s.label}
                </Text>
                <Text className="text-caption text-muted-foreground">{copy.endedOn(formatShortDate(s.endedAt))}</Text>
              </View>
              <Text className="text-label font-semibold text-walnut">{formatDuration(used)}</Text>
              <Icon name="chevronRight" size={16} color={theme.mutedForeground} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
