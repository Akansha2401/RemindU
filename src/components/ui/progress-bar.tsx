import { View } from "react-native";
import { cn } from "@/lib/utils";

type ProgressBarProps = {
  /** 0 to 1 */
  value: number;
  accessibilityLabel?: string;
  className?: string;
};

/** Thin progress bar for multi-step flows and timers. */
export function ProgressBar({ value, accessibilityLabel, className }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
    >
      <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </View>
  );
}
