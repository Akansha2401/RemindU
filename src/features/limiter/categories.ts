import type { InstalledApp, NativeCategory } from "@modules/app-limiter";

/** The categories users actually see. Each maps to one or more Android categories. */
export const BUCKETS = [
  { key: "social", label: "Social", native: ["social"] },
  { key: "entertainment", label: "Entertainment", native: ["video", "audio"] },
  { key: "games", label: "Games", native: ["games"] },
  { key: "creativity", label: "Creativity", native: ["photos"] },
  { key: "news", label: "News & reading", native: ["news"] },
  { key: "productivity", label: "Productivity", native: ["productivity", "maps"] },
  { key: "other", label: "Other apps", native: ["other"] },
] as const satisfies readonly {
  key: string;
  label: string;
  native: readonly NativeCategory[];
}[];

export type BucketKey = (typeof BUCKETS)[number]["key"];

/**
 * Many apps never set an Android category (Instagram often shows up as "other").
 * Fix the popular ones here. Later, move this into the Supabase table
 * `app_category_overrides` so you can fix categories without an app update.
 * Double-check package names on a real device before relying on them.
 */
export const LOCAL_OVERRIDES: Record<string, BucketKey> = {
  "com.instagram.android": "social",
  "com.snapchat.android": "social",
  "com.facebook.katana": "social",
  "com.twitter.android": "social",
  "com.reddit.frontpage": "social",
  "com.linkedin.android": "social",
  "com.pinterest": "social",
  "com.discord": "social",
  "com.whatsapp": "social",
  "org.telegram.messenger": "social",
  "com.google.android.youtube": "entertainment",
  "com.netflix.mediaclient": "entertainment",
  "in.startv.hotstar": "entertainment",
  "com.amazon.avod.thirdpartyclient": "entertainment",
  "com.spotify.music": "entertainment",
  "com.pubg.imobile": "games",
  "com.dts.freefireth": "games",
  "com.supercell.clashofclans": "games",
  "com.canva.editor": "creativity",
};

export function bucketFor(
  app: InstalledApp,
  overrides: Record<string, BucketKey> = {},
): BucketKey {
  const forced = overrides[app.packageName] ?? LOCAL_OVERRIDES[app.packageName];
  if (forced) return forced;
  return BUCKETS.find((b) => (b.native as readonly string[]).includes(app.category))?.key ?? "other";
}

export type AppSection = {
  key: BucketKey;
  label: string;
  apps: InstalledApp[];
};

/** Groups installed apps into the category sections shown in the picker. */
export function groupApps(
  apps: InstalledApp[],
  overrides: Record<string, BucketKey> = {},
): AppSection[] {
  const byBucket = new Map<BucketKey, InstalledApp[]>();
  for (const app of apps) {
    const bucket = bucketFor(app, overrides);
    // Hide pre-installed clutter (Settings, Phone, Calculator...) but keep
    // pre-installed apps that are real distractions, like YouTube.
    if (app.isSystem && bucket === "other") continue;
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), app]);
  }
  return BUCKETS.map((b) => ({ key: b.key, label: b.label, apps: byBucket.get(b.key) ?? [] }))
    .filter((s) => s.apps.length > 0);
}
