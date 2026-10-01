import type { Frequency } from "./onboarding";

// Native sessions/apps/permissions contract. The UI codes against this;
// src/lib/guard picks the native implementation or a mock.

/** One timer per app, created from the Add sheet. */
export type AppSessionConfig = {
  sessionId: string;
  packageName: string;
  label: string;
  goal: string;
  budgetSec: number;
  frequency: Frequency;
  everyHours: number;
};

/**
 * waiting = the app hasn't been opened since the timer was added;
 * counting = the app is open; paused = opened before, closed now (or screen off);
 * time_up = the budget is used and RemindU asks for a check-in;
 * cooldown = "every X hrs" ran out: the app is blocked until cooldownUntil, then a fresh round waits.
 */
export type SessionStatus = "waiting" | "counting" | "paused" | "time_up" | "cooldown";

/** [start, end] epoch ms of one stretch the app was open. */
export type UsageLog = [number, number];

export type AppSession = AppSessionConfig & {
  remainingSec: number;
  createdAt: number;
  /** First time the app was opened; null while waiting. */
  startedAt: number | null;
  status: SessionStatus;
  /** When the next round opens (epoch ms) while cooling down; null otherwise. */
  cooldownUntil: number | null;
  /** Times the user checked in after time was up and kept going. */
  checkIns: number;
  logs: UsageLog[];
};

export type ScreenTimeDay = {
  /** yyyy-MM-dd, local time */
  date: string;
  totalMs: number;
  /** Most used apps that day, largest first. */
  apps: { packageName: string; label: string; ms: number }[];
};

export type GuardApp = {
  packageName: string;
  label: string;
  category: string;
  iconBase64: string | null; // data:image/png;base64,...
};

export type PermissionKind = "usage" | "overlay" | "notifications" | "battery";
export type PermissionStatus = Record<PermissionKind, boolean>;

export type Guard = {
  /** false when running the mock (Expo Go, iOS, web, or native code not built yet). */
  isNative: boolean;
  /** Adds a waiting timer per app; an app that already has one gets a fresh timer. */
  addSessions(configs: AppSessionConfig[]): Promise<void>;
  getSessions(): Promise<AppSession[]>;
  /** After time is up: start a new budget (continuous). */
  continueSession(sessionId: string, budgetSec: number): Promise<AppSession | null>;
  /** Removes the timer and returns its final state. */
  endSession(sessionId: string): Promise<AppSession | null>;
  /** Last `days` days, today first. Empty without usage access. */
  getScreenTime(days: number): Promise<ScreenTimeDay[]>;
  getInstalledApps(): Promise<GuardApp[]>;
  getPermissionStatus(): Promise<PermissionStatus>;
  openPermissionSettings(kind: PermissionKind): void | Promise<void>;
};
