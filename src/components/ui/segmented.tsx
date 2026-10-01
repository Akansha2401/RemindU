import { View } from "react-native";
import { cn } from "@/lib/utils";
import { Chip } from "./chip";

type SegmentedProps<T extends string> = {
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/** Row of chips on a muted track, one selected (tabs for charts, theme picker). */
export function Segmented<T extends string>({ options, labels, value, onChange, className }: SegmentedProps<T>) {
  return (
    <View accessibilityRole="radiogroup" className={cn("flex-row gap-1 rounded-full bg-muted p-1", className)}>
      {options.map((o) => (
        <Chip key={o} className="flex-1 px-2 py-2" label={labels[o]} selected={value === o} onPress={() => onChange(o)} />
      ))}
    </View>
  );
}
