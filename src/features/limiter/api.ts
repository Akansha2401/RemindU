import { supabase } from "@/lib/supabase";
import { AppLimiter, type InstalledApp, type NativeRule } from "@modules/app-limiter";
import type { CheckinInput, LimitRow, NewLimit } from "@/types/limiter";
import { bucketFor, type BucketKey } from "./categories";

export async function fetchLimits(): Promise<LimitRow[]> {
  const { data, error } = await supabase
    .from("app_limits")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return data as LimitRow[];
}

export async function createLimit(input: NewLimit): Promise<LimitRow> {
  // user_id is filled by the database default (auth.uid())
  const { data, error } = await supabase
    .from("app_limits")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as LimitRow;
}

export async function fetchCategoryOverrides(): Promise<Record<string, BucketKey>> {
  const { data, error } = await supabase
    .from("app_category_overrides")
    .select("package_name, category");
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [r.package_name, r.category as BucketKey]));
}

export async function logCheckin(input: CheckinInput) {
  // Fire-and-forget: enforcement never waits on the network.
  const { error } = await supabase.from("checkins").insert(input);
  if (error) console.warn("checkin not saved", error.message);
}

/**
 * Pushes rules from Supabase down to the phone.
 * Whole categories are expanded to the apps installed *right now*,
 * so a game installed tomorrow is covered after the next sync.
 */
export function syncLimitsToDevice(
  limits: LimitRow[],
  installed: InstalledApp[],
  overrides: Record<string, BucketKey> = {},
) {
  const rules: NativeRule[] = limits.map((l) => {
    const fromCategories = installed
      .filter((a) => l.categories.includes(bucketFor(a, overrides)))
      .map((a) => a.packageName);
    return {
      id: l.id,
      name: l.name,
      packages: [...new Set([...l.packages, ...fromCategories])],
      sessionsPerDay: l.sessions_per_day,
      sessionMinutes: l.session_minutes,
      enabled: l.enabled,
    };
  });
  AppLimiter.setRules(rules);
}
