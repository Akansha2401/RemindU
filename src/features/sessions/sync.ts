import { supabase } from "@/lib/supabase";
import { authStore$ } from "@/store/auth.store";

/** Saves the picked apps to the account (app_rules), so they come back on a new phone. */
export async function pushAppRules(apps: { packageName: string; label: string }[], enabled = true) {
  const userId = authStore$.userId.peek();
  if (!userId || !apps.length) return;
  const { error } = await supabase.from("app_rules").upsert(
    apps.map((a) => ({ user_id: userId, package_name: a.packageName, label: a.label, enabled })),
    { onConflict: "user_id,package_name" },
  );
  if (error) throw error;
}
