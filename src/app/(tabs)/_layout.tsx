import React from "react";
import { Tabs } from "expo-router";
import { useLimitSync } from "@/features/limiter/hooks";

const TabLayout = () => {
  useLimitSync();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
    </Tabs>
  );
};

export default TabLayout;
