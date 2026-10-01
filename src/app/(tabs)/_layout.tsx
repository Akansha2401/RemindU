import React, { useEffect } from "react";
import { router, Tabs } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { FLAGS } from "@/config/flags";
import { useLimitSync } from "@/features/limiter/hooks";
import { flushPendingOnboarding } from "@/features/onboarding/sync";
import { authStore$ } from "@/store/auth.store";
import { onboarding$ } from "@/store/onboarding.store";

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
      screenOptions={{
        headerShown: false,
        // Single tab until History and Progress exist.
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" />
    </Tabs>
  );
};

export default TabLayout;
