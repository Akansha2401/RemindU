import { detectBrand, GOAL_MAX, GOAL_MIN, PERSONA_SUGGESTIONS, PERSONAS, SUGGESTED_APPS } from "@/config/onboarding";
import { applyPersona, INITIAL_ONBOARDING, isGoalValid, splitSuggested, suggestionsFor } from "../logic";

describe("persona suggestions", () => {
  it("has three goals and three whys for every persona tile", () => {
    for (const { key } of PERSONAS) {
      expect(PERSONA_SUGGESTIONS[key].goals).toHaveLength(3);
      expect(PERSONA_SUGGESTIONS[key].whys).toHaveLength(3);
    }
  });

  it("only suggests goals that pass SET-01 (3–80 characters)", () => {
    for (const { goals } of Object.values(PERSONA_SUGGESTIONS)) {
      for (const g of goals) {
        expect(g.length).toBeGreaterThanOrEqual(GOAL_MIN);
        expect(g.length).toBeLessThanOrEqual(GOAL_MAX);
        expect(isGoalValid(g)).toBe(true);
      }
    }
  });

  it("follows the voice rules: no exclamation marks", () => {
    const all = Object.values(PERSONA_SUGGESTIONS).flatMap((s) => [...s.goals, ...s.whys]);
    expect(all.filter((t) => t.includes("!"))).toEqual([]);
  });

  it("falls back to 'other' when no persona is chosen", () => {
    expect(suggestionsFor(null)).toBe(PERSONA_SUGGESTIONS.other);
  });

  it("pre-selects the first goal and why for the chosen persona", () => {
    const s = applyPersona(INITIAL_ONBOARDING, "founder");
    expect(s.persona).toBe("founder");
    expect(s.goal).toEqual({ source: "suggestion", text: PERSONA_SUGGESTIONS.founder.goals[0] });
    expect(s.why).toEqual({ source: "suggestion", text: PERSONA_SUGGESTIONS.founder.whys[0] });
  });

  it("re-suggests when the persona changes, but keeps answers the user wrote", () => {
    const student = applyPersona(INITIAL_ONBOARDING, "student");
    expect(applyPersona(student, "teacher").goal.text).toBe(PERSONA_SUGGESTIONS.teacher.goals[0]);

    const custom = { ...student, goal: { source: "custom" as const, text: "Learn Kannada" } };
    expect(applyPersona(custom, "teacher").goal.text).toBe("Learn Kannada");
  });
});

describe("goal validation", () => {
  it.each([
    ["ab", false],
    ["  ab  ", false],
    ["abc", true],
    ["x".repeat(80), true],
    ["x".repeat(81), false],
  ])("isGoalValid(%j) is %s", (text, valid) => {
    expect(isGoalValid(text)).toBe(valid);
  });
});

describe("suggested apps", () => {
  it("lists installed suggestions first, in APP-03 order", () => {
    const installed = [
      { packageName: "com.whatsapp" },
      { packageName: "com.google.android.youtube" },
      { packageName: "com.instagram.android" },
    ];
    const { suggested, rest } = splitSuggested(installed);
    expect(suggested.map((a) => a.packageName)).toEqual(["com.instagram.android", "com.google.android.youtube"]);
    expect(rest.map((a) => a.packageName)).toEqual(["com.whatsapp"]);
  });

  it("covers the nine APP-03 apps", () => {
    expect(SUGGESTED_APPS.map((a) => a.label)).toEqual([
      "Instagram", "YouTube", "Snapchat", "Facebook", "X", "Reddit", "ShareChat", "Moj", "Josh",
    ]);
  });
});

describe("phone brand detection (ONB-06)", () => {
  it.each([
    ["Xiaomi", "xiaomi"],
    ["Redmi", "xiaomi"],
    ["POCO", "xiaomi"],
    ["OPPO", "oppo"],
    ["vivo", "vivo"],
    ["realme", "realme"],
    ["samsung", "samsung"],
    ["Google", null],
    [null, null],
  ])("%s -> %s", (manufacturer, brand) => {
    expect(detectBrand(manufacturer)).toBe(brand);
  });
});
