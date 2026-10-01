import type { PermissionKind } from "@/types/guard";

/** BRD 13 events. Add new ones here so every call site is typed. */
type Events = {
  onboarding_step: { step: string; permission?: PermissionKind; granted?: boolean };
  session_started: { budget_sec: number; frequency: string; apps_count: number };
};

type Sink = (event: string, props: Record<string, unknown>) => void;

// BRD 13 leaves the provider open (PostHog or a Supabase events table); log in dev until then.
let sink: Sink = (event, props) => {
  if (__DEV__) console.log(`[analytics] ${event}`, props);
};

export function setAnalyticsSink(next: Sink) {
  sink = next;
}

export function track<E extends keyof Events>(event: E, props: Events[E]) {
  try {
    sink(event, props);
  } catch {
    // Analytics must never break the app.
  }
}
