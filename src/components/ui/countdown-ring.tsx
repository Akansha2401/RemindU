import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";

type CountdownRingProps = {
  /** 0 to 1, how much of the budget is left. */
  progress: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
};

/** Terracotta ring on a faint espresso track (RemindU Design System v1). */
export function CountdownRing({ progress, size = 240, stroke = 12, children }: CountdownRingProps) {
  const theme = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.muted} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - p)}
          fill="none"
        />
      </Svg>
      {children}
    </View>
  );
}
