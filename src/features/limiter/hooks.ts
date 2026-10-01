import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLimiter, isLimiterAvailable } from "@modules/app-limiter";
import { fetchCategoryOverrides, fetchLimits, syncLimitsToDevice } from "./api";

export const limiterKeys = {
  apps: ["installed-apps"] as const,
  limits: ["app-limits"] as const,
  overrides: ["category-overrides"] as const,
};

export function useInstalledApps() {
  return useQuery({
    queryKey: limiterKeys.apps,
    queryFn: () => AppLimiter.getInstalledApps(true),
    enabled: isLimiterAvailable,
    staleTime: 5 * 60_000,
  });
}

export function useCategoryOverrides() {
  return useQuery({
    queryKey: limiterKeys.overrides,
    queryFn: fetchCategoryOverrides,
    staleTime: 24 * 60 * 60_000,
  });
}

export function useLimits() {
  return useQuery({ queryKey: limiterKeys.limits, queryFn: fetchLimits });
}

/**
 * Mount once (e.g. in the (tabs) layout). Whenever limits, installed apps
 * or overrides change, the phone's copy of the rules is refreshed.
 */
export function useLimitSync() {
  const limits = useLimits();
  const apps = useInstalledApps();
  const overrides = useCategoryOverrides();

  useEffect(() => {
    if (!isLimiterAvailable || !limits.data || !apps.data) return;
    syncLimitsToDevice(limits.data, apps.data, overrides.data ?? {});
  }, [limits.data, apps.data, overrides.data]);
}
