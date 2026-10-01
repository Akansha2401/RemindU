import { createContext, useContext } from "react";
import { Text as RNText, type TextProps } from "react-native";
import { cn } from "@/lib/utils";

/** Lets a parent (Button, Chip) style the Text inside it, react-native-reusables style. */
export const TextClassContext = createContext<string | undefined>(undefined);

export function Text({ className, ...props }: TextProps) {
  const contextClass = useContext(TextClassContext);
  return <RNText className={cn("text-base text-foreground", contextClass, className)} {...props} />;
}
