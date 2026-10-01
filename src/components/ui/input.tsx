import { TextInput, type TextInputProps } from "react-native";
import { FONT_FAMILY } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** White field on cream, 16px radius, hairline shadow (RemindU Design System v1). */
export function Input({ className, style, ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn(
        "rounded-input bg-card px-4 py-3.5 text-body text-foreground shadow-sm shadow-black/5",
        className,
      )}
      placeholderClassName="text-muted-foreground"
      style={[style, { fontFamily: FONT_FAMILY.normal }]}
      {...props}
    />
  );
}
