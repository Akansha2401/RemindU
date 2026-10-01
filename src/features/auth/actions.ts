import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";
import { onboarding$, onboardingActions } from "@/store/onboarding.store";
import { setupActions } from "@/store/setup.store";
import { pullSetup, pushOnboarding } from "../onboarding/sync";

WebBrowser.maybeCompleteAuthSession();

/** remindu://auth/callback — add it to Supabase Auth > URL Configuration > Redirect URLs. */
export const AUTH_REDIRECT = Linking.createURL("auth/callback");

export async function sendEmailCode(email: string) {
  // ONB-03: a new email creates the account, so sign-up and sign-in are the same flow.
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, token: string) {
  prepareSetup();
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: "email",
  });
  if (error) throw error;
  if (data.user) await afterSignIn(data.user.id);
}

/** Returns false if the user closed the browser. */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: AUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, AUTH_REDIRECT);
  if (result.type !== "success") return false;

  const { queryParams } = Linking.parse(result.url);
  const code = typeof queryParams?.code === "string" ? queryParams.code : null;
  if (!code) throw new Error(String(queryParams?.error_description ?? "No code returned"));

  prepareSetup();
  const session = await supabase.auth.exchangeCodeForSession(code);
  if (session.error) throw session.error;
  await afterSignIn(session.data.user.id);
  return true;
}

/**
 * Copies onboarding answers into Setup *before* the session flips the route guard,
 * so Setup opens already filled in.
 */
function prepareSetup() {
  const o = onboarding$.peek();
  if (o.persona) setupActions.fromOnboarding(o);
}

async function afterSignIn(userId: string) {
  const answered = !!onboarding$.persona.peek();
  onboardingActions.complete();
  try {
    if (answered) await pushOnboarding(userId);
    else await pullSetup(userId); // "I already have an account": restore their goal and apps
    onboarding$.syncPending.set(false);
  } catch (e) {
    // Offline-first: keep the answers locally and retry from the app shell.
    if (answered) onboarding$.syncPending.set(true);
    console.warn("onboarding sync failed", e);
  }
}
