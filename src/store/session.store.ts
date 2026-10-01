import { batch, observable } from "@legendapp/state";
import { selectedPackages } from "@/features/onboarding/logic";
import { track } from "@/lib/analytics";
import { guard } from "@/lib/guard";
import type { AppSession } from "@/types/guard";
import type { Frequency } from "@/types/onboarding";
import { historyActions } from "./history.store";
import { setup$ } from "./setup.store";

/**
 * Mirror of the per-app timers, keyed by session id. The phone (native service) is the source
 * of truth; screens call `refresh` every second while they're visible. undefined = not loaded yet.
 */
export const sessions$ = observable<Record<string, AppSession> | undefined>(undefined);

export type NewSessions = {
  apps: { packageName: string; label: string }[];
  budgetSec: number;
  frequency: Frequency;
  everyHours: number;
};

let nextId = 0;
const newId = () => `${Date.now().toString(36)}-${(nextId++).toString(36)}`;

/** Length of the next round after a check-in: "every X hrs" waits X hours, "continuous" repeats the length. */
export function nextBudgetSec(s: Pick<AppSession, "frequency" | "everyHours" | "budgetSec">) {
  return s.frequency === "every" ? s.everyHours * 3600 : s.budgetSec;
}

export const sessionActions = {
  async refresh() {
    const list = await guard.getSessions();
    sessions$.set(Object.fromEntries(list.map((s) => [s.sessionId, s])));
    return list;
  },

  /** Adds a waiting timer per app. Nothing counts until the app is actually opened. */
  async add({ apps, budgetSec, frequency, everyHours }: NewSessions) {
    if (!apps.length) return;
    const goal = setup$.goal.peek().trim();
    // An app can only have one timer: keep the old one's history before it's replaced.
    const replaced = Object.values(sessions$.peek() ?? {}).filter((s) =>
      apps.some((a) => a.packageName === s.packageName),
    );
    replaced.forEach((s) => historyActions.archive(s));

    await guard.addSessions(
      apps.map((a) => ({
        sessionId: newId(),
        packageName: a.packageName,
        label: a.label,
        goal,
        budgetSec,
        frequency,
        everyHours,
      })),
    );
    batch(() => {
      setup$.assign({ lengthMin: Math.round(budgetSec / 60), frequency, everyHours });
      setup$.sessionsStarted.set((n) => n + apps.length);
    });
    track("session_started", { budget_sec: budgetSec, frequency, apps_count: apps.length });
    return sessionActions.refresh();
  },

  /**
   * After sign-in: the apps picked in onboarding (or saved to the account) get waiting timers
   * with the default length, so Home isn't empty. Skipped if this phone already has timers.
   */
  async seedFromSetup() {
    const existing = await guard.getSessions();
    if (existing.length) return;
    const s = setup$.peek();
    const apps = selectedPackages(s.apps).map((p) => ({ packageName: p, label: s.appLabels[p] ?? p }));
    await sessionActions.add({ apps, budgetSec: s.lengthMin * 60, frequency: s.frequency, everyHours: s.everyHours });
  },

  /** Time is up and the user keeps going: start the next round. */
  async continue(sessionId: string) {
    const s = sessions$[sessionId].peek();
    if (!s) return;
    const next = await guard.continueSession(sessionId, nextBudgetSec(s));
    if (next) sessions$[sessionId].set(next);
  },

  /** Stops the timer and keeps it in history. */
  async end(sessionId: string) {
    const ended = await guard.endSession(sessionId);
    if (ended) historyActions.archive(ended);
    sessions$[sessionId].delete();
    return ended;
  },

  /** On sign-out: stop every timer on the phone. */
  async endAll() {
    const list = await guard.getSessions();
    for (const s of list) await guard.endSession(s.sessionId);
    sessions$.set({});
  },
};
