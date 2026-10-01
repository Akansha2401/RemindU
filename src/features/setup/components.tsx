import { View } from "react-native";
import { router } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { GOAL_MAX } from "@/config/onboarding";
import { strings } from "@/constants/strings";
import { missingPermissions, selectedPackages } from "@/features/onboarding/logic";
import { REQUIRED_PERMISSIONS } from "@/lib/guard";
import { permissions$ } from "@/store/permissions.store";
import { setup$ } from "@/store/setup.store";
import type { Frequency } from "@/types/onboarding";

const copy = strings.setup;

export function FieldLabel({ children }: { children: string }) {
  return <Text className="mb-2 text-label font-bold text-cocoa">{children}</Text>;
}

/** ONB-05: shown while a required permission is missing. */
export function PermissionBanner() {
  const missing = useValue(() => {
    const status = permissions$.status.get();
    return status ? missingPermissions(status, REQUIRED_PERMISSIONS) : [];
  });
  if (missing.length === 0) return null;
  const names = missing.map((k) => strings.onboarding.permissions.items[k].title.toLowerCase()).join(", ");
  return (
    <View className="mb-5 flex-row items-center gap-3 rounded-card bg-error-bg p-4">
      <View className="flex-1">
        <Text className="font-bold text-destructive">{copy.banner.title}</Text>
        <Text className="mt-0.5 text-sm text-walnut">{copy.banner.body(names)}</Text>
      </View>
      <Button size="sm" onPress={() => router.push("/settings/permissions")}>
        <Text>{copy.banner.cta}</Text>
      </Button>
    </View>
  );
}

export function GoalField() {
  const goal = useValue(setup$.goal);
  const why = useValue(setup$.why);
  return (
    <View className="mb-6">
      <FieldLabel>{copy.goalLabel}</FieldLabel>
      <View className="gap-2.5 rounded-[18px] bg-muted p-3">
        <Input
          value={goal}
          onChangeText={(t) => setup$.goal.set(t)}
          placeholder={copy.goalPlaceholder}
          maxLength={GOAL_MAX}
          accessibilityLabel={copy.goalLabel}
        />
        {why ? (
          <View className="rounded-input bg-accent px-4 py-3">
            <Text className="text-caption font-bold uppercase tracking-widest text-accent-foreground">
              {copy.whyLabel}
            </Text>
            <Text className="mt-1 font-semibold">{why}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const LENGTHS = [60, 120, 180];

export function LengthField() {
  const length = useValue(setup$.lengthMin);
  return (
    <View className="mb-6">
      <FieldLabel>{copy.lengthLabel}</FieldLabel>
      <View accessibilityRole="radiogroup" className="flex-row gap-2 rounded-[18px] bg-muted p-3">
        {LENGTHS.map((m) => (
          <Chip
            key={m}
            className="flex-1"
            label={copy.lengths[m]}
            selected={length === m}
            onPress={() => setup$.lengthMin.set(m)}
          />
        ))}
      </View>
    </View>
  );
}

const FREQUENCIES: Frequency[] = ["once", "every", "continuous"];

export function FrequencyField() {
  const frequency = useValue(setup$.frequency);
  const every = useValue(setup$.everyHours);
  return (
    <View className="mb-6">
      <FieldLabel>{copy.frequencyLabel}</FieldLabel>
      <View className="gap-3 rounded-[18px] bg-muted p-3">
        <View accessibilityRole="radiogroup" className="flex-row gap-2">
          {FREQUENCIES.map((f) => (
            <Chip
              key={f}
              className="flex-1 px-2"
              label={copy.frequencies[f]}
              selected={frequency === f}
              onPress={() => setup$.frequency.set(f)}
            />
          ))}
        </View>
        {frequency === "every" && (
          <View className="flex-row items-center justify-center gap-4 rounded-row bg-card py-2.5">
            <IconButton
              icon="minus"
              className="bg-background"
              accessibilityLabel="Fewer hours"
              onPress={() => setup$.everyHours.set((h) => Math.max(1, h - 1))}
            />
            <Text className="w-12 text-center font-bold">{copy.everyHours(every)}</Text>
            <IconButton
              icon="plus"
              className="bg-background"
              accessibilityLabel="More hours"
              onPress={() => setup$.everyHours.set((h) => Math.min(12, h + 1))}
            />
          </View>
        )}
      </View>
    </View>
  );
}

export function AppsSummary() {
  const names = useValue(() => {
    const s = setup$.get();
    return selectedPackages(s.apps).map((p) => s.appLabels[p] ?? p);
  });
  return (
    <View className="mb-6">
      <FieldLabel>{copy.appsLabel}</FieldLabel>
      <View className="flex-row items-center gap-3 rounded-input bg-card px-4 py-3.5">
        <Text numberOfLines={2} className={names.length ? "flex-1 font-semibold" : "flex-1 text-muted-foreground"}>
          {names.length ? names.join(", ") : copy.appsNone}
        </Text>
        <Button size="sm" variant="secondary" onPress={() => router.push("/edit-apps")}>
          <Text>{copy.edit}</Text>
        </Button>
      </View>
      <Text className="mt-2 text-caption text-muted-foreground">{copy.appsHelper}</Text>
    </View>
  );
}
