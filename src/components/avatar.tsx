import { View } from "react-native";
import { Image } from "expo-image";
import { Text } from "./ui/text";

/** Profile photo, or the first letter of the name on a peach circle. */
export function Avatar({ uri, name, size = 88 }: { uri: string | null | undefined; name: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityLabel={name} />;
  }
  return (
    <View className="items-center justify-center rounded-full bg-accent" style={{ width: size, height: size }}>
      <Text className="font-extrabold text-accent-foreground" style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}>
        {name.charAt(0).toUpperCase() || "?"}
      </Text>
    </View>
  );
}
