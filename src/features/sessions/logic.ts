import type { AppSession, AppSessionEdit } from "@/types/guard";

/**
 * A timer after an edit; mirrors `LimiterStore.editSession` on the native side. Time already used
 * this round still counts against the new length, a waiting timer gets the full new length, and
 * a round that already ran out stays at zero.
 */
export function applySessionEdit(s: AppSession, edit: AppSessionEdit): AppSession {
  const remainingSec =
    s.status === "waiting"
      ? edit.budgetSec
      : s.status === "time_up" || s.status === "cooldown"
        ? s.remainingSec
        : Math.min(edit.budgetSec, Math.max(0, edit.budgetSec - (s.budgetSec - s.remainingSec)));
  return { ...s, ...edit, remainingSec };
}
