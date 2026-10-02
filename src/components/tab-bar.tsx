import { Pressable, View } from "react-native";
import type { BottomTabBarProps } from "expo-router/tabs";
import { router } from "expo-router";
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

/** Floating pill with four labelled line-icon tabs and a coral + button in the middle (DESIGN.md). */
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
    <View className="bg-background px-5 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}>
      <View className="h-16 flex-row items-center self-center rounded-full bg-card px-3 shadow-nav" style={{ width: "100%", maxWidth: 400 }}>
        {routes.slice(0, half).map(renderTab)}
        <View className="flex-1 items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            hitSlop={6}
            className="h-12 w-12 items-center justify-center rounded-full bg-primary shadow-cta active:scale-[0.98] active:bg-primary-hover"
          >
            <Icon name="plus" size={24} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </View>
        {routes.slice(half).map(renderTab)}
      </View>
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
      <Icon
        name={meta.icon}
        size={22}
        strokeWidth={focused ? 2 : 1.5}
        color={focused ? theme.primary : theme.switchOff}
      />
      <Text
        numberOfLines={1}
        className={cn("text-caption", focused ? "font-bold text-primary" : "font-medium text-muted-foreground")}
      >
        {meta.label}
      </Text>
    </Pressable>
  );
}

/** For screens that navigate to the add sheet without the tab bar. */
export const openAddSheet = () => router.push("/add");
