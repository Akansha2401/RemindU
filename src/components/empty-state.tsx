import type { ReactNode } from "react";
import { View } from "react-native";
import { Icon, type IconName } from "./ui/icon";
import { Text } from "./ui/text";
import { useTheme } from "@/hooks/useTheme";

export function EmptyState({ icon, title, body, children }: { icon: IconName; title: string; body: string; children?: ReactNode }) {
  const theme = useTheme();
  return (
    <View className="items-center rounded-card bg-card px-6 py-8">
      <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-accent">
        <Icon name={icon} size={22} color={theme.accentForeground} />
      </View>
      <Text className="text-button font-bold">{title}</Text>
      <Text className="mt-1 text-center text-sm text-walnut">{body}</Text>
      {children ? <View className="mt-4 self-stretch">{children}</View> : null}
    </View>
  );
}
