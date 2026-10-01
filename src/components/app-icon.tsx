import { Image, type ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";

type AppIconProps = {
  /** data:image/png;base64,... from the AppLimiter module; renders nothing when null. */
  uri: string | null | undefined;
  size: number;
  style?: StyleProp<ImageStyle>;
};

export function AppIcon({ uri, size, style }: AppIconProps) {
  if (!uri) return null;
  return <Image source={{ uri }} style={[{ width: size, height: size }, style]} />;
}
