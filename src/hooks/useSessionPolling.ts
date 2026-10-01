import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { sessionActions } from "@/store/session.store";

/** Refreshes session$ from the phone every second while the screen is focused. */
export function useSessionPolling(intervalMs = 1000) {
  useFocusEffect(
    useCallback(() => {
      sessionActions.refresh();
      const id = setInterval(sessionActions.refresh, intervalMs);
      return () => clearInterval(id);
    }, [intervalMs]),
  );
}
