import { useEffect, useMemo } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { batch, type Observable } from "@legendapp/state";
import { useObservable, useValue } from "@legendapp/state/react";
import type { InstalledApp } from "@modules/app-limiter";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { groupApps, type AppSection } from "@/features/limiter/categories";
import { toInstalledApp, useGuardApps } from "@/hooks/useGuardApps";
import type { GuardApp } from "@/types/guard";
import { splitSuggested } from "../logic";

type Selection = {
  selected$: Observable<Record<string, boolean>>;
  labels$: Observable<Record<string, string>>;
};

type AppPickerProps = Selection & {
  /** Called once with the installed apps, e.g. to pre-toggle suggestions. */
  onLoaded?: (apps: GuardApp[]) => void;
};


/** Suggested apps first (APP-03), "See all apps" expands the categorised list (APP-02/04). */
export function AppPicker({ selected$, labels$, onLoaded }: AppPickerProps) {
  const apps = useGuardApps();
  const expanded$ = useObservable(false);
  const expanded = useValue(expanded$);

  useEffect(() => {
    if (apps.data) onLoaded?.(apps.data);
  }, [apps.data, onLoaded]);

  const { suggested, sections } = useMemo(() => {
    const split = splitSuggested((apps.data ?? []).map(toInstalledApp));
    return { suggested: split.suggested, sections: groupApps(split.rest) };
  }, [apps.data]);

  if (apps.isLoading) {
    return (
      <View className="items-center gap-3 py-10">
        <ActivityIndicator />
        <Text className="text-muted-foreground">{strings.onboarding.apps.loading}</Text>
      </View>
    );
  }

  return (
    <View className="gap-5">
      {suggested.length > 0 && (
        <AppGroup title={strings.onboarding.apps.suggested} apps={suggested} selected$={selected$} labels$={labels$} />
      )}

      <Button variant="tertiary" onPress={() => expanded$.set((v) => !v)}>
        <Text>{expanded ? strings.onboarding.apps.hideAll : strings.onboarding.apps.seeAll}</Text>
      </Button>

      {expanded &&
        sections.map((s) => (
          <AppGroup key={s.key} title={s.label} apps={s.apps} section={s} selected$={selected$} labels$={labels$} />
        ))}
    </View>
  );
}

function AppGroup(props: Selection & { title: string; apps: InstalledApp[]; section?: AppSection }) {
  const { selected$, labels$ } = props;
  const allOn = useValue(() => props.apps.every((a) => selected$[a.packageName].get()));

  function toggleAll() {
    batch(() => {
      for (const a of props.apps) {
        selected$[a.packageName].set(!allOn);
        if (!allOn) labels$[a.packageName].set(a.label);
      }
    });
  }

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-label font-bold text-cocoa">{props.title}</Text>
        {props.section && (
          <Pressable onPress={toggleAll} hitSlop={8} accessibilityRole="button">
            <Text className="text-label font-semibold text-primary">{allOn ? strings.onboarding.apps.clear : strings.onboarding.apps.selectAll}</Text>
          </Pressable>
        )}
      </View>
      <View className="gap-2.5">
        {props.apps.map((a) => (
          <AppRow key={a.packageName} app={a} selected$={selected$} labels$={labels$} />
        ))}
      </View>
    </View>
  );
}

function AppRow({ app, selected$, labels$ }: Selection & { app: InstalledApp }) {
  const on = useValue(() => !!selected$[app.packageName].get());
  function toggle() {
    batch(() => {
      selected$[app.packageName].set(!on);
      labels$[app.packageName].set(app.label);
    });
  }
  return (
    <Pressable onPress={toggle} className="flex-row items-center gap-3 rounded-input bg-card px-3.5 py-3">
      <AppIcon uri={app.icon} size={40} label={app.label} />
      <Text className="flex-1 font-semibold">{app.label}</Text>
      <Switch checked={on} onPress={toggle} accessibilityLabel={app.label} />
    </Pressable>
  );
}
