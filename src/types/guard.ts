import type { Frequency } from "./onboarding";

// BRD 11.4 native module contract (modules/remindu-guard). The UI codes against this;
// src/lib/guard picks the native implementation or a mock.

export type SessionConfig = {
  sessionId: string;
  goal: string;
  budgetSec: number;
  frequency: Frequency;
  everyHours?: number;
  packages: string[];
};

export type SessionState = SessionConfig & {
  remainingSec: number;
  foregroundPackage: string | null;
  startedAt: number;
};

export type GuardApp = {
  packageName: string;
  label: string;
  category: string;
  iconBase64: string | null; // data:image/png;base64,...
};

export type PermissionKind = "usage" | "overlay" | "notifications" | "battery";
export type PermissionStatus = Record<PermissionKind, boolean>;

export type SessionEndReason = "user_ended" | "emergency_exit";

export type Guard = {
  /** false when running the mock (Expo Go, iOS, web, or native code not built yet). */
  isNative: boolean;
  startSession(config: SessionConfig): Promise<void>;
  updateSession(patch: Partial<SessionConfig>): Promise<void>;
  endSession(reason: SessionEndReason): Promise<void>;
  resolveCheckin(r: { checkinId: string; completed: boolean }): Promise<void>;
  getState(): Promise<SessionState | null>;
  getInstalledApps(): Promise<GuardApp[]>;
  getPermissionStatus(): Promise<PermissionStatus>;
  openPermissionSettings(kind: PermissionKind): void | Promise<void>;
};
