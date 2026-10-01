import { batch, observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { guard } from "@/lib/guard";
import { persistPlugin } from "@/lib/persist";
import type { AppSession, ScreenTimeDay } from "@/types/guard";
import type { HistoryState } from "@/types/stats";

const INITIAL: HistoryState = { sessions: {}, screenTime: {}, screenTimeSyncedAt: 0 };

/**
 * Everything the stats are built from, kept on the phone: ended timers (with their usage logs)
 * and daily screen time. Android only keeps about a week of usage events, so each day is saved
 * here as it's read, which is what lets the month and year charts fill in over time.
 */
export const history$ = observable<HistoryState>({ ...INITIAL });

syncObservable(history$, {
  persist: { name: "history", plugin: persistPlugin },
});

// Re-read the whole week at most every few hours; otherwise only today changes.
const BACKFILL_MS = 6 * 60 * 60_000;
const BACKFILL_DAYS = 10;

export const historyActions = {
  /** Saves a timer that ended or was replaced. Finishing at "time's up" counts as a check-in. */
  archive(s: AppSession) {
    const { remainingSec: _remaining, ...rest } = s;
    history$.sessions[s.sessionId].set({
      ...rest,
      checkIns: s.checkIns + (s.status === "time_up" ? 1 : 0),
      endedAt: Date.now(),
    });
  },

  async refreshScreenTime() {
    const now = Date.now();
    const backfill = now - history$.screenTimeSyncedAt.peek() > BACKFILL_MS;
    const days = await guard.getScreenTime(backfill ? BACKFILL_DAYS : 1);
    if (!days.length) return;
    batch(() => {
      for (const day of days) mergeDay(day);
      if (backfill) history$.screenTimeSyncedAt.set(now);
    });
  },

  reset() {
    history$.set({ ...INITIAL });
  },
};

/** Day totals only grow, so never let an older, shorter read (expired events) replace a longer one. */
function mergeDay(day: ScreenTimeDay) {
  const saved = history$.screenTime[day.date].peek();
  if (saved && saved.totalMs > day.totalMs) return;
  history$.screenTime[day.date].set(day);
}
