import { ActivityIndicator, ScrollView, View } from "react-native";
import { useObservable, useValue } from "@legendapp/state/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/avatar";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { useProfile, useUpdateName } from "@/features/profile/api";
import { formatShortDate } from "@/lib/format";
import type { Profile } from "@/types/goals";

const copy = strings.settings;

export default function AccountScreen() {
  const profile = useProfile();
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title={copy.accountTitle} back />
      {profile.data ? (
        <AccountForm profile={profile.data} />
      ) : profile.error ? (
        <Text className="px-5 py-10 text-center text-muted-foreground">{strings.common.tryAgain}</Text>
      ) : (
        <ActivityIndicator className="py-10" />
      )}
    </SafeAreaView>
  );
}

function AccountForm({ profile }: { profile: Profile }) {
  const update = useUpdateName();
  const name$ = useObservable(profile.name);
  const name = useValue(name$);
  const changed = name.trim() !== profile.name && name.trim().length > 0;

  const rows = [
    [copy.emailLabel, profile.email ?? "—"],
    [copy.signedInWith, copy.providers[profile.provider ?? ""] ?? profile.provider ?? "—"],
    [copy.memberSince, formatShortDate(profile.memberSince)],
  ];

  return (
    <ScrollView contentContainerClassName="px-5 pb-10 pt-2" keyboardShouldPersistTaps="handled">
      <View className="mb-6 items-center">
        <Avatar uri={profile.avatarUrl} name={name || profile.name} size={72} />
      </View>
      <Text className="mb-2 text-label font-bold text-cocoa">{copy.nameLabel}</Text>
      <Input value={name} onChangeText={(t) => name$.set(t)} maxLength={60} accessibilityLabel={copy.nameLabel} />
      <Button
        className="mt-3"
        size="sm"
        disabled={!changed || update.isPending}
        onPress={() => update.mutate(name)}
      >
        <Text>{update.isSuccess && !changed ? copy.saved : copy.save}</Text>
      </Button>
      {update.error ? <Text className="mt-2 text-center text-destructive">{strings.common.tryAgain}</Text> : null}

      <View className="mt-8 rounded-card bg-card shadow-card px-4 py-1">
        {rows.map(([k, v], i) => (
          <View key={k} className={i ? "flex-row justify-between gap-4 border-t border-border py-3" : "flex-row justify-between gap-4 py-3"}>
            <Text className="text-walnut">{k}</Text>
            <Text numberOfLines={1} className="flex-1 text-right font-semibold">
              {v}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
