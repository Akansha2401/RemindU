import { observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { persistPlugin } from "@/lib/persist";
import type { PrefsState, ThemePreference } from "@/types/stats";

/** Device-level preferences (kept across sign-outs). */
export const prefs$ = observable<PrefsState>({ theme: "system" });

syncObservable(prefs$, {
  persist: { name: "prefs", plugin: persistPlugin },
});

export const prefsActions = {
  setTheme(theme: ThemePreference) {
    prefs$.theme.set(theme);
  },
};
