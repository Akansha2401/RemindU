import { Pressable, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { HeatCell, HeatLevel } from "@/types/stats";
import { Text } from "../ui/text";

const OPACITY: Record<HeatLevel, number> = { 0: 1, 1: 0.3, 2: 0.5, 3: 0.75, 4: 1 };
const CELL = 13;
const GAP = 3;
const STEP = CELL + GAP;
const DAY_COLUMN = 28;
const MONTH_ROW = 16;

type HeatmapProps = {
  weeks: HeatCell[][];
  /** Week columns where a month starts, with its label (GitHub's month row). */
  months: { week: number; label: string }[];
  /** Sunday-first labels; only Mon, Wed and Fri are shown, like GitHub. */
  dayLabels: readonly string[];
  today: string;
  selected: string | null;
  onSelect: (date: string) => void;
  cellLabel: (cell: HeatCell) => string;
  lessLabel: string;
  moreLabel: string;
};

/**
 * GitHub-style grid: one column per week (Sunday on top), month labels above, Mon/Wed/Fri on the
 * left. Days within the limits are coral (darker = used less); over the limits stays grey, and
 * days without a timer are fainter still.
 */
export function Heatmap(props: HeatmapProps) {
  const { weeks, months, dayLabels, today, selected, onSelect, cellLabel } = props;
  const theme = useTheme();
  const color = (level: HeatLevel) => (level === 0 ? theme.muted : theme.primary);
  const fill = (c: HeatCell) => ({
    backgroundColor: color(c.level),
    opacity: c.status === "none" ? 0.45 : OPACITY[c.level],
  });

  return (
    <View>
      <View className="flex-row">
        <View style={{ width: DAY_COLUMN, paddingTop: MONTH_ROW, gap: GAP }}>
          {dayLabels.map((d, i) => (
            <Text key={d} style={{ height: CELL, lineHeight: CELL }} className="text-[10px] text-muted-foreground">
              {i % 2 === 1 ? d : ""}
            </Text>
          ))}
        </View>
        <View>
          <View style={{ height: MONTH_ROW }}>
            {months.map((m) => (
              <Text
                key={`${m.week}-${m.label}`}
                style={{ position: "absolute", left: m.week * STEP }}
                className="text-[10px] text-muted-foreground"
              >
                {m.label}
              </Text>
            ))}
          </View>
          <View accessibilityRole="image" className="flex-row" style={{ gap: GAP }}>
            {weeks.map((week) => (
              <View key={week[0].date} style={{ gap: GAP }}>
                {week.map((c) =>
                  c.future ? (
                    <View key={c.date} style={{ width: CELL, height: CELL }} />
                  ) : (
                    <Pressable
                      key={c.date}
                      accessibilityRole="button"
                      accessibilityLabel={cellLabel(c)}
                      accessibilityState={{ selected: selected === c.date }}
                      onPress={() => onSelect(c.date)}
                      hitSlop={1}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        ...fill(c),
                        // Selected day: solid ring; today: a lighter one, like GitHub.
                        borderWidth: selected === c.date ? 2 : c.date === today ? 1 : 0,
                        borderColor: selected === c.date ? theme.foreground : theme.mutedForeground,
                      }}
                    />
                  ),
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
      <View className="mt-3 flex-row items-center justify-end gap-1">
        <Text className="mr-1 text-[10px] text-muted-foreground">{props.lessLabel}</Text>
        {([0, 1, 2, 3, 4] as const).map((l) => (
          <View key={l} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color(l), opacity: OPACITY[l] }} />
        ))}
        <Text className="ml-1 text-[10px] text-muted-foreground">{props.moreLabel}</Text>
      </View>
    </View>
  );
}

/** How many week columns fit beside the weekday labels in a given width. */
export function weeksThatFit(width: number) {
  return Math.max(8, Math.floor((width - DAY_COLUMN + GAP) / STEP));
}
