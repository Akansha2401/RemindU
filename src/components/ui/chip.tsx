import { Pressable } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  className?: string;
};

/** Segmented pill: espresso when selected, white on cream otherwise. */
export function Chip({ label, selected, onPress, className }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn("items-center rounded-full px-4 py-2.5", selected ? "bg-secondary" : "bg-card", className)}
    >
      <Text className={cn("text-sm font-bold", selected ? "text-secondary-foreground" : "text-foreground")}>
        {label}
      </Text>
    </Pressable>
  );
}
