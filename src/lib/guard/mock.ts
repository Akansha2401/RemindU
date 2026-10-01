import type { AppSession, Guard, GuardApp, PermissionStatus } from "@/types/guard";

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
 * In-memory guard for Expo Go / iOS / web. "Opening" a permission grants it, so the flow
 * can be clicked through. There's no foreground-app detection, so timers stay waiting and
 * there is no screen time.
 */
export function createMockGuard(): Guard {
  const permissions: PermissionStatus = { usage: false, overlay: false, notifications: false, battery: false };
  let sessions: AppSession[] = [];

  return {
    isNative: false,
    async addSessions(configs) {
      const pkgs = new Set(configs.map((c) => c.packageName));
      sessions = [
        ...sessions.filter((s) => !pkgs.has(s.packageName)),
        ...configs.map((c) => ({
          ...c,
          remainingSec: c.budgetSec,
          createdAt: Date.now(),
          startedAt: null,
          status: "waiting" as const,
          checkIns: 0,
          logs: [],
        })),
      ];
    },
    async getSessions() {
      return sessions;
    },
    async continueSession(id, budgetSec) {
      sessions = sessions.map((s) =>
        s.sessionId === id ? { ...s, remainingSec: budgetSec, status: "paused", checkIns: s.checkIns + 1 } : s,
      );
      return sessions.find((s) => s.sessionId === id) ?? null;
    },
    async endSession(id) {
      const ended = sessions.find((s) => s.sessionId === id) ?? null;
      sessions = sessions.filter((s) => s.sessionId !== id);
      return ended;
    },
    async getScreenTime() {
      return [];
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
