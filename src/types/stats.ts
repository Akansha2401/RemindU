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
export type SessionRecord = Pick<AppSession, "createdAt" | "logs" | "checkIns" | "budgetSec"> & { endedAt: number | null };

export type ChartRange = "week" | "month" | "year";

export type ChartBar = { key: string; label: string; ms: number };

/** Time in tracked apps on one day, against that day's limits (one session length per app). */
export type FocusDay = { usedMs: number; limitMs: number };

/** none = no timer ran (or its log no longer reaches back that far); within / over the limits. */
export type DayStatus = "none" | "within" | "over";

/** 0 = no credit (over the limits, or no timer); 1–4 = within, 4 = used a quarter or less. */
export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export type HeatCell = FocusDay & { date: string; status: DayStatus; level: HeatLevel; future: boolean };

export type ThemePreference = "system" | "light" | "dark";

export type PrefsState = {
  theme: ThemePreference;
};
