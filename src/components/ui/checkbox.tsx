import { Pressable, Text } from "react-native";
import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked: boolean;
  /** Shows a dash, e.g. when only some items in a group are picked. */
  partial?: boolean;
  onPress: () => void;
};

export function Checkbox({ checked, partial, onPress }: CheckboxProps) {
  const on = checked || partial;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className={cn(
        "h-6 w-6 items-center justify-center rounded border-2",
        on ? "border-primary bg-primary" : "border-border",
      )}
    >
      {on && <Text className="text-xs font-bold text-primary-foreground">{checked ? "✓" : "–"}</Text>}
    </Pressable>
  );
}
