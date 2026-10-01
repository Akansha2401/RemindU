import { View } from "react-native";
import { router } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { OptionTile } from "@/components/option-tile";
import { PERSONAS } from "@/config/onboarding";
import { strings } from "@/constants/strings";
import { OnboardingScreen } from "@/features/onboarding/components/OnboardingScreen";
import { useOnboardingStep } from "@/features/onboarding/useOnboardingStep";
import { onboarding$, onboardingActions } from "@/store/onboarding.store";
import type { Persona } from "@/types/onboarding";

const copy = strings.onboarding.persona;

// Screen 2: auto-advances on tap.
export default function PersonaScreen() {
  useOnboardingStep("persona");
  const selected = useValue(onboarding$.persona);

  function choose(p: Persona) {
    onboardingActions.setPersona(p);
    router.push("/goal");
  }

  const grid = PERSONAS.filter((p) => p.key !== "other");
  const other = PERSONAS.find((p) => p.key === "other")!;

  return (
    <OnboardingScreen step="persona" title={copy.title}>
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {grid.map((p) => (
          <OptionTile
            key={p.key}
            layout="tile"
            className="w-[48.5%]"
            icon={p.icon}
            label={copy.labels[p.key]}
            description={copy.descriptions[p.key]}
            selected={selected === p.key}
            onPress={() => choose(p.key)}
          />
        ))}
      </View>
      <OptionTile
        className="mt-3"
        icon={other.icon}
        label={copy.labels.other}
        selected={selected === "other"}
        onPress={() => choose("other")}
      />
    </OnboardingScreen>
  );
}
