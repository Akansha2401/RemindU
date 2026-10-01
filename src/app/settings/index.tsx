import { Alert, Linking, ScrollView, View } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListGroup, ListRow } from "@/components/list-row";
import { ScreenHeader } from "@/components/screen-header";
import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { Text } from "@/components/ui/text";
import { APP_LINKS } from "@/config/app";
import { strings } from "@/constants/strings";
import { deleteAccount, signOut } from "@/features/profile/api";
import { useTheme } from "@/hooks/useTheme";
import { prefs$, prefsActions } from "@/store/prefs.store";
import type { ThemePreference } from "@/types/stats";

const copy = strings.settings;
const THEMES: ThemePreference[] = ["system", "light", "dark"];

function confirmSignOut() {
  Alert.alert(copy.signOutTitle, copy.signOutBody, [
    { text: copy.cancel, style: "cancel" },
    {
      text: copy.signOut,
      style: "destructive",
      onPress: () => signOut().catch(() => Alert.alert(strings.common.tryAgain)),
    },
  ]);
}

function confirmDelete() {
  Alert.alert(copy.deleteTitle, copy.deleteBody, [
    { text: copy.cancel, style: "cancel" },
    {
      text: copy.deleteConfirm,
      style: "destructive",
      onPress: () => deleteAccount().catch(() => Alert.alert(strings.common.tryAgain)),
    },
  ]);
}

function openPrivacy() {
  if (APP_LINKS.privacyPolicy) Linking.openURL(APP_LINKS.privacyPolicy);
  else Alert.alert(copy.privacy, copy.notAvailable);
}

/** Settings, opened from the gear on the Profile tab. */
export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title={copy.title} back />
      <ScrollView contentContainerClassName="px-5 pb-10 pt-2">
        <ListGroup title={copy.sections.general}>
          <ListRow icon="bell" label={copy.notifications} hint={copy.notificationsHelp} onPress={() => Linking.openSettings()} />
          <ListRow icon="eye" label={copy.permissions} onPress={() => router.push("/settings/permissions")} />
          <ListRow icon="user" label={copy.account} onPress={() => router.push("/settings/account")} />
          <ListRow icon="sliders" label={copy.limits} onPress={() => router.push("/limits/new")} />
        </ListGroup>

        <Appearance />

        <ListGroup title={copy.sections.support}>
          <ListRow icon="help" label={copy.help} onPress={() => router.push("/settings/help")} />
          <ListRow icon="shield" label={copy.privacy} onPress={openPrivacy} />
        </ListGroup>

        <ListGroup title={copy.sections.account}>
          <ListRow icon="logout" label={copy.signOut} onPress={confirmSignOut} />
          <ListRow icon="trash" label={copy.deleteAccount} destructive onPress={confirmDelete} />
        </ListGroup>

        <Text className="text-center text-caption text-muted-foreground">
          {copy.version(Constants.expoConfig?.version ?? "")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Appearance() {
  const theme = useValue(prefs$.theme);
  const colors = useTheme();
  return (
    <ListGroup title={copy.sections.appearance}>
      <View className="gap-3 px-4 py-3.5">
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-tile bg-background">
            <Icon name="moon" size={18} color={colors.foreground} />
          </View>
          <Text className="font-semibold">{copy.appearance}</Text>
        </View>
        <Segmented options={THEMES} labels={copy.themes} value={theme} onChange={prefsActions.setTheme} />
      </View>
    </ListGroup>
  );
}
