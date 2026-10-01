import { View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { ChartBar } from "@/types/stats";
import { Text } from "../ui/text";

type BarChartProps = {
  bars: ChartBar[];
  height?: number;
  /** Highlights one bar (e.g. today). */
  highlightKey?: string;
  formatValue: (ms: number) => string;
};

/** Simple vertical bars with a label under each; the tallest bar's value sits on top. */
export function BarChart({ bars, height = 140, highlightKey, formatValue }: BarChartProps) {
  const theme = useTheme();
  const max = Math.max(...bars.map((b) => b.ms), 1);
  const dense = bars.length > 12;
  return (
    <View accessibilityRole="image" className="flex-row items-end" style={{ height: height + 22, gap: dense ? 2 : 8 }}>
      {bars.map((b) => {
        const h = b.ms > 0 ? Math.max(4, (b.ms / max) * height) : 3;
        const isMax = b.ms === max && b.ms > 0;
        return (
          <View key={b.key} className="flex-1 items-center justify-end" style={{ height: height + 22 }}>
            {isMax && !dense ? (
              <Text numberOfLines={1} className="mb-1 text-[10px] font-bold text-muted-foreground">
                {formatValue(b.ms)}
              </Text>
            ) : null}
            <View
              style={{
                height: h,
                width: "100%",
                borderRadius: dense ? 2 : 6,
                backgroundColor: b.ms > 0 ? (b.key === highlightKey ? theme.primary : theme.secondary) : theme.muted,
                opacity: b.ms > 0 && b.key !== highlightKey ? 0.85 : 1,
              }}
            />
            <Text numberOfLines={1} className="mt-1 h-4 text-[10px] text-muted-foreground">
              {b.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
