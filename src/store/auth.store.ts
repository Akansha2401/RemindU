import { observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { persistPlugin } from "@/lib/persist";
import { supabase } from "@/lib/supabase";
import type { AuthState } from "@/types/auth";

/**
 * Persisted so the first render already shows the right stack; Supabase's own session
 * (also persisted) confirms it via INITIAL_SESSION right after launch.
 */
export const authStore$ = observable<AuthState>({
  isLoggedIn: false,
  userId: null,
});

syncObservable(authStore$, {
  persist: { name: "auth", plugin: persistPlugin },
});

export const authActions = {
  logIn(userId: string | null = null) {
    authStore$.assign({ isLoggedIn: true, userId });
  },
  logOut() {
    authStore$.assign({ isLoggedIn: false, userId: null });
  },
};

// Keep the store in step with Supabase sessions.
supabase.auth.onAuthStateChange((event, session) => {
  if (session) authActions.logIn(session.user.id);
  else if (event === "SIGNED_OUT" || event === "INITIAL_SESSION") authActions.logOut();
});
