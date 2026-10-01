import type { AppSession, ScreenTimeDay } from "./guard";

/** A timer that has ended (or was replaced by a new one for the same app). */
export type ArchivedSession = Omit<AppSession, "remainingSec"> & { endedAt: number };

export type HistoryState = {
  sessions: Record<string, ArchivedSession>;
  /** yyyy-MM-dd -> that day's screen time */
  screenTime: Record<string, ScreenTimeDay>;
  /** When the last multi-day screen time read happened (epoch ms). */
  screenTimeSyncedAt: number;
};

/** What the stats need from a timer, active or ended. */
export type SessionRecord = Pick<AppSession, "createdAt" | "logs" | "checkIns"> & { endedAt: number | null };

export type ChartRange = "week" | "month" | "year";

export type ChartBar = { key: string; label: string; ms: number };

/** 0 = nothing that day, 4 = the busiest days. */
export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export type HeatCell = { date: string; ms: number; level: HeatLevel; future: boolean };

export type ThemePreference = "system" | "light" | "dark";

export type PrefsState = {
  theme: ThemePreference;
};
