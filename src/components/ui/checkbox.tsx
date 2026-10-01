import { Pressable } from "react-native";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { Text } from "./text";

type CheckboxProps = {
  checked: boolean;
  /** Shows a dash, e.g. when only some items in a group are picked. */
  partial?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function Checkbox({ checked, partial, onPress, accessibilityLabel }: CheckboxProps) {
  const on = checked || partial;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: partial && !checked ? "mixed" : checked }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      className={cn(
        "h-6 w-6 items-center justify-center rounded-md border-2",
        on ? "border-primary bg-primary" : "border-switch-off",
      )}
    >
      {checked ? (
        <Icon name="check" size={14} color="#FFFFFF" />
      ) : partial ? (
        <Text className="text-xs font-bold text-primary-foreground">–</Text>
      ) : null}
    </Pressable>
  );
}
