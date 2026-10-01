import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

/** Raw categories that come from Android's ApplicationInfo.category */
export type NativeCategory =
  | "games"
  | "social"
  | "video"
  | "audio"
  | "photos"
  | "news"
  | "maps"
  | "productivity"
  | "other";

export type InstalledApp = {
  packageName: string;
  label: string;
  category: NativeCategory;
  isSystem: boolean;
  icon: string | null; // data:image/png;base64,...
};

/** Shape the native side enforces. Keep it small: the phone doesn't need anything else. */
export type NativeRule = {
  id: string;
  name: string;
  packages: string[];
  sessionsPerDay: number;
  sessionMinutes: number;
  enabled: boolean;
};

export type RuleState = {
  ruleId: string;
  name: string;
  sessionsPerDay: number;
  sessionMinutes: number;
  used: number;
  activeUntil: number; // epoch ms, 0 = none today
  date: string;
};

type AppLimiterNative = {
  getInstalledApps(includeIcons: boolean): Promise<InstalledApp[]>;
  getAppInfo(pkg: string): Promise<InstalledApp | null>;
  hasUsageAccess(): boolean;
  canDrawOverlays(): boolean;
  isIgnoringBatteryOptimizations(): boolean;
  openUsageAccessSettings(): void;
  openOverlaySettings(): void;
  openBatterySettings(): void;
  setRules(json: string): void;
  getRuleState(ruleId: string): RuleState | null;
  startSession(ruleId: string): RuleState | null;
  endSession(ruleId: string): void;
  startMonitoring(): void;
  stopMonitoring(): void;
  isMonitoring(): boolean;
  openApp(pkg: string): boolean;
  goHome(): void;
};

// Optional so iOS / web / Expo Go don't crash on import.
const Native =
  Platform.OS === "android"
    ? requireOptionalNativeModule<AppLimiterNative>("AppLimiter")
    : null;

export const isLimiterAvailable = Native != null;

function native(): AppLimiterNative {
  if (!Native) {
    throw new Error("AppLimiter needs an Android development build (not Expo Go).");
  }
  return Native;
}

export const AppLimiter = {
  getInstalledApps: (includeIcons = true) => native().getInstalledApps(includeIcons),
  getAppInfo: (pkg: string) => native().getAppInfo(pkg),

  permissions: () => ({
    usageAccess: native().hasUsageAccess(),
    overlay: native().canDrawOverlays(),
    battery: native().isIgnoringBatteryOptimizations(),
  }),
  openUsageAccessSettings: () => native().openUsageAccessSettings(),
  openOverlaySettings: () => native().openOverlaySettings(),
  openBatterySettings: () => native().openBatterySettings(),

  setRules: (rules: NativeRule[]) => native().setRules(JSON.stringify(rules)),
  getRuleState: (ruleId: string) => native().getRuleState(ruleId),
  startSession: (ruleId: string) => native().startSession(ruleId),
  endSession: (ruleId: string) => native().endSession(ruleId),

  startMonitoring: () => native().startMonitoring(),
  stopMonitoring: () => native().stopMonitoring(),
  isMonitoring: () => native().isMonitoring(),

  openApp: (pkg: string) => native().openApp(pkg),
  goHome: () => native().goHome(),
};
