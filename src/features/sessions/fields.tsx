import { View } from "react-native";
import { batch, type Observable } from "@legendapp/state";
import { useValue } from "@legendapp/state/react";
import { Chip } from "@/components/ui/chip";
import { IconButton } from "@/components/ui/icon-button";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import type { Frequency } from "@/types/onboarding";

// Session length and check-in frequency, shared by the Add sheet and Edit session.

const copy = strings.add;
export const PRESETS = strings.length.presets;
const FREQUENCIES: Frequency[] = ["once", "every", "continuous"];

export type TimerForm = {
  lengthMin: number;
  /** The hours/minutes steppers are showing instead of a preset. */
  custom: boolean;
  frequency: Frequency;
  everyHours: number;
};

type FormProps = { form$: Observable<TimerForm> };

export const isPreset = (min: number) => (PRESETS as readonly number[]).includes(min);

export function FieldLabel({ children }: { children: string }) {
  return <Text className="mb-2 text-label font-bold text-cocoa">{children}</Text>;
}

export function LengthField({ form$ }: FormProps) {
  const length = useValue(form$.lengthMin);
  const custom = useValue(form$.custom);
  const hours = Math.floor(length / 60);
  const minutes = length % 60;
  const setCustom = (h: number, m: number) => form$.lengthMin.set(Math.max(0, h) * 60 + Math.max(0, m));

  return (
    <View className="mb-6">
      <FieldLabel>{copy.lengthLabel}</FieldLabel>
      <View className="gap-3 rounded-[18px] bg-muted p-3">
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {PRESETS.map((m) => (
            <Chip
              key={m}
              label={strings.length.label(m)}
              selected={!custom && length === m}
              onPress={() => batch(() => form$.assign({ lengthMin: m, custom: false }))}
            />
          ))}
          <Chip label={copy.custom} selected={custom} onPress={() => form$.custom.set(true)} />
        </View>
        {custom && (
          <View className="flex-row gap-2">
            <Stepper
              label={copy.customHours}
              value={String(hours)}
              onMinus={() => setCustom(hours - 1, minutes)}
              onPlus={() => setCustom(Math.min(12, hours + 1), minutes)}
            />
            <Stepper
              label={copy.customMinutes}
              value={String(minutes)}
              onMinus={() => setCustom(hours, minutes - 5)}
              onPlus={() => (minutes >= 55 ? setCustom(Math.min(12, hours + 1), 0) : setCustom(hours, minutes + 5))}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function Stepper(props: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-row bg-card py-2.5">
      <Text className="text-caption text-muted-foreground">{props.label}</Text>
      <View className="flex-row items-center gap-3">
        <IconButton icon="minus" className="bg-background" accessibilityLabel={`Less ${props.label}`} onPress={props.onMinus} />
        <Text className="w-8 text-center text-button font-bold">{props.value}</Text>
        <IconButton icon="plus" className="bg-background" accessibilityLabel={`More ${props.label}`} onPress={props.onPlus} />
      </View>
    </View>
  );
}

export function FrequencyField({ form$ }: FormProps) {
  const frequency = useValue(form$.frequency);
  const every = useValue(form$.everyHours);
  return (
    <View className="mb-6">
      <FieldLabel>{copy.frequencyLabel}</FieldLabel>
      <View className="gap-3 rounded-[18px] bg-muted p-3">
        <View accessibilityRole="radiogroup" className="flex-row gap-2">
          {FREQUENCIES.map((f) => (
            <Chip
              key={f}
              className="flex-1 px-2"
              label={strings.length.frequencies[f]}
              selected={frequency === f}
              onPress={() => form$.frequency.set(f)}
            />
          ))}
        </View>
        {frequency === "every" && (
          <View className="flex-row items-center justify-center gap-4 rounded-row bg-card py-2.5">
            <Text className="text-label text-muted-foreground">{copy.everyLabel}</Text>
            <IconButton
              icon="minus"
              className="bg-background"
              accessibilityLabel="Fewer hours"
              onPress={() => form$.everyHours.set((h) => Math.max(1, h - 1))}
            />
            <Text className="w-12 text-center font-bold">{strings.length.everyHours(every)}</Text>
            <IconButton
              icon="plus"
              className="bg-background"
              accessibilityLabel="More hours"
              onPress={() => form$.everyHours.set((h) => Math.min(12, h + 1))}
            />
          </View>
        )}
        <Text className="px-1 text-caption text-walnut">{copy.frequencyHelp[frequency]}</Text>
      </View>
    </View>
  );
}
