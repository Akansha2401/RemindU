// jest.mock calls below are hoisted above these imports by babel-jest.
import { PERSONA_SUGGESTIONS } from "@/config/onboarding";
import type { OnboardingState } from "@/types/onboarding";
import { resumeStep, selectedPackages } from "../logic";

// In-memory stand-in for expo-sqlite's kv-store, which Legend State persists to.
const mockStorage = new Map<string, string>();
jest.mock("expo-sqlite/kv-store", () => ({
  __esModule: true,
  default: {
    getItemSync: (k: string) => mockStorage.get(k) ?? null,
    setItemSync: (k: string, v: string) => void mockStorage.set(k, v),
    removeItemSync: (k: string) => void mockStorage.delete(k),
  },
}));

// Load the store fresh for each test so persistence is read from mockStorage again,
// the same way a cold start after Android killed the app would.
function loadStore() {
  let mod!: typeof import("@/store/onboarding.store");
  jest.isolateModules(() => {
    mod = jest.requireActual("@/store/onboarding.store");
  });
  return mod;
}

const persisted = (): OnboardingState => JSON.parse(mockStorage.get("onboarding") ?? "{}");
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => mockStorage.clear());

describe("onboarding store", () => {
  it("starts at welcome with nothing answered", () => {
    const { onboarding$ } = loadStore();
    expect(onboarding$.step.get()).toBe("welcome");
    expect(onboarding$.persona.get()).toBeNull();
  });

  it("pre-fills goal and why when a persona is picked", () => {
    const { onboarding$, onboardingActions } = loadStore();
    onboardingActions.setPersona("exam_prep");
    expect(onboarding$.goal.text.get()).toBe(PERSONA_SUGGESTIONS.exam_prep.goals[0]);
    expect(onboarding$.why.text.get()).toBe(PERSONA_SUGGESTIONS.exam_prep.whys[0]);
  });

  it("records a skipped why", () => {
    const { onboarding$, onboardingActions } = loadStore();
    onboardingActions.setPersona("student");
    onboardingActions.skipWhy();
    expect(onboarding$.why.get()).toEqual({ source: "skipped", text: "" });
  });

  it("pre-toggles installed suggestions only once", () => {
    const { onboarding$, onboardingActions } = loadStore();
    const installed = [
      { packageName: "com.instagram.android", label: "Instagram" },
      { packageName: "com.whatsapp", label: "WhatsApp" },
    ];
    onboardingActions.prefillApps(installed);
    expect(selectedPackages(onboarding$.apps.get())).toEqual(["com.instagram.android"]);

    // The user turns Instagram off; coming back to the screen must not turn it on again.
    onboarding$.apps["com.instagram.android"].set(false);
    onboardingActions.prefillApps(installed);
    expect(selectedPackages(onboarding$.apps.get())).toEqual([]);
  });

  it("persists every step so a cold start resumes where the user was", async () => {
    const first = loadStore();
    first.onboardingActions.setPersona("creator");
    first.onboardingActions.prefillApps([{ packageName: "com.google.android.youtube", label: "YouTube" }]);
    first.onboardingActions.setStep("permissions");
    await flush();

    // The user goes to Android Settings for Usage access; Android kills RemindU meanwhile.
    expect(persisted().step).toBe("permissions");

    const second = loadStore();
    const state = second.onboarding$.peek();
    expect(state.persona).toBe("creator");
    expect(state.apps["com.google.android.youtube"]).toBe(true);
    expect(resumeStep(state)).toBe("permissions");
  });

  it("reset clears answers and position", async () => {
    const { onboarding$, onboardingActions } = loadStore();
    onboardingActions.setPersona("teacher");
    onboardingActions.setStep("apps");
    onboardingActions.reset();
    await flush();
    expect(onboarding$.step.get()).toBe("welcome");
    expect(onboarding$.persona.get()).toBeNull();
    expect(persisted().step).toBe("welcome");
  });
});
