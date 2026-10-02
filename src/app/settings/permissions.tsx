import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassIconButton } from "@/components/ui/glass-icon-button";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { PermissionList } from "@/features/onboarding/components/PermissionList";

/** Reached from the Setup banner (ONB-05) when a required permission is missing. */
export default function PermissionsSettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-5 pb-2 pt-2">
        <GlassIconButton shape="circle" icon="back" accessibilityLabel={strings.common.back} onPress={() => router.back()} />
        <Text accessibilityRole="header" className="text-section font-extrabold">
          {strings.settings.permissions}
        </Text>
      </View>
      <ScrollView contentContainerClassName="px-5 pb-8 pt-3">
        <Text className="mb-5 text-walnut">{strings.onboarding.permissions.subtitle}</Text>
        <PermissionList />
      </ScrollView>
    </SafeAreaView>
  );
}
