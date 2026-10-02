import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from "expo-router/react-navigation";

/** JS mirror of the CSS variables in src/global.css (DESIGN.md: warm off-white editorial). Keep them in sync. */
export const THEME = {
  light: {
    background: "#F7F7F5",
    foreground: "#18181B",
    card: "#FFFFFF",
    primary: "#FF5A5F",
    primaryForeground: "#FFFFFF",
    primaryHover: "#FA4F54",
    secondary: "#18181B",
    secondaryForeground: "#FFFFFF",
    muted: "#F4F4F5",
    mutedForeground: "#71717A",
    accent: "#FDECEC",
    accentForeground: "#C4383E",
    destructive: "#C2413B",
    border: "#EDEDEA",
    label: "#3F3F46",
    body: "#52525B",
    takeover: "#18181B",
    switchOff: "#D4D4D8",
    dashed: "#D4D4D8",
    success: "#5E7D70",
    successBg: "#E6EEEA",
    errorBg: "#FBEAEA",
  },
  dark: {
    background: "#121214",
    foreground: "#F4F4F5",
    card: "#1C1C1F",
    primary: "#FF5A5F",
    primaryForeground: "#FFFFFF",
    primaryHover: "#FF7377",
    secondary: "#F4F4F5",
    secondaryForeground: "#18181B",
    muted: "#27272A",
    mutedForeground: "#A1A1AA",
    accent: "#3A1D1F",
    accentForeground: "#FFD9DA",
    destructive: "#EF8A84",
    border: "#27272A",
    label: "#D4D4D8",
    body: "#A1A1AA",
    takeover: "#09090B",
    switchOff: "#3F3F46",
    dashed: "#52525B",
    success: "#8FB0A2",
    successBg: "#1F2B26",
    errorBg: "#3A1F1E",
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

/**
 * Font family per weight; Android needs a separate family for each weight of a custom font.
 * Inter Medium is the workhorse; `extrabold` is repurposed for Inter Tight Medium (display titles
 * and numerals); bold is for the tracked uppercase eyebrows only.
 */
export const FONT_FAMILY = {
  normal: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extrabold: "InterTight_500Medium",
} as const;

/** Soft elevation tiers from DESIGN.md (iOS shadow props + Android elevation). */
export const SHADOW = {
  card: { shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 30, shadowOffset: { width: 0, height: 8 }, elevation: 1 },
  badge: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  nav: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 40, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  cta: { shadowColor: "#FF5A5F", shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
} as const;
