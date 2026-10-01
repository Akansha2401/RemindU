import { View } from "react-native";

type ProgressBarProps = {
  /** 0 to 1 */
  value: number;
  accessibilityLabel?: string;
};

/** Thin progress bar for multi-step flows. */
export function ProgressBar({ value, accessibilityLabel }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      className="h-1 overflow-hidden rounded-full bg-muted"
    >
      <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </View>
  );
}
