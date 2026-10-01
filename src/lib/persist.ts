import { observablePersistSqlite } from "@legendapp/state/persist-plugins/expo-sqlite";
import Storage from "expo-sqlite/kv-store";

/**
 * Shared Legend State persistence plugin. Reads are synchronous, so persisted
 * stores are populated before the first render (no flash of default state).
 */
export const persistPlugin = observablePersistSqlite(Storage);
