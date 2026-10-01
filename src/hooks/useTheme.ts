import { useColorScheme } from "nativewind";
import { THEME } from "@/lib/theme";

/** Current palette as JS colours, for props that can't take a className (SVG strokes, placeholders). */
export function useTheme() {
  const { colorScheme } = useColorScheme();
  return THEME[colorScheme === "dark" ? "dark" : "light"];
}
