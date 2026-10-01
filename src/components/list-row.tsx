import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./ui/icon";
import { Text } from "./ui/text";

type ListRowProps = {
  icon: IconName;
  label: string;
  hint?: string;
  /** Shown on the right instead of the chevron (a switch, a value). */
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
};

/** Settings-style row; group several inside a `ListGroup`. */
export function ListRow({ icon, label, hint, right, onPress, destructive }: ListRowProps) {
  const theme = useTheme();
  const tint = destructive ? theme.destructive : theme.foreground;
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-muted"
    >
      <View className={cn("h-9 w-9 items-center justify-center rounded-tile", destructive ? "bg-error-bg" : "bg-background")}>
        <Icon name={icon} size={18} color={tint} />
      </View>
      <View className="flex-1">
        <Text className={cn("font-semibold", destructive && "text-destructive")}>{label}</Text>
        {hint ? <Text className="text-caption text-muted-foreground">{hint}</Text> : null}
      </View>
      {right ?? (onPress && !destructive ? <Icon name="chevronRight" size={16} color={theme.mutedForeground} /> : null)}
    </Pressable>
  );
}

export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="mb-6">
      {title ? <Text className="mb-2 ml-1 text-label font-bold text-cocoa">{title}</Text> : null}
      <View className="overflow-hidden rounded-card bg-card">{children}</View>
    </View>
  );
}
