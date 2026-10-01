import { supabase } from "@/lib/supabase";
import { onboarding$ } from "@/store/onboarding.store";
import { setup$ } from "@/store/setup.store";
import type { AcquisitionSource } from "@/types/onboarding";
import { selectedPackages } from "./logic";

/** Pushes the locally stored onboarding answers to profiles, goals and app_rules. */
export async function pushOnboarding(userId: string) {
  const o = onboarding$.peek();
  const packages = selectedPackages(o.apps);

  if (o.persona) {
    const { error } = await supabase.from("profiles").update({ persona: o.persona }).eq("id", userId);
    if (error) throw error;
  }

  if (o.goal.text) {
    // Only one active goal per user: retire the old one first.
    const retire = await supabase.from("goals").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
    if (retire.error) throw retire.error;
    const { error } = await supabase.from("goals").insert({
      user_id: userId,
      text: o.goal.text.trim(),
      why: o.why.source === "skipped" ? null : o.why.text.trim() || null,
      is_active: true,
    });
    if (error) throw error;
  }

  if (packages.length) {
    const { error } = await supabase.from("app_rules").upsert(
      packages.map((p) => ({
        user_id: userId,
        package_name: p,
        label: o.appLabels[p] ?? null,
        enabled: true,
      })),
      { onConflict: "user_id,package_name" },
    );
    if (error) throw error;
  }
}

/** For returning users who skipped onboarding: fills Setup from their saved goal and apps. */
export async function pullSetup(userId: string) {
  const [goal, rules] = await Promise.all([
    supabase.from("goals").select("text, why").eq("user_id", userId).eq("is_active", true).maybeSingle(),
    supabase.from("app_rules").select("package_name, label").eq("user_id", userId).eq("enabled", true),
  ]);
  if (goal.error) throw goal.error;
  if (rules.error) throw rules.error;

  setup$.assign({
    ...(goal.data ? { goal: goal.data.text, why: goal.data.why ?? "" } : {}),
    ...(rules.data.length
      ? {
          apps: Object.fromEntries(rules.data.map((r) => [r.package_name, true])),
          appLabels: Object.fromEntries(rules.data.map((r) => [r.package_name, r.label ?? r.package_name])),
        }
      : {}),
  });
}

/** Retries a push that failed earlier (e.g. signed in while offline). */
export async function flushPendingOnboarding(userId: string) {
  if (!onboarding$.syncPending.peek()) return;
  await pushOnboarding(userId);
  onboarding$.syncPending.set(false);
}

export async function saveAttribution(userId: string, source: AcquisitionSource, creator: string) {
  const { error } = await supabase
    .from("profiles")
    .update({
      acquisition_source: source,
      acquisition_creator: source === "creator" && creator.trim() ? creator.trim() : null,
    })
    .eq("id", userId);
  if (error) throw error;
}
