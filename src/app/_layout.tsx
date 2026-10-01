import { Stack, ThemeProvider } from "expo-router";
import "../global.css";
import { useValue } from "@legendapp/state/react";
import { authStore$ } from "@/store/auth.store";
import { PortalHost } from "@rn-primitives/portal";
import { NAV_THEME } from "@/lib/theme";
import { colorScheme } from "nativewind";
import { StatusBar } from "expo-status-bar";
import { AppStateStatus, Platform } from "react-native";
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useOnlineManager } from "@/hooks/useOnlineManager";
import { useAppState } from "@/hooks/useAppState";

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

  useOnlineManager();

  useAppState(onAppStateChange);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={NAV_THEME[colorScheme.get() ?? "light"]}>
        <StatusBar style={colorScheme.get() === "dark" ? "light" : "dark"} />
        <Stack>
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />
          </Stack.Protected>

          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen name="limits/new" options={{ title: "New limit" }} />
            <Stack.Screen
              name="limits/permissions"
              options={{ title: "Permissions" }}
            />
          </Stack.Protected>

          {/* Outside the auth guards: the native limiter service can open it anytime */}
          <Stack.Screen
            name="gate"
            dangerouslySingular // reuse one gate screen instead of stacking a new one per open
            options={{
              headerShown: false,
              presentation: "fullScreenModal",
              gestureEnabled: false,
            }}
          />
          <PortalHost />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
