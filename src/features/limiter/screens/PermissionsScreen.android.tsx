import { useCallback } from "react";
import { AppStateStatus, PermissionsAndroid, Platform, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useObservable, useValue } from "@legendapp/state/react";
import { AppLimiter } from "@modules/app-limiter";
import { useAppState } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { LimiterPermissions } from "@/types/limiter";

export default function PermissionsScreen() {
  const perms$ = useObservable<LimiterPermissions>(AppLimiter.permissions());
  const perms = useValue(perms$);

  // Users grant these in system Settings, so re-check when they come back.
  const onAppState = useCallback(
    (s: AppStateStatus) => {
      if (s === "active") perms$.set(AppLimiter.permissions());
    },
    [perms$],
  );
  useAppState(onAppState);

  const ready = perms.usageAccess && perms.overlay;

  async function turnOn() {
    if (Number(Platform.Version) >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    AppLimiter.startMonitoring();
    router.back();
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pb-10 pt-6">
      <Text className="mb-2 text-2xl font-bold text-foreground">Let RemindU check in</Text>
      <Text className="mb-6 text-base text-muted-foreground">
        Android needs two switches turned on so we can notice when you open a limited app.
      </Text>

      <PermissionRow
        title="Usage access"
        body="Lets RemindU see which app is open. We never see what you do inside it."
        granted={perms.usageAccess}
        onPress={AppLimiter.openUsageAccessSettings}
      />
      <PermissionRow
        title="Display over other apps"
        body="Lets RemindU show your check-in before the app opens."
        granted={perms.overlay}
        onPress={AppLimiter.openOverlaySettings}
      />
      <PermissionRow
        title="Keep running in background"
        body="Optional, but recommended on Xiaomi, Oppo, Vivo and Realme phones, which stop background apps."
        granted={perms.battery}
        onPress={AppLimiter.openBatterySettings}
        optional
      />

      <Button disabled={!ready} onPress={turnOn} className="mt-6">
        <Text>Turn on limits</Text>
      </Button>
    </ScrollView>
  );
}

function PermissionRow(props: {
  title: string;
  body: string;
  granted: boolean;
  optional?: boolean;
  onPress: () => void;
}) {
  return (
    <View className="mb-3 rounded-lg border border-border p-4">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-foreground">
          {props.title}
          {props.optional ? " (optional)" : ""}
        </Text>
        {props.granted ? (
          <Text className="text-sm text-muted-foreground">On</Text>
        ) : (
          <Button variant="secondary" size="sm" onPress={props.onPress}>
            <Text>Open settings</Text>
          </Button>
        )}
      </View>
      <Text className="text-sm text-muted-foreground">{props.body}</Text>
    </View>
  );
}
