import { IconButton } from "./icon-button";
import type { IconName } from "./icon";

export type GlassIconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  /** Shape of the plain button used on Android and older iOS (iOS 26+ glass is always a circle). */
  shape?: "circle" | "tile";
};

/** Header action. Android/web keep the plain button; iOS draws liquid glass (`glass-icon-button.ios.tsx`). */
export function GlassIconButton({ icon, accessibilityLabel, onPress, shape = "tile" }: GlassIconButtonProps) {
  return <IconButton icon={icon} shape={shape} accessibilityLabel={accessibilityLabel} onPress={onPress} />;
}
