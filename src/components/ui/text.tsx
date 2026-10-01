import { createContext, useContext } from "react";
import { Text as RNText, type TextProps } from "react-native";
import { FONT_FAMILY } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Lets a parent (Button, Chip) style the Text inside it, react-native-reusables style. */
export const TextClassContext = createContext<string | undefined>(undefined);

const WEIGHT = /\bfont-(normal|medium|semibold|bold|extrabold)\b/g;

/**
 * Picks the Plus Jakarta Sans file for the last `font-*` weight class. Android can't synthesise
 * weights for custom fonts, so each weight is its own family and fontWeight is reset to normal.
 */
export function fontFamilyFor(className: string) {
  const weight = [...className.matchAll(WEIGHT)].at(-1)?.[1] ?? "normal";
  return FONT_FAMILY[weight as keyof typeof FONT_FAMILY];
}

export function Text({ className, style, ...props }: TextProps) {
  const contextClass = useContext(TextClassContext);
  const merged = cn("text-body text-foreground", contextClass, className);
  return (
    <RNText
      className={merged}
      style={[style, { fontFamily: fontFamilyFor(merged), fontWeight: "normal" }]}
      {...props}
    />
  );
}
