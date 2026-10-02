import { useEffect } from "react";
import { Stack, ThemeProvider } from "expo-router";
import "../global.css";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { InterTight_500Medium } from "@expo-google-fonts/inter-tight/500Medium";
import { useValue } from "@legendapp/state/react";
import { authStore$ } from "@/store/auth.store";
import { prefs$ } from "@/store/prefs.store";
import { PortalHost } from "@rn-primitives/portal";
import { NAV_THEME } from "@/lib/theme";
import { useColorScheme } from "nativewind";
import { StatusBar } from "expo-status-bar";
import { AppStateStatus, Platform } from "react-native";
import { focusManager, QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import { useOnlineManager } from "@/hooks/useOnlineManager";
import { useAppState } from "@/hooks/useAppState";

SplashScreen.preventAutoHideAsync();

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

export default function RootLayout() {
  const isLoggedIn = useValue(authStore$.isLoggedIn);
  const themePref = useValue(prefs$.theme);
  const { colorScheme, setColorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";

  // Inter 400–700 + Inter Tight Medium (DESIGN.md). Keep the splash up until loaded.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    InterTight_500Medium,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Settings > Dark mode: system, light or dark.
  useEffect(() => {
    setColorScheme(themePref);
  }, [themePref, setColorScheme]);

  useOnlineManager();

  useAppState(onAppStateChange);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={NAV_THEME[scheme]}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Onboarding and sign-in until there's a Supabase session */}
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>

          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="add"
              options={{ presentation: "transparentModal", animation: "fade", contentStyle: { backgroundColor: "transparent" } }}
            />
            <Stack.Screen
              name="session/[id]"
              // The service re-opens the same timer while its app stays open; don't stack copies.
              dangerouslySingular={(_, params) => String(params.id)}
              options={{ animation: "fade" }}
            />
            <Stack.Screen name="goals/new" options={{ presentation: "modal" }} />
            <Stack.Screen name="settings/index" />
            <Stack.Screen name="settings/account" />
            <Stack.Screen name="settings/help" />
            <Stack.Screen name="settings/permissions" />
            <Stack.Screen name="trial" options={{ presentation: "modal" }} />
            <Stack.Screen name="attribution" options={{ presentation: "modal", gestureEnabled: false }} />
            <Stack.Screen name="limits/new" options={{ headerShown: true, title: "New limit" }} />
            <Stack.Screen
              name="limits/permissions"
              options={{ headerShown: true, title: "Permissions" }}
            />
          </Stack.Protected>

          {/* Outside the auth guards: the native limiter service can open it anytime */}
          <Stack.Screen
            name="gate"
            dangerouslySingular // reuse one gate screen instead of stacking a new one per open
            options={{
              presentation: "fullScreenModal",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="auth/callback" />
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
