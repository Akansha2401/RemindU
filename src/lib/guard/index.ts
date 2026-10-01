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

/** Backed by the app-limiter module: installed apps, permissions and the focus session engine. */
function createNativeGuard(): Guard {
  const openers: Record<PermissionKind, () => void | Promise<void>> = {
    usage: AppLimiter.openUsageAccessSettings,
    overlay: AppLimiter.openOverlaySettings,
    battery: AppLimiter.openBatterySettings,
    notifications: requestNotifications,
  };

  return {
    isNative: true,
    async startSession(config) {
      AppLimiter.startFocusSession({ ...config, everyHours: config.everyHours ?? 1 });
    },
    async updateSession() {
      // Mid-session edits aren't supported by the native engine yet.
    },
    async endSession() {
      AppLimiter.endFocusSession();
    },
    async continueSession(budgetSec) {
      return AppLimiter.continueFocusSession(budgetSec);
    },
    async getState() {
      return AppLimiter.getFocusSession();
    },
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
