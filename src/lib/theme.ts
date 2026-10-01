import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from "expo-router/react-navigation";

/** JS mirror of the CSS variables in src/global.css (RemindU Design System v1). Keep them in sync. */
export const THEME = {
  light: {
    background: "#F4E8DE",
    foreground: "#241A12",
    card: "#FFFFFF",
    primary: "#E8703A",
    primaryForeground: "#FFFFFF",
    primaryHover: "#C85A2A",
    secondary: "#3E2416",
    secondaryForeground: "#FFFFFF",
    muted: "#EAE1D6",
    mutedForeground: "#8C7C70",
    accent: "#F7D9C0",
    accentForeground: "#8A5A3A",
    destructive: "#A0453E",
    border: "#EFE6DC",
    label: "#4A3A2C",
    body: "#5A4636",
    takeover: "#2A1B10",
    switchOff: "#DCD2C6",
    dashed: "#C9BBAE",
    success: "#5B7A2E",
    successBg: "#E8F0D8",
    errorBg: "#F2E4E4",
  },
  dark: {
    background: "#1F150D",
    foreground: "#F4E8DE",
    card: "#2F251E",
    primary: "#E8703A",
    primaryForeground: "#FFFFFF",
    primaryHover: "#F08A58",
    secondary: "#F4E8DE",
    secondaryForeground: "#3E2416",
    muted: "#3A312A",
    mutedForeground: "#B3A496",
    accent: "#4B2917",
    accentForeground: "#F7D9C0",
    destructive: "#E0857C",
    border: "#3A312A",
    label: "#D4C8BF",
    body: "#BFB3AA",
    takeover: "#140C06",
    switchOff: "#504842",
    dashed: "#625B56",
    success: "#A9C77A",
    successBg: "#2E3A1E",
    errorBg: "#46231C",
  },
};

export const NAV_THEME: Record<"light" | "dark", Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.background,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.background,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};

/** Font family per weight; Android needs a separate family for each weight of a custom font. */
export const FONT_FAMILY = {
  normal: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;
