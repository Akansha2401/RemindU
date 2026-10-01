import { useEffect } from "react";
import { Stack, ThemeProvider } from "expo-router";
import "../global.css";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";
import { useValue } from "@legendapp/state/react";
import { authStore$ } from "@/store/auth.store";
import { PortalHost } from "@rn-primitives/portal";
import { NAV_THEME } from "@/lib/theme";
import { useColorScheme } from "nativewind";
import { StatusBar } from "expo-status-bar";
import { AppStateStatus, Platform } from "react-native";
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useOnlineManager } from "@/hooks/useOnlineManager";
import { useAppState } from "@/hooks/useAppState";

SplashScreen.preventAutoHideAsync();

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2 } },
});

export default function RootLayout() {
  const isLoggedIn = useValue(authStore$.isLoggedIn);
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";

  // Plus Jakarta Sans 400–800 (RemindU Design System v1). Keep the splash up until loaded.
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

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
            <Stack.Screen name="edit-apps" />
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
          <PortalHost />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
