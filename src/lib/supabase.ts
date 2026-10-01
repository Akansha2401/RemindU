import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

import "expo-sqlite/localStorage/install";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE: OAuth redirects return a one-time code instead of tokens in the URL.
    flowType: "pkce",
  },
});
