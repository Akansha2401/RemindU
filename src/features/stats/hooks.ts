import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useValue } from "@legendapp/state/react";
import { history$, historyActions } from "@/store/history.store";
import { sessions$ } from "@/store/session.store";
import { sessionRecords } from "./logic";

/** Active and ended timers in the shape the stats need (reactive). */
export function readRecords() {
  return sessionRecords(Object.values(sessions$.get() ?? {}), Object.values(history$.sessions.get()));
}

/** Runs a stat over every timer; re-renders only when the result changes. */
export function useStat<T>(compute: (records: ReturnType<typeof sessionRecords>) => T): T {
  return useValue(() => compute(readRecords()));
}

/** Reads the latest screen time from the phone whenever the screen is focused. */
export function useScreenTimeOnFocus() {
  useFocusEffect(
    useCallback(() => {
      historyActions.refreshScreenTime().catch((e) => console.warn("screen time read failed", e));
    }, []),
  );
}
