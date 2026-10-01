import { View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { HeatCell, HeatLevel } from "@/types/stats";
import { Text } from "../ui/text";

const OPACITY: Record<HeatLevel, number> = { 0: 1, 1: 0.3, 2: 0.5, 3: 0.75, 4: 1 };
const CELL = 13;
const GAP = 3;

/** GitHub-style contribution grid: one column per week, Sunday on top. */
export function Heatmap({ weeks, lessLabel, moreLabel }: { weeks: HeatCell[][]; lessLabel: string; moreLabel: string }) {
  const theme = useTheme();
  const color = (level: HeatLevel) => (level === 0 ? theme.muted : theme.primary);
  return (
    <View>
      <View accessibilityRole="image" className="flex-row self-center" style={{ gap: GAP }}>
        {weeks.map((week) => (
          <View key={week[0].date} style={{ gap: GAP }}>
            {week.map((c) => (
              <View
                key={c.date}
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: 3,
                  backgroundColor: c.future ? "transparent" : color(c.level),
                  opacity: c.future ? 1 : OPACITY[c.level],
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <View className="mt-3 flex-row items-center justify-end gap-1">
        <Text className="mr-1 text-[10px] text-muted-foreground">{lessLabel}</Text>
        {([0, 1, 2, 3, 4] as const).map((l) => (
          <View key={l} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color(l), opacity: OPACITY[l] }} />
        ))}
        <Text className="ml-1 text-[10px] text-muted-foreground">{moreLabel}</Text>
      </View>
    </View>
  );
}

/** How many week columns fit in a given width. */
export function weeksThatFit(width: number) {
  return Math.max(8, Math.floor((width + GAP) / (CELL + GAP)));
}
