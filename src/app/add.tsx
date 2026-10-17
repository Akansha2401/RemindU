import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, SectionList, View } from "react-native";
import { router } from "expo-router";
import type { Observable } from "@legendapp/state";
import { useObservable, useValue } from "@legendapp/state/react";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { PermissionBanner } from "@/components/permission-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GlassIconButton } from "@/components/ui/glass-icon-button";
import { SearchInput } from "@/components/ui/search-input";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { groupApps } from "@/features/limiter/categories";
import { FrequencyField, isPreset, LengthField, type TimerForm } from "@/features/sessions/fields";
import { pushAppRules } from "@/features/sessions/sync";
import { toInstalledApp, useGuardApps } from "@/hooks/useGuardApps";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import { sessionActions, sessions$ } from "@/store/session.store";
import { setup$ } from "@/store/setup.store";
import type { GuardApp } from "@/types/guard";

const copy = strings.add;

type AddForm = TimerForm & {
  step: "pick" | "setup";
  query: string;
  /** packageName -> label, for the picked apps */
  selected: Record<string, string | undefined>;
  saving: boolean;
};

/** Bottom sheet from the tab bar's + button: pick apps, then length and check-in frequency. */
export default function AddSheet() {
  const insets = useSafeAreaInsets();
  const last = setup$.peek();
  const form$ = useObservable<AddForm>({
    step: "pick",
    query: "",
    selected: {},
    lengthMin: last.lengthMin,
    custom: !isPreset(last.lengthMin),
    frequency: last.frequency,
    everyHours: last.everyHours,
    saving: false,
  });
  const step = useValue(form$.step);

  return (
    <View className="flex-1 justify-end">
      <Pressable accessibilityLabel={strings.common.back} onPress={() => router.back()} className="absolute inset-0 bg-black/40" />
      <Animated.View
        entering={SlideInDown.duration(260)}
        className="h-[90%] rounded-t-[28px] bg-background"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="items-center pt-2.5">
          <View className="h-1 w-10 rounded-full bg-switch-off" />
        </View>
        <View className="flex-row items-center gap-3 px-5 pb-3 pt-3">
          {step === "setup" && (
            <GlassIconButton shape="circle" icon="back" accessibilityLabel={copy.back} onPress={() => form$.step.set("pick")} />
          )}
          <Text accessibilityRole="header" className="flex-1 text-section font-extrabold">
            {step === "pick" ? copy.title : copy.setupTitle}
          </Text>
          <GlassIconButton shape="circle" icon="close" accessibilityLabel={strings.common.back} onPress={() => router.back()} />
        </View>
        {step === "pick" ? <PickApps form$={form$} /> : <Setup form$={form$} />}
      </Animated.View>
    </View>
  );
}

type FormProps = { form$: Observable<AddForm> };

// ---------- step 1: apps ----------

function PickApps({ form$ }: FormProps) {
  const apps = useGuardApps();
  const query = useValue(form$.query);
  const count = useValue(() => Object.values(form$.selected.get()).filter(Boolean).length);

  const sections = useMemo(() => {
    const all = apps.data ?? [];
    const q = query.trim().toLowerCase();
    if (q) {
      const hits = all.filter((a) => a.label.toLowerCase().includes(q));
      return hits.length ? [{ key: "results", title: "", data: hits }] : [];
    }
    const byPkg = new Map(all.map((a) => [a.packageName, a]));
    return groupApps(all.map(toInstalledApp)).map((s) => ({
      key: s.key,
      title: s.label,
      data: s.apps.map((a) => byPkg.get(a.packageName)!),
    }));
  }, [apps.data, query]);

  return (
    <View className="flex-1">
      <View className="px-5 pb-2">
        <SearchInput
          value={query}
          onChangeText={(t) => form$.query.set(t)}
          placeholder={copy.searchPlaceholder}
          accessibilityLabel={copy.searchPlaceholder}
        />
      </View>
      {apps.isLoading ? (
        <View className="items-center gap-3 py-10">
          <ActivityIndicator />
          <Text className="text-muted-foreground">{copy.loading}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(a) => a.packageName}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          contentContainerClassName="px-5 pb-4"
          renderSectionHeader={({ section }) =>
            section.title ? <Text className="mb-2 mt-4 text-label font-bold text-cocoa">{section.title}</Text> : null
          }
          renderItem={({ item }) => <AppRow app={item} form$={form$} />}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListEmptyComponent={<Text className="py-10 text-center text-muted-foreground">{copy.noResults(query)}</Text>}
        />
      )}
      <View className="px-5 pt-2">
        <Button disabled={count === 0} onPress={() => form$.step.set("setup")}>
          <Text>{copy.next(count)}</Text>
        </Button>
      </View>
    </View>
  );
}

function AppRow({ app, form$ }: FormProps & { app: GuardApp }) {
  const on = useValue(() => !!form$.selected[app.packageName].get());
  const running = useValue(() => Object.values(sessions$.get() ?? {}).some((s) => s.packageName === app.packageName));
  const toggle = () => form$.selected[app.packageName].set(on ? undefined : app.label);
  return (
    <Pressable onPress={toggle} className="flex-row items-center gap-3 rounded-input bg-card px-3.5 py-3">
      <AppIcon uri={app.iconBase64} size={40} label={app.label} />
      <View className="flex-1">
        <Text numberOfLines={1} className="font-semibold">
          {app.label}
        </Text>
        {running ? <Text className="text-caption text-primary">{copy.running}</Text> : null}
      </View>
      <Checkbox checked={on} onPress={toggle} accessibilityLabel={app.label} />
    </Pressable>
  );
}

// ---------- step 2: length and frequency ----------

function Setup({ form$ }: FormProps) {
  usePermissionStatus();
  const count = useValue(() => Object.values(form$.selected.get()).filter(Boolean).length);
  const lengthMin = useValue(form$.lengthMin);
  const saving = useValue(form$.saving);

  async function done() {
    const f = form$.peek();
    const apps = Object.entries(f.selected)
      .filter((e): e is [string, string] => !!e[1])
      .map(([packageName, label]) => ({ packageName, label }));
    form$.saving.set(true);
    try {
      await sessionActions.add({ apps, budgetSec: f.lengthMin * 60, frequency: f.frequency, everyHours: f.everyHours });
      pushAppRules(apps).catch((e) => console.warn("app rules sync failed", e));
      router.back();
    } catch (e) {
      console.warn("could not add sessions", e);
      form$.saving.set(false);
    }
  }

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="px-5 pb-4">
        <Text className="mb-5 text-walnut">{copy.setupSubtitle(count)}</Text>
        <PermissionBanner />
        <LengthField form$={form$} />
        <FrequencyField form$={form$} />
      </ScrollView>
      <View className="px-5 pt-2">
        <Button disabled={saving || lengthMin < 1} onPress={done}>
          <Text>{saving ? copy.adding : copy.done}</Text>
        </Button>
      </View>
    </View>
  );
}
