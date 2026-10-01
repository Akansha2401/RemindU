import { observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { persistPlugin } from "@/lib/persist";
import { supabase } from "@/lib/supabase";
import type { AuthState } from "@/types/auth";

export const authStore$ = observable<AuthState>({
  // Defaults to logged in until a real login screen exists.
  isLoggedIn: true,
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
  if (event === "SIGNED_OUT") authActions.logOut();
  else if (event === "SIGNED_IN") authActions.logIn(session?.user.id ?? null);
  else if (session) authStore$.userId.set(session.user.id);
});
