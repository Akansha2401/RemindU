import { observable } from "@legendapp/state";
import { guard } from "@/lib/guard";
import type { PermissionKind, PermissionStatus } from "@/types/guard";

/** Live permission status (not persisted: the system is the source of truth). */
export const permissions$ = observable<{ status: PermissionStatus | null; pending: PermissionKind | null }>({
  status: null,
  // The permission whose system screen we just opened; reported once the user comes back.
  pending: null,
});

export const permissionActions = {
  async refresh() {
    const status = await guard.getPermissionStatus();
    permissions$.status.set(status);
    return status;
  },
  async request(kind: PermissionKind) {
    permissions$.pending.set(kind);
    await guard.openPermissionSettings(kind);
    // Runtime prompts (notifications) resolve in place, without leaving the app.
    if (kind === "notifications" || !guard.isNative) await permissionActions.refresh();
  },
};
