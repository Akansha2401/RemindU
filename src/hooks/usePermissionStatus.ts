import { useCallback, useEffect } from "react";
import type { AppStateStatus } from "react-native";
import { useValue } from "@legendapp/state/react";
import { permissionActions, permissions$ } from "@/store/permissions.store";
import { useAppState } from "./useAppState";

/**
 * Current permission status, re-checked on mount and whenever the app returns to the
 * foreground (ONB-04: users grant these in system Settings, then come back).
 */
export function usePermissionStatus(onRefresh?: () => void) {
  useEffect(() => {
    permissionActions.refresh();
  }, []);

  const onAppState = useCallback(
    async (s: AppStateStatus) => {
      if (s !== "active") return;
      await permissionActions.refresh();
      onRefresh?.();
    },
    [onRefresh],
  );
  useAppState(onAppState);

  return useValue(permissions$.status);
}
