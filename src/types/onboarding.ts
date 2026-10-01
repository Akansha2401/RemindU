export type Persona =
  | "student"
  | "exam_prep"
  | "professional"
  | "founder"
  | "creator"
  | "teacher"
  | "other";

/** Onboarding screens in order. The trial (flagged) and attribution screens are outside this flow. */
export const ONBOARDING_STEPS = ["welcome", "persona", "goal", "why", "apps", "permissions", "sign-in"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Steps that show the progress bar (screens 2–6). */
export const PROGRESS_STEPS: readonly OnboardingStep[] = ["persona", "goal", "why", "apps", "permissions"];

export type AnswerSource = "suggestion" | "custom";

export type OnboardingState = {
  /** Last screen reached; the app resumes here after a restart or a trip to Android Settings. */
  step: OnboardingStep;
  completed: boolean;
  persona: Persona | null;
  goal: { source: AnswerSource; text: string };
  why: { source: AnswerSource | "skipped"; text: string };
  /** packageName -> selected */
  apps: Record<string, boolean>;
  /** Labels for selected apps, so Setup can show names without reloading the app list. */
  appLabels: Record<string, string>;
  /** Suggested apps are pre-toggled once; after that the user's choices win. */
  appsPrefilled: boolean;
  permissionsSkipped: boolean;
  /** Attribution question (after the first completed session) has been answered or dismissed. */
  attributionDone: boolean;
  /** Answers still need to be pushed to Supabase (sign-in happened while offline, or the push failed). */
  syncPending: boolean;
  /** The (feature-flagged) trial screen has been shown once. */
  trialSeen: boolean;
};

export type AcquisitionSource = "creator" | "instagram" | "youtube" | "friend" | "other";

export type Frequency = "once" | "every" | "continuous";

/** Session setup screen (SET-*), remembered between sessions (SET-07). */
export type SetupState = {
  goal: string;
  why: string;
  lengthMin: number;
  frequency: Frequency;
  everyHours: number;
  /** packageName -> selected (same shape as onboarding, so the app picker works on both) */
  apps: Record<string, boolean>;
  appLabels: Record<string, string>;
  sessionsStarted: number;
};
