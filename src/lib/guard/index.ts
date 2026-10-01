import { Linking, PermissionsAndroid, Platform } from "react-native";
import { AppLimiter, isLimiterAvailable } from "@modules/app-limiter";
import type { Guard, PermissionKind } from "@/types/guard";
import { createMockGuard } from "./mock";

const needsNotificationPrompt = Platform.OS === "android" && Number(Platform.Version) >= 33;

async function hasNotifications() {
  if (!needsNotificationPrompt) return true;
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
}

async function requestNotifications() {
  if (!needsNotificationPrompt) return;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  // After "Don't ask again" Android won't show the prompt; send them to the app's settings page.
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) await Linking.openSettings();
}

/**
 * BRD 11.4 contract backed by the app-limiter module for apps and permissions.
 * The session engine (start/update/end/check-ins) isn't native yet, so those calls use the mock.
 */
function createNativeGuard(): Guard {
  const sessions = createMockGuard();
  const openers: Record<PermissionKind, () => void | Promise<void>> = {
    usage: AppLimiter.openUsageAccessSettings,
    overlay: AppLimiter.openOverlaySettings,
    battery: AppLimiter.openBatterySettings,
    notifications: requestNotifications,
  };

  return {
    ...sessions,
    isNative: true,
    async getInstalledApps() {
      const apps = await AppLimiter.getInstalledApps(true);
      return apps.map((a) => ({
        packageName: a.packageName,
        label: a.label,
        category: a.category,
        iconBase64: a.icon,
      }));
    },
    async getPermissionStatus() {
      const p = AppLimiter.permissions();
      return {
        usage: p.usageAccess,
        overlay: p.overlay,
        battery: p.battery,
        notifications: await hasNotifications(),
      };
    },
    openPermissionSettings(kind) {
      return openers[kind]();
    },
  };
}

export const guard: Guard = isLimiterAvailable ? createNativeGuard() : createMockGuard();

export const REQUIRED_PERMISSIONS: readonly PermissionKind[] = ["usage", "overlay", "notifications"];
