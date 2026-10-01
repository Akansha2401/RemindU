import { View } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

const TONES = {
  counting: { box: "bg-accent", text: "text-accent-foreground" },
  success: { box: "bg-success-bg", text: "text-success" },
  error: { box: "bg-error-bg", text: "text-destructive" },
  neutral: { box: "bg-muted", text: "text-muted-foreground" },
} as const;

/** Tinted fill with darker same-hue text; never a solid saturated fill. */
export type StatusTone = keyof typeof TONES;

export function StatusPill({ label, tone, className }: { label: string; tone: StatusTone; className?: string }) {
  return (
    <View className={cn("self-center rounded-full px-3.5 py-1.5", TONES[tone].box, className)}>
      <Text className={cn("text-caption font-bold", TONES[tone].text)}>{label}</Text>
    </View>
  );
}
