import { Alert, Linking, Pressable, ScrollView, View } from "react-native";
import { useObservable, useValue } from "@legendapp/state/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { APP_LINKS } from "@/config/app";
import { strings } from "@/constants/strings";
import { useTheme } from "@/hooks/useTheme";

const copy = strings.settings;

function contact() {
  if (APP_LINKS.supportEmail) Linking.openURL(`mailto:${APP_LINKS.supportEmail}`);
  else Alert.alert(copy.contact, copy.notAvailable);
}

export default function HelpScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title={copy.helpTitle} back />
      <ScrollView contentContainerClassName="gap-2.5 px-5 pb-10 pt-2">
        {copy.faq.map((item) => (
          <Question key={item.q} q={item.q} a={item.a} />
        ))}
        <Button className="mt-4" variant="outline" onPress={contact}>
          <Text>{copy.contact}</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function Question({ q, a }: { q: string; a: string }) {
  const theme = useTheme();
  const open$ = useObservable(false);
  const open = useValue(open$);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={() => open$.set((v) => !v)}
      className="rounded-input bg-card px-4 py-3.5"
    >
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 font-semibold">{q}</Text>
        <Icon name={open ? "chevronDown" : "chevronRight"} size={16} color={theme.mutedForeground} />
      </View>
      {open ? <Text className="mt-2 text-sm text-walnut">{a}</Text> : null}
    </Pressable>
  );
}
