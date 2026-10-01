import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { batch, type Observable } from "@legendapp/state";
import { useObservable, useValue } from "@legendapp/state/react";
import { AppLimiter, type InstalledApp } from "@modules/app-limiter";
import { AppIcon } from "@/components/app-icon";
import { BottomActionBar } from "@/components/bottom-action-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import type { NewLimitForm } from "@/types/limiter";
import { groupApps, type AppSection } from "../categories";
import { createLimit } from "../api";
import { limiterKeys, useCategoryOverrides, useInstalledApps } from "../hooks";

const MINUTE_OPTIONS = [15, 30, 45, 60, 90, 120];

type Form$ = Observable<NewLimitForm>;

export default function NewLimitScreen() {
  const apps = useInstalledApps();
  const overrides = useCategoryOverrides();
  const sections = useMemo(
    () => groupApps(apps.data ?? [], overrides.data ?? {}),
    [apps.data, overrides.data],
  );

  const form$ = useObservable<NewLimitForm>({
    step: "pick",
    open: null,
    pkgs: {},
    wholeCats: {},
    name: "",
    sessions: 3,
    minutes: 60,
  });
  // The screen itself only re-renders when the step changes; every row,
  // checkbox and input below subscribes to its own slice of form$.
  const step = useValue(form$.step);

  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: createLimit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: limiterKeys.limits });
      const p = AppLimiter.permissions();
      if (p.usageAccess && p.overlay) {
        AppLimiter.startMonitoring();
        router.back();
      } else {
        router.replace("/limits/permissions");
      }
    },
  });

  function onSave() {
    const form = form$.peek();
    const wholeCats = new Set(selectedKeys(form.wholeCats));
    // Apps covered by a whole category are stored as the category, the rest one by one
    const inWhole = new Set(
      sections.filter((s) => wholeCats.has(s.key)).flatMap((s) => s.apps.map((a) => a.packageName)),
    );
    save.mutate({
      name: form.name.trim() || defaultName(form, sections, apps.data ?? []),
      categories: [...wholeCats],
      packages: selectedKeys(form.pkgs).filter((p) => !inWhole.has(p)),
      sessions_per_day: form.sessions,
      session_minutes: form.minutes,
    });
  }

  if (apps.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  // ---------- step 1: pick apps ----------
  if (step === "pick") {
    return (
      <View className="flex-1 bg-background">
        <ScrollView contentContainerClassName="px-4 pb-32 pt-4">
          <Text className="mb-4 text-2xl font-bold text-foreground">Which apps pull you in?</Text>
          {sections.map((section) => (
            <SectionCard key={section.key} section={section} form$={form$} />
          ))}
        </ScrollView>
        <ContinueButton form$={form$} />
      </View>
    );
  }

  // ---------- step 2: confirm apps + set sessions ----------
  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4 pb-32 pt-4">
        <Pressable onPress={() => form$.step.set("pick")}>
          <Text className="mb-4 text-sm text-muted-foreground">‹ Change apps</Text>
        </Pressable>

        {/* This list doubles as the "is this the right app?" confirmation */}
        <SelectedApps form$={form$} apps={apps.data ?? []} />

        <Text className="mb-2 text-sm font-medium text-foreground">Name</Text>
        <NameInput form$={form$} sections={sections} apps={apps.data ?? []} />

        <Text className="mb-2 text-sm font-medium text-foreground">Sessions per day</Text>
        <SessionsStepper sessions$={form$.sessions} />

        <Text className="mb-2 text-sm font-medium text-foreground">Minutes per session</Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {MINUTE_OPTIONS.map((m) => (
            <MinuteChip key={m} value={m} minutes$={form$.minutes} />
          ))}
        </View>

        <Summary form$={form$} />
        {save.error && <Text className="mt-3 text-destructive">{save.error.message}</Text>}
      </ScrollView>
      <BottomActionBar>
        <Button disabled={save.isPending} onPress={onSave}>
          <Text>{save.isPending ? "Saving…" : "Save limit"}</Text>
        </Button>
      </BottomActionBar>
    </View>
  );
}

// ---------- selection logic ----------

function selectedKeys<K extends string>(record: Partial<Record<K, boolean>>): K[] {
  return (Object.keys(record) as K[]).filter((k) => record[k]);
}

function toggleCategory(form$: Form$, section: AppSection) {
  const whole = form$.wholeCats[section.key].peek();
  batch(() => {
    for (const a of section.apps) {
      if (whole) form$.pkgs[a.packageName].delete();
      else form$.pkgs[a.packageName].set(true);
    }
    if (whole) form$.wholeCats[section.key].delete();
    else form$.wholeCats[section.key].set(true);
  });
}

function toggleApp(form$: Form$, section: AppSection, pkg: string) {
  batch(() => {
    if (form$.pkgs[pkg].peek()) {
      form$.pkgs[pkg].delete();
      // Unticking one app means it's no longer "the whole category"
      form$.wholeCats[section.key].delete();
    } else {
      form$.pkgs[pkg].set(true);
    }
  });
}

function defaultName(form: NewLimitForm, sections: AppSection[], apps: InstalledApp[]) {
  const wholeCats = selectedKeys(form.wholeCats);
  if (wholeCats.length === 1) return sections.find((s) => s.key === wholeCats[0])?.label ?? "My limit";
  const picked = apps.filter((a) => form.pkgs[a.packageName]);
  if (picked.length === 1) return picked[0].label;
  return "My limit";
}

// ---------- step 1 components ----------

function SectionCard({ section, form$ }: { section: AppSection; form$: Form$ }) {
  const whole = useValue(() => !!form$.wholeCats[section.key].get());
  const picked = useValue(() => section.apps.filter((a) => form$.pkgs[a.packageName].get()).length);
  const isOpen = useValue(() => form$.open.get() === section.key);

  return (
    <View className="mb-3 overflow-hidden rounded-lg border border-border">
      <View className="flex-row items-center px-4 py-3">
        <Checkbox checked={whole} partial={picked > 0 && !whole} onPress={() => toggleCategory(form$, section)} />
        <Pressable
          className="ml-3 flex-1 flex-row items-center"
          onPress={() => form$.open.set(isOpen ? null : section.key)}
        >
          <Text className="flex-1 text-base font-semibold text-foreground">{section.label}</Text>
          <Text className="mr-2 text-sm text-muted-foreground">
            {picked > 0 ? `${picked}/${section.apps.length}` : section.apps.length}
          </Text>
          <Text className="text-muted-foreground">{isOpen ? "▲" : "▼"}</Text>
        </Pressable>
      </View>
      {isOpen &&
        section.apps.map((app) => <AppRow key={app.packageName} app={app} section={section} form$={form$} />)}
    </View>
  );
}

function AppRow({ app, section, form$ }: { app: InstalledApp; section: AppSection; form$: Form$ }) {
  const checked = useValue(() => !!form$.pkgs[app.packageName].get());
  const toggle = () => toggleApp(form$, section, app.packageName);
  return (
    <Pressable onPress={toggle} className="flex-row items-center border-t border-border px-4 py-2.5">
      <Checkbox checked={checked} onPress={toggle} />
      <AppIcon uri={app.icon} size={32} style={{ marginLeft: 12 }} />
      <Text className="ml-3 flex-1 text-base text-foreground">{app.label}</Text>
    </Pressable>
  );
}

function ContinueButton({ form$ }: { form$: Form$ }) {
  const count = useValue(() => selectedKeys(form$.pkgs.get()).length);
  return (
    <BottomActionBar>
      <Button disabled={count === 0} onPress={() => form$.step.set("setup")}>
        <Text>{count ? `Continue with ${count} app${count > 1 ? "s" : ""}` : "Pick at least one app"}</Text>
      </Button>
    </BottomActionBar>
  );
}

// ---------- step 2 components ----------

function SelectedApps({ form$, apps }: { form$: Form$; apps: InstalledApp[] }) {
  const selected = useValue(() => apps.filter((a) => form$.pkgs[a.packageName].get()));
  return (
    <View className="mb-6 flex-row flex-wrap gap-3">
      {selected.map((a) => (
        <View key={a.packageName} className="w-16 items-center">
          <AppIcon uri={a.icon} size={40} />
          <Text numberOfLines={1} className="mt-1 text-xs text-foreground">{a.label}</Text>
        </View>
      ))}
    </View>
  );
}

function NameInput(props: { form$: Form$; sections: AppSection[]; apps: InstalledApp[] }) {
  const name = useValue(props.form$.name);
  const placeholder = useValue(() => defaultName(props.form$.get(), props.sections, props.apps));
  return (
    <Input
      value={name}
      onChangeText={(t) => props.form$.name.set(t)}
      placeholder={placeholder}
      className="mb-6"
    />
  );
}

function SessionsStepper({ sessions$ }: { sessions$: Observable<number> }) {
  const sessions = useValue(sessions$);
  return (
    <View className="mb-6 flex-row items-center">
      <Button variant="outline" size="icon" onPress={() => sessions$.set((n) => Math.max(1, n - 1))}>
        <Text>−</Text>
      </Button>
      <Text className="w-16 text-center text-2xl font-bold text-foreground">{sessions}</Text>
      <Button variant="outline" size="icon" onPress={() => sessions$.set((n) => Math.min(10, n + 1))}>
        <Text>+</Text>
      </Button>
    </View>
  );
}

function MinuteChip({ value, minutes$ }: { value: number; minutes$: Observable<number> }) {
  const selected = useValue(() => minutes$.get() === value);
  return <Chip label={`${value} min`} selected={selected} onPress={() => minutes$.set(value)} className="px-4 py-2" />;
}

function Summary({ form$ }: { form$: Form$ }) {
  const sessions = useValue(form$.sessions);
  const minutes = useValue(form$.minutes);
  return (
    <Text className="text-base text-muted-foreground">
      You can open these apps {sessions} time{sessions > 1 ? "s" : ""} a day, for {minutes} minutes each time.
    </Text>
  );
}
