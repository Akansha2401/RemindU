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
      className="flex-row items-center gap-4 px-4 py-3 active:bg-black/[0.04]"
    >
      <View className={cn("h-12 w-12 items-center justify-center rounded-full border border-black/[0.02] shadow-badge", destructive ? "bg-error-bg" : "bg-card")}>
        <Icon name={icon} size={20} color={tint} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text className={cn("font-medium", destructive && "text-destructive")}>{label}</Text>
        {hint ? <Text className="text-caption text-muted-foreground">{hint}</Text> : null}
      </View>
      {right ?? (onPress && !destructive ? <Icon name="chevronRight" size={16} color={theme.mutedForeground} /> : null)}
    </Pressable>
  );
}

export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="mb-6">
      {title ? <Text className="mb-3 ml-1 text-eyebrow font-bold uppercase text-muted-foreground">{title}</Text> : null}
      <View className="overflow-hidden rounded-card bg-card shadow-card">{children}</View>
    </View>
  );
}
