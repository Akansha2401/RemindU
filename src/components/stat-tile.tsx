import type { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Icon, type IconName } from "./ui/icon";
import { Text } from "./ui/text";

type StatTileProps = {
  icon: IconName;
  label: string;
  value: string;
  /** Replaces the icon beside the value, e.g. the most-used app's icon. */
  leading?: ReactNode;
};

/** One figure in a stats row: icon beside the value, small label below. */
export function StatTile({ icon, label, value, leading }: StatTileProps) {
  const theme = useTheme();
  return (
    <View className="flex-1 items-start gap-1.5">
      <View className="flex-row items-center gap-2">
        {leading ?? <Icon name={icon} size={22} color={theme.foreground} />}
        <Text numberOfLines={1} className="shrink text-section font-extrabold">
          {value}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        className="text-label font-bold uppercase text-muted-foreground"
      >
        {label}
      </Text>
    </View>
  );
}
