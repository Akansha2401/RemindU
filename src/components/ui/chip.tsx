import { Pressable, Text } from "react-native";
import { cn } from "@/lib/utils";

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  className?: string;
};

/** Selectable pill used for quick picks (intentions, minute options...). */
export function Chip({ label, selected, onPress, className }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-full border px-3 py-1.5",
        selected ? "border-primary bg-primary" : "border-border",
        className,
      )}
    >
      <Text className={selected ? "text-primary-foreground" : "text-foreground"}>{label}</Text>
    </Pressable>
  );
}
