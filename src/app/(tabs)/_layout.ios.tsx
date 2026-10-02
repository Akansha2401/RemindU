import React from "react";
import { router } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { strings } from "@/constants/strings";
import { useTabsSetup } from "@/hooks/useTabsSetup";
import { openAddSheet } from "@/components/tab-bar";

const TABS = [
  { name: "index", sf: "house", label: strings.tabs.home },
  { name: "sessions", sf: "timer", label: strings.tabs.sessions },
  { name: "goals", sf: "target", label: strings.tabs.goals },
  { name: "profile", sf: "person", label: strings.tabs.profile },
] as const;

// The tab last shown, so the Add button (which isn't a screen) can hand focus back to it.
let lastTab: (typeof TABS)[number]["name"] = "index";

/** iOS: native tab bar (liquid glass on iOS 26+). The Add button sits apart from the tab group; pressing it opens the sheet. */
const TabLayout = () => {
  useTabsSetup();

  return (
    <NativeTabs tintColor="#FF5A5F">
      {TABS.map((t) => (
        <NativeTabs.Trigger
          key={t.name}
          name={t.name}
          listeners={{ focus: () => void (lastTab = t.name) }}
        >
          <NativeTabs.Trigger.Icon sf={t.sf} />
          <NativeTabs.Trigger.Label>{t.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
      <NativeTabs.Trigger
        name="new"
        // The search role is what iOS 26 draws as a separate glass button beside the tab group.
        role="search"
        listeners={{
          tabPress: () => {
            router.navigate(`/${lastTab === "index" ? "" : lastTab}` as never);
            openAddSheet();
          },
        }}
      >
        <NativeTabs.Trigger.Icon sf="plus" />
        <NativeTabs.Trigger.Label>{strings.tabs.add}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabLayout;
