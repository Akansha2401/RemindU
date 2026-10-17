import { Pressable, View } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  className?: string;
  /** Small tag after the label, e.g. "PRO" on a locked option. */
  badge?: string;
};

/** Segmented pill: espresso when selected, white on cream otherwise. */
export function Chip({ label, selected, onPress, className, badge }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        "flex-row items-center justify-center gap-1.5 rounded-full px-4 py-2.5",
        selected ? "bg-secondary" : "bg-card",
        className,
      )}
    >
      <Text className={cn("text-sm font-bold", selected ? "text-secondary-foreground" : "text-foreground")}>
        {label}
      </Text>
      {badge ? (
        <View className="rounded-full bg-accent px-1.5 py-0.5">
          <Text className="text-[10px] font-bold text-accent-foreground">{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
