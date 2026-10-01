import type { Guard, GuardApp, PermissionStatus, SessionState } from "@/types/guard";

const MOCK_APPS: GuardApp[] = [
  { packageName: "com.instagram.android", label: "Instagram", category: "social", iconBase64: null },
  { packageName: "com.google.android.youtube", label: "YouTube", category: "video", iconBase64: null },
  { packageName: "com.snapchat.android", label: "Snapchat", category: "social", iconBase64: null },
  { packageName: "com.reddit.frontpage", label: "Reddit", category: "social", iconBase64: null },
  { packageName: "in.mohalla.sharechat", label: "ShareChat", category: "social", iconBase64: null },
  { packageName: "com.whatsapp", label: "WhatsApp", category: "social", iconBase64: null },
  { packageName: "com.netflix.mediaclient", label: "Netflix", category: "video", iconBase64: null },
  { packageName: "com.supercell.clashofclans", label: "Clash of Clans", category: "games", iconBase64: null },
  { packageName: "com.google.android.apps.docs", label: "Docs", category: "productivity", iconBase64: null },
];

/**
 * In-memory guard matching the BRD 11.4 contract. "Opening" a permission grants it,
 * so the onboarding flow can be clicked through without the native module.
 */
export function createMockGuard(): Guard {
  const permissions: PermissionStatus = { usage: false, overlay: false, notifications: false, battery: false };
  let session: SessionState | null = null;

  return {
    isNative: false,
    async startSession(config) {
      session = { ...config, remainingSec: config.budgetSec, foregroundPackage: null, startedAt: Date.now() };
    },
    async updateSession(patch) {
      if (session) session = { ...session, ...patch };
    },
    async endSession() {
      session = null;
    },
    async resolveCheckin() {},
    async getState() {
      return session;
    },
    async getInstalledApps() {
      return MOCK_APPS;
    },
    async getPermissionStatus() {
      return { ...permissions };
    },
    openPermissionSettings(kind) {
      permissions[kind] = true;
    },
  };
}
