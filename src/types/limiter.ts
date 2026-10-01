import type { BucketKey } from "@/features/limiter/categories";

/** Row in the Supabase `app_limits` table. */
export type LimitRow = {
  id: string;
  user_id: string;
  name: string;
  packages: string[]; // apps picked one by one
  categories: string[]; // whole categories picked (new installs get included too)
  sessions_per_day: number;
  session_minutes: number;
  enabled: boolean;
  created_at: string;
};

export type NewLimit = Pick<
  LimitRow,
  "name" | "packages" | "categories" | "sessions_per_day" | "session_minutes"
>;

/** Row inserted into the Supabase `checkins` table. */
export type CheckinInput = {
  limit_id: string;
  package_name: string;
  intention: string;
  outcome: "started" | "skipped";
};

export type GateReason = "start" | "time_up" | "limit";

/** Deep-link params: remindu://gate?ruleId=...&pkg=...&reason=... */
export type GateParams = { ruleId: string; pkg: string; reason: GateReason };

export type LimiterPermissions = {
  usageAccess: boolean;
  overlay: boolean;
  battery: boolean;
};

/** Local state of the two-step "New limit" form. Sets are stored as records for fine-grained updates. */
export type NewLimitForm = {
  step: "pick" | "setup";
  open: BucketKey | null;
  pkgs: Record<string, boolean>;
  wholeCats: Partial<Record<BucketKey, boolean>>;
  name: string;
  sessions: number;
  minutes: number;
};
