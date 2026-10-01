import React, { useEffect } from "react";
import { router, Tabs } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { openAddSheet, TabBar } from "@/components/tab-bar";
import { FLAGS } from "@/config/flags";
import { strings } from "@/constants/strings";
import { useLimitSync } from "@/features/limiter/hooks";
import { flushPendingOnboarding } from "@/features/onboarding/sync";
import { authStore$ } from "@/store/auth.store";
import { onboarding$ } from "@/store/onboarding.store";

const TABS = {
  index: { icon: "home", label: strings.tabs.home },
  sessions: { icon: "timer", label: strings.tabs.sessions },
  goals: { icon: "target", label: strings.tabs.goals },
  profile: { icon: "user", label: strings.tabs.profile },
} as const;

const TabLayout = () => {
  useLimitSync();
  const userId = useValue(authStore$.userId);

  // Retry pushing onboarding answers if sign-in happened offline.
  useEffect(() => {
    if (userId) flushPendingOnboarding(userId).catch((e) => console.warn("onboarding sync retry failed", e));
  }, [userId]);

  // Screen 8 (trial) is behind a flag and shown once, after sign-in.
  useEffect(() => {
    if (FLAGS.trialScreen && !onboarding$.trialSeen.peek()) router.push("/trial");
  }, []);

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
