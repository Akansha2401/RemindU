import type { ReactNode } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { strings } from "@/constants/strings";
import { GlassIconButton } from "./ui/glass-icon-button";
import { Text } from "./ui/text";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Shows a back button (pushed screens). */
  back?: boolean;
  /** Top-right action, e.g. a GlassIconButton. */
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, back, right }: ScreenHeaderProps) {
  return (
    <View className="px-6 pb-4 pt-2">
      <View className="flex-row items-center gap-3">
        {back && <GlassIconButton shape="circle" icon="back" accessibilityLabel={strings.common.back} onPress={() => router.back()} />}
        <Text accessibilityRole="header" className={back ? "flex-1 text-section font-extrabold" : "flex-1 text-title font-medium"}>
          {title}
        </Text>
        {right}
      </View>
      {subtitle ? <Text className="mt-1 text-walnut">{subtitle}</Text> : null}
    </View>
  );
}
