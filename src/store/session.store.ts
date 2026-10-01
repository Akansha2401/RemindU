import { observable } from "@legendapp/state";
import { track } from "@/lib/analytics";
import { guard } from "@/lib/guard";
import { selectedPackages } from "@/features/onboarding/logic";
import type { SessionState } from "@/types/guard";
import { setup$ } from "./setup.store";

/**
 * Mirror of the running session. The phone (native service) is the source of truth;
 * screens call `refresh` every second while they're visible. undefined = not loaded yet.
 */
export const session$ = observable<SessionState | null | undefined>(undefined);

export const sessionActions = {
  async refresh() {
    const s = await guard.getState();
    session$.set(s);
    return s;
  },

  /** Starts a session from the current Setup values. */
  async start() {
    const s = setup$.peek();
    const packages = selectedPackages(s.apps);
    const budgetSec = s.lengthMin * 60;
    await guard.startSession({
      sessionId: `${Date.now()}`,
      goal: s.goal.trim(),
      budgetSec,
      frequency: s.frequency,
      everyHours: s.everyHours,
      packages,
    });
    setup$.sessionsStarted.set((n) => n + 1);
    track("session_started", { budget_sec: budgetSec, frequency: s.frequency, apps_count: packages.length });
    return sessionActions.refresh();
  },

  /** Time is up: "every X hrs" restarts with X hours, "continuous" with the original length. */
  async continue() {
    const s = session$.peek();
    if (!s) return;
    const budgetSec = s.frequency === "every" ? (s.everyHours ?? 1) * 3600 : s.budgetSec;
    session$.set(await guard.continueSession(budgetSec));
  },

  async end() {
    await guard.endSession("user_ended");
    session$.set(null);
  },
};
