import { View } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

const TONES = {
  counting: { box: "bg-accent", text: "text-accent-foreground" },
  success: { box: "bg-success-bg", text: "text-success" },
  error: { box: "bg-error-bg", text: "text-destructive" },
} as const;

/** Tinted fill with darker same-hue text; never a solid saturated fill. */
export function StatusPill({ label, tone }: { label: string; tone: keyof typeof TONES }) {
  return (
    <View className={cn("self-center rounded-full px-3.5 py-1.5", TONES[tone].box)}>
      <Text className={cn("text-caption font-bold", TONES[tone].text)}>{label}</Text>
    </View>
  );
}
