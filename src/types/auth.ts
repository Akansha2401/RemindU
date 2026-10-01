/** Persisted auth status, read by the root layout's route guards. */
export type AuthState = {
  isLoggedIn: boolean;
  /** Supabase user id of the current session, if any. */
  userId: string | null;
};
