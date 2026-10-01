import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import { supabase } from "@/lib/supabase";
import { authActions, authStore$ } from "@/store/auth.store";
import { historyActions } from "@/store/history.store";
import { onboardingActions } from "@/store/onboarding.store";
import { sessionActions } from "@/store/session.store";
import { setupActions } from "@/store/setup.store";
import type { Profile } from "@/types/goals";

export const profileKeys = { me: ["profile"] as const };

async function fetchProfile(): Promise<Profile> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = auth.user;
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;

  const meta = user.user_metadata ?? {};
  const email = user.email ?? null;
  return {
    id: user.id,
    email,
    // Google gives a full name; email sign-ups fall back to the part before the @.
    name: data?.display_name ?? meta.full_name ?? meta.name ?? email?.split("@")[0] ?? "You",
    avatarUrl: data?.avatar_url ?? meta.avatar_url ?? meta.picture ?? null,
    provider: user.app_metadata?.provider ?? null,
    memberSince: data?.created_at ?? user.created_at,
  };
}

export function useProfile() {
  const userId = authStore$.userId.peek();
  return useQuery({ queryKey: [...profileKeys.me, userId], queryFn: fetchProfile, staleTime: 5 * 60_000 });
}

async function updateName(name: string) {
  const id = authStore$.userId.peek();
  if (!id) throw new Error("Not signed in");
  const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", id);
  if (error) throw error;
}

export function useUpdateName() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateName,
    onSettled: () => client.invalidateQueries({ queryKey: profileKeys.me }),
  });
}

/**
 * Stops every timer and clears this user's data from the phone, so the next person to sign in
 * starts clean. Display preferences (theme) stay.
 */
async function clearLocalData() {
  await sessionActions.endAll().catch((e) => console.warn("could not stop timers", e));
  historyActions.reset();
  setupActions.reset();
  onboardingActions.reset();
  queryClient.clear();
}

export async function signOut() {
  await clearLocalData();
  const { error } = await supabase.auth.signOut();
  authActions.logOut();
  if (error) throw error;
}

export async function deleteAccount() {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw error;
  await clearLocalData();
  // The user is gone on the server; only drop the local session.
  await supabase.auth.signOut({ scope: "local" });
  authActions.logOut();
}
