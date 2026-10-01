import type { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Icon, type IconName } from "./ui/icon";
import { Text } from "./ui/text";

type StatTileProps = {
  icon: IconName;
  label: string;
  value: string;
  /** Replaces the value text, e.g. an app icon with its name. */
  children?: ReactNode;
};

/** One figure in a stats row: icon, value, small label. */
export function StatTile({ icon, label, value, children }: StatTileProps) {
  const theme = useTheme();
  return (
    <View className="flex-1 items-start gap-1.5">
      <Icon name={icon} size={18} color={theme.primary} />
      {children ?? (
        <Text numberOfLines={1} className="text-section font-extrabold">
          {value}
        </Text>
      )}
      <Text numberOfLines={2} className="text-caption text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}
