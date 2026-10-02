import { ActivityIndicator, Alert, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/empty-state";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { GlassIconButton } from "@/components/ui/glass-icon-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusPill } from "@/components/ui/status-pill";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { challengeDay, useCompleteGoal, useDeleteGoal, useGoals, useSetFocus } from "@/features/goals/api";
import { useRefreshByUser } from "@/hooks/useRefreshByUser";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Goal } from "@/types/goals";

const copy = strings.goals;

/** Goals and challenges; + (top right) creates one. */
export default function GoalsScreen() {
  const goals = useGoals();
  useRefreshOnFocus(goals.refetch);
  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(goals.refetch);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScreenHeader
        title={copy.title}
        subtitle={copy.subtitle}
        right={<GlassIconButton icon="plus" accessibilityLabel={copy.add} onPress={() => router.push("/goals/new")} />}
      />
      <ScrollView
        contentContainerClassName="gap-3 px-5 pb-10"
        refreshControl={<RefreshControl refreshing={isRefetchingByUser} onRefresh={refetchByUser} />}
      >
        {goals.isLoading ? (
          <ActivityIndicator className="py-10" />
        ) : goals.error ? (
          <View className="items-center gap-3 py-10">
            <Text className="text-muted-foreground">{strings.common.tryAgain}</Text>
            <Button variant="outline" size="sm" onPress={() => goals.refetch()}>
              <Text>{strings.common.retry}</Text>
            </Button>
          </View>
        ) : goals.data?.length ? (
          goals.data.map((g) => <GoalCard key={g.id} goal={g} />)
        ) : (
          <EmptyState icon="target" title={copy.emptyTitle} body={copy.emptyBody}>
            <Button onPress={() => router.push("/goals/new")}>
              <Text>{copy.add}</Text>
            </Button>
          </EmptyState>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const setFocus = useSetFocus();
  const complete = useCompleteGoal();
  const remove = useDeleteGoal();
  const day = challengeDay(goal);
  const done = !!goal.completed_at;
  const busy = setFocus.isPending || complete.isPending || remove.isPending;

  function confirmDelete() {
    Alert.alert(copy.deleteTitle, copy.deleteBody, [
      { text: strings.settings.cancel, style: "cancel" },
      { text: copy.delete, style: "destructive", onPress: () => remove.mutate(goal) },
    ]);
  }

  return (
    <View className={cn("rounded-card p-4", goal.is_active ? "bg-accent" : "bg-card")}>
      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <Text className={cn("text-button font-bold", done && "text-muted-foreground line-through")}>{goal.text}</Text>
          {goal.why ? <Text className="mt-1 text-sm text-walnut">{goal.why}</Text> : null}
        </View>
        {goal.is_active ? (
          <StatusPill tone="counting" label={copy.focus} className="self-start bg-card" />
        ) : done ? (
          <StatusPill tone="success" label={copy.completed} className="self-start" />
        ) : null}
      </View>

      {day && goal.challenge_days ? (
        <View className="mt-4 gap-1.5">
          <Text className="text-caption font-bold text-cocoa">{copy.challenge(day, goal.challenge_days)}</Text>
          <ProgressBar value={day / goal.challenge_days} className="h-1.5" />
        </View>
      ) : (
        <Text className="mt-3 text-caption text-muted-foreground">
          {copy.openEnded} · {formatShortDate(goal.created_at)}
        </Text>
      )}

      {!done && (
        <View className="mt-4 flex-row flex-wrap gap-2">
          {!goal.is_active && (
            <Button size="sm" variant="secondary" disabled={busy} onPress={() => setFocus.mutate(goal)}>
              <Text>{copy.setFocus}</Text>
            </Button>
          )}
          <Button size="sm" variant="outline" disabled={busy} onPress={() => complete.mutate(goal)}>
            <Text>{copy.complete}</Text>
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onPress={confirmDelete}>
            <Text className="text-destructive">{copy.delete}</Text>
          </Button>
        </View>
      )}
      {done && (
        <View className="mt-3 flex-row">
          <Button size="sm" variant="ghost" disabled={busy} onPress={confirmDelete}>
            <Text className="text-destructive">{copy.delete}</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
