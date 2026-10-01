import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { AppPicker } from "@/features/onboarding/components/AppPicker";
import { setup$ } from "@/store/setup.store";

/** Edit distracting apps from Setup (SET-04). */
export default function EditAppsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-5 pb-2 pt-2">
        <IconButton icon="back" accessibilityLabel={strings.common.back} onPress={() => router.back()} />
        <Text accessibilityRole="header" className="text-section font-extrabold">
          {strings.setup.editAppsTitle}
        </Text>
      </View>
      <ScrollView contentContainerClassName="px-5 pb-6 pt-3">
        <Text className="mb-5 text-walnut">{strings.setup.appsHelper}</Text>
        <AppPicker selected$={setup$.apps} labels$={setup$.appLabels} />
      </ScrollView>
      <View className="px-5 pb-4 pt-3">
        <Button onPress={() => router.back()}>
          <Text>{strings.setup.done}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
