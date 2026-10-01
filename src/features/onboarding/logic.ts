// Pure onboarding rules, kept free of React and storage so they can be unit-tested.
import { GOAL_MAX, GOAL_MIN, PERSONA_SUGGESTIONS, SUGGESTED_APPS } from "@/config/onboarding";
import type { PermissionKind, PermissionStatus } from "@/types/guard";
import {
  ONBOARDING_STEPS,
  PROGRESS_STEPS,
  type OnboardingState,
  type OnboardingStep,
  type Persona,
} from "@/types/onboarding";

export const INITIAL_ONBOARDING: OnboardingState = {
  step: "welcome",
  completed: false,
  persona: null,
  goal: { source: "suggestion", text: "" },
  why: { source: "suggestion", text: "" },
  apps: {},
  appLabels: {},
  appsPrefilled: false,
  permissionsSkipped: false,
  attributionDone: false,
  syncPending: false,
  trialSeen: false,
};

/** Route for each step inside the (onboarding) group. */
export function hrefForStep(step: OnboardingStep) {
  return step === "welcome" ? "/" : (`/${step}` as const);
}

export function previousStep(step: OnboardingStep): OnboardingStep | null {
  const i = ONBOARDING_STEPS.indexOf(step);
  return i > 0 ? ONBOARDING_STEPS[i - 1] : null;
}

/**
 * Where a cold start should land. Resumes the last screen reached, so leaving for Android
 * Settings (and Android killing the app meanwhile) brings the user back to the same place.
 */
export function resumeStep(state: Pick<OnboardingState, "step" | "completed" | "persona">): OnboardingStep {
  if (state.completed) return "welcome";
  // Without a persona the later screens have nothing to show; restart at the persona question.
  if (!state.persona && ONBOARDING_STEPS.indexOf(state.step) > ONBOARDING_STEPS.indexOf("persona")) {
    return "persona";
  }
  return state.step;
}

/** Progress for screens 2–6 (0–1), or null when the bar is hidden. */
export function progressFor(step: OnboardingStep): number | null {
  const i = PROGRESS_STEPS.indexOf(step);
  return i === -1 ? null : (i + 1) / PROGRESS_STEPS.length;
}

export function suggestionsFor(persona: Persona | null) {
  return PERSONA_SUGGESTIONS[persona ?? "other"];
}

export function isGoalValid(text: string) {
  const n = text.trim().length;
  return n >= GOAL_MIN && n <= GOAL_MAX;
}

/**
 * Applies a persona choice: pre-fills goal and why with the persona's first suggestion
 * unless the user already wrote their own.
 */
export function applyPersona(state: OnboardingState, persona: Persona): OnboardingState {
  const s = suggestionsFor(persona);
  return {
    ...state,
    persona,
    goal: state.goal.source === "custom" && state.goal.text ? state.goal : { source: "suggestion", text: s.goals[0] },
    why:
      state.why.source === "custom" && state.why.text
        ? state.why
        : { source: "suggestion", text: s.whys[0] },
  };
}

/**
 * APP-03: pre-toggles suggested apps that are installed, once. After that the user's
 * own choices are kept, even if they deselected every suggestion.
 */
export function prefillApps(
  state: Pick<OnboardingState, "apps" | "appLabels" | "appsPrefilled">,
  installed: readonly { packageName: string; label: string }[],
): Pick<OnboardingState, "apps" | "appLabels" | "appsPrefilled"> {
  if (state.appsPrefilled) return state;
  const installedPkgs = new Set(installed.map((a) => a.packageName));
  const apps = { ...state.apps };
  const appLabels = { ...state.appLabels };
  for (const s of SUGGESTED_APPS) {
    if (!installedPkgs.has(s.packageName)) continue;
    apps[s.packageName] = true;
    appLabels[s.packageName] = installed.find((a) => a.packageName === s.packageName)?.label ?? s.label;
  }
  return { apps, appLabels, appsPrefilled: true };
}

/** Installed apps split into suggested (shown first, APP-03 order) and the rest. */
export function splitSuggested<T extends { packageName: string }>(installed: readonly T[]) {
  const order = new Map(SUGGESTED_APPS.map((s, i) => [s.packageName, i]));
  const suggested = installed
    .filter((a) => order.has(a.packageName))
    .sort((a, b) => order.get(a.packageName)! - order.get(b.packageName)!);
  const rest = installed.filter((a) => !order.has(a.packageName));
  return { suggested, rest };
}

export function selectedPackages(apps: Record<string, boolean>) {
  return Object.keys(apps).filter((p) => apps[p]);
}

export function missingPermissions(
  status: PermissionStatus | null,
  required: readonly PermissionKind[],
): PermissionKind[] {
  if (!status) return [...required];
  return required.filter((k) => !status[k]);
}
