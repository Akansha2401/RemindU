import { View, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Text } from "./ui/text";

type AppIconProps = {
  /** data:image/png;base64,... from the native module. */
  uri: string | null | undefined;
  size: number;
  /** When there's no icon, shows the app's first letter on a tile (as in the prototype). Otherwise renders nothing. */
  label?: string;
  /** Spacing only, since it applies to both the image and the letter tile. */
  style?: Pick<ViewStyle, "margin" | "marginTop" | "marginBottom" | "marginLeft" | "marginRight">;
};

export function AppIcon({ uri, size, label, style }: AppIconProps) {
  if (uri) return <Image source={{ uri }} style={[{ width: size, height: size }, style]} />;
  if (!label) return null;
  return (
    <View
      className="items-center justify-center rounded-tile bg-background"
      style={[{ width: size, height: size }, style]}
    >
      <Text className="font-extrabold text-walnut">{label.charAt(0).toUpperCase()}</Text>
    </View>
  );
}
