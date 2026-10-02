import React from "react";
import { Tabs } from "expo-router";
import { openAddSheet, TabBar } from "@/components/tab-bar";
import { strings } from "@/constants/strings";
import { useTabsSetup } from "@/hooks/useTabsSetup";

const TABS = {
  index: { icon: "home", label: strings.tabs.home },
  sessions: { icon: "timer", label: strings.tabs.sessions },
  goals: { icon: "target", label: strings.tabs.goals },
  profile: { icon: "user", label: strings.tabs.profile },
} as const;

/** Android (and web): floating pill tab bar. iOS uses `_layout.ios.tsx`. */
const TabLayout = () => {
  useTabsSetup();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} tabs={TABS} action={{ label: strings.tabs.add, onPress: openAddSheet }} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="sessions" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
};

export default TabLayout;
