import { Pressable, View } from "react-native";
import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** 44×26 switch: terracotta track when on (RemindU Design System v1). */
export function Switch({ checked, onPress, disabled, accessibilityLabel }: SwitchProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      className={cn("h-[26px] w-11 rounded-full", checked ? "bg-primary" : "bg-switch-off", disabled && "opacity-50")}
    >
      <View
        className={cn(
          "absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm shadow-black/20",
          checked ? "left-[21px]" : "left-[3px]",
        )}
      />
    </Pressable>
  );
}
