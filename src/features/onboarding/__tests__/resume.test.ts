import type { OnboardingStep } from "@/types/onboarding";
import { hrefForStep, INITIAL_ONBOARDING, previousStep, progressFor, resumeStep } from "../logic";

const at = (step: OnboardingStep, extra: Partial<typeof INITIAL_ONBOARDING> = {}) => ({
  ...INITIAL_ONBOARDING,
  persona: "student" as const,
  step,
  ...extra,
});

describe("resume after Android Settings or a restart", () => {
  it("returns to the exact screen the user left from", () => {
    expect(resumeStep(at("permissions"))).toBe("permissions");
    expect(resumeStep(at("apps"))).toBe("apps");
    expect(resumeStep(at("sign-in"))).toBe("sign-in");
  });

  it("starts at welcome on a fresh install", () => {
    expect(resumeStep(INITIAL_ONBOARDING)).toBe("welcome");
  });

  it("falls back to the persona question if later steps have no persona to build on", () => {
    expect(resumeStep(at("goal", { persona: null }))).toBe("persona");
    expect(resumeStep(at("sign-in", { persona: null }))).toBe("persona");
    expect(resumeStep(at("persona", { persona: null }))).toBe("persona");
  });

  it("doesn't resume a finished onboarding", () => {
    expect(resumeStep(at("sign-in", { completed: true }))).toBe("welcome");
  });

  it("maps steps to routes", () => {
    expect(hrefForStep("welcome")).toBe("/");
    expect(hrefForStep("permissions")).toBe("/permissions");
  });

  it("knows where back goes when there's no history (after a resume)", () => {
    expect(previousStep("permissions")).toBe("apps");
    expect(previousStep("persona")).toBe("welcome");
    expect(previousStep("welcome")).toBeNull();
  });
});

describe("progress bar", () => {
  it("shows only on screens 2–6", () => {
    expect(progressFor("welcome")).toBeNull();
    expect(progressFor("sign-in")).toBeNull();
    expect(progressFor("persona")).toBeCloseTo(0.2);
    expect(progressFor("permissions")).toBe(1);
  });
});
