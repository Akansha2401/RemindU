import { Pressable, View } from "react-native";
import { router } from "expo-router";
import type { BottomTabBarProps } from "expo-router/tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./ui/icon";
import { Text } from "./ui/text";

type TabMeta = { icon: IconName; label: string };

type TabBarProps = BottomTabBarProps & {
  tabs: Record<string, TabMeta>;
  /** The raised centre button (not a tab): opens a sheet instead of switching screens. */
  action: { label: string; onPress: () => void };
};

/** Four tabs with a terracotta + button in the middle. */
export function TabBar({ state, navigation, tabs, action }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => tabs[r.name]);
  const half = Math.ceil(routes.length / 2);

  const renderTab = (route: (typeof routes)[number]) => {
    const index = state.routes.indexOf(route);
    return (
      <TabButton
        key={route.key}
        meta={tabs[route.name]}
        focused={state.index === index}
        onPress={() => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (state.index !== index && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        }}
      />
    );
  };

  return (
    <View
      className="flex-row items-center border-t border-border bg-card px-2 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      {routes.slice(0, half).map(renderTab)}
      <View className="flex-1 items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          hitSlop={6}
          className="-mt-7 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-md shadow-black/20 active:bg-primary-hover"
        >
          <Icon name="plus" size={26} color="#FFFFFF" />
        </Pressable>
      </View>
      {routes.slice(half).map(renderTab)}
    </View>
  );
}

function TabButton({ meta, focused, onPress }: { meta: TabMeta; focused: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={meta.label}
      onPress={onPress}
      className="flex-1 items-center gap-1 py-1"
    >
      <Icon name={meta.icon} size={22} color={focused ? theme.primary : theme.mutedForeground} />
      <Text className={cn("text-[11px] font-semibold", focused ? "text-primary" : "text-muted-foreground")}>
        {meta.label}
      </Text>
    </Pressable>
  );
}

/** For screens that navigate to the add sheet without the tab bar. */
export const openAddSheet = () => router.push("/add");
