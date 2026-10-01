import { router } from "expo-router";
import { onboarding$ } from "@/store/onboarding.store";

/**
 * Call when a session completes. Shows the "how did you find RemindU?" question once,
 * after the first completed session (never during onboarding).
 * TODO: wire to the session engine's onSessionEnded({ reason: "completed" }) once it exists.
 */
export function maybeShowAttribution() {
  if (onboarding$.attributionDone.peek()) return;
  router.push("/attribution");
}
