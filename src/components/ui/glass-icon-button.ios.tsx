import { Pressable } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Icon } from "./icon";
import { IconButton } from "./icon-button";
import type { GlassIconButtonProps } from "./glass-icon-button";

/** iOS 26+: a native liquid-glass circle. Older iOS falls back to the plain tile button. */
export function GlassIconButton({ icon, accessibilityLabel, onPress, shape = "tile" }: GlassIconButtonProps) {
  if (!isLiquidGlassAvailable()) {
    return <IconButton icon={icon} shape={shape} accessibilityLabel={accessibilityLabel} onPress={onPress} />;
  }
  return (
    <GlassView isInteractive glassEffectStyle="regular" style={{ width: 40, height: 40, borderRadius: 20 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        hitSlop={6}
        className="h-10 w-10 items-center justify-center"
      >
        <Icon name={icon} size={18} />
      </Pressable>
    </GlassView>
  );
}
