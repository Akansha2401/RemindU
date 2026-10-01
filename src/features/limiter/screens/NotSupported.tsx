import { View } from "react-native";
import { Text } from "@/components/ui/text";

/** Shown on iOS/web until the Screen Time version exists. */
export function NotSupported() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Text className="text-center text-base text-muted-foreground">
        App limits are available on Android for now.
      </Text>
    </View>
  );
}
