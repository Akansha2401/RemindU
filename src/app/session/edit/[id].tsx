import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useObservable, useValue } from "@legendapp/state/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { GOAL_MAX } from "@/config/onboarding";
import { strings } from "@/constants/strings";
import { billingErrorMessage, requirePro } from "@/features/billing/actions";
import { FieldLabel, FrequencyField, isPreset, LengthField, type TimerForm } from "@/features/sessions/fields";
import { sessionActions, sessions$ } from "@/store/session.store";
import { setup$ } from "@/store/setup.store";

const copy = strings.session;

type EditForm = TimerForm & { goal: string; saving: boolean };

/** The timer as it is now; falls back to the last-used setup if it's gone. */
function initialForm(id: string): EditForm {
  const s = sessions$[id].peek();
  const setup = setup$.peek();
  const lengthMin = Math.round((s?.budgetSec ?? 0) / 60) || setup.lengthMin;
  return {
    goal: s?.goal || setup.goal,
    lengthMin,
    custom: !isPreset(lengthMin),
    frequency: s?.frequency ?? setup.frequency,
    everyHours: s?.everyHours ?? setup.everyHours,
    saving: false,
  };
}

/** Pro: change one app's goal, session length and check-in frequency without resetting its timer. */
export default function EditSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const label = useValue(() => sessions$[id].label.get() ?? "");
  const form$ = useObservable<EditForm>(initialForm(id));
  const goal = useValue(form$.goal);
  const lengthMin = useValue(form$.lengthMin);
  const saving = useValue(form$.saving);

  async function save() {
    const f = form$.peek();
    form$.saving.set(true);
    try {
      // Also checked here: Pro can lapse while the screen is open.
      if (!(await requirePro())) return;
      await sessionActions.update(id, {
        goal: f.goal.trim(),
        budgetSec: f.lengthMin * 60,
        frequency: f.frequency,
        everyHours: f.everyHours,
      });
      router.back();
    } catch (e) {
      Alert.alert(billingErrorMessage(e) ?? strings.common.tryAgain);
    } finally {
      form$.saving.set(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScreenHeader title={copy.editTitle(label)} back />
        <ScrollView contentContainerClassName="px-5 pb-6 pt-2" keyboardShouldPersistTaps="handled">
          <View className="mb-6">
            <FieldLabel>{copy.goalLabel}</FieldLabel>
            <Input
              value={goal}
              onChangeText={(t) => form$.goal.set(t)}
              placeholder={copy.goalPlaceholder}
              maxLength={GOAL_MAX}
              accessibilityLabel={copy.goalLabel}
            />
          </View>
          <LengthField form$={form$} />
          <Text className="-mt-4 mb-6 px-1 text-caption text-walnut">{copy.editLengthHelp}</Text>
          <FrequencyField form$={form$} />
        </ScrollView>
        <View className="px-5 pb-4 pt-2">
          <Button disabled={saving || lengthMin < 1} onPress={save}>
            <Text>{saving ? copy.saving : copy.save}</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
