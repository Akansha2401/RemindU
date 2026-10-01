import { useQuery } from "@tanstack/react-query";
import { guard } from "@/lib/guard";
import type { InstalledApp, NativeCategory } from "@modules/app-limiter";
import type { GuardApp } from "@/types/guard";

export const guardAppsKey = ["guard-apps"] as const;

/** Installed apps (with icons), cached for the session. */
export function useGuardApps() {
  return useQuery({ queryKey: guardAppsKey, queryFn: guard.getInstalledApps, staleTime: 5 * 60_000 });
}

const toIcons = (apps: GuardApp[]) => Object.fromEntries(apps.map((a) => [a.packageName, a.iconBase64]));

/** packageName -> icon, from the same cached list. */
export function useAppIcons(): Record<string, string | null> {
  const { data } = useQuery({
    queryKey: guardAppsKey,
    queryFn: guard.getInstalledApps,
    staleTime: 5 * 60_000,
    select: toIcons,
  });
  return data ?? {};
}

/** The shape the category grouping (features/limiter/categories) works with. */
export const toInstalledApp = (a: GuardApp): InstalledApp => ({
  packageName: a.packageName,
  label: a.label,
  category: a.category as NativeCategory,
  isSystem: false,
  icon: a.iconBase64,
});
