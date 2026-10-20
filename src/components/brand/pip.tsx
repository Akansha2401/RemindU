import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

/**
 * Pip, the RemindU nudge bird. Same artwork as assets/brand/pip-*.svg (1024 box, body centred at 490,560).
 * `coral` is the brand mascot on paper or zinc; `white` sits on the coral launch screen.
 */
type Tone = "coral" | "white";

const PALETTE: Record<Tone, { body: string; shade: string; blush: string; blushOpacity: number }> = {
  coral: { body: "#FF5A5F", shade: "#E8474D", blush: "#FDECEC", blushOpacity: 0.55 },
  white: { body: "#FFFFFF", shade: "#FDECEC", blush: "#FF5A5F", blushOpacity: 0.3 },
};
const BEAK = "#F3CF58";
const INK = "#18181B";

// Wing at rest (folded on the body) or raised in a wave, and the shoulder it pivots on when flapping.
const WING = {
  rest: { cx: 420, cy: 618, rx: 112, ry: 70, rotate: -20, origin: "51% 57%" },
  wave: { cx: 296, cy: 446, rx: 110, ry: 54, rotate: 58, origin: "35% 53%" },
};

export type PipProps = {
  size: number;
  tone?: Tone;
  /** Raise the wing in a wave. */
  wave?: boolean;
  /** Flap the wing continuously (for the launch animation). */
  flap?: boolean;
};

export function Pip({ size, tone = "coral", wave = false, flap = false }: PipProps) {
  const c = PALETTE[tone];
  const w = wave ? WING.wave : WING.rest;
  const beat = useSharedValue(0);

  useEffect(() => {
    if (!flap) return;
    beat.value = withRepeat(withTiming(1, { duration: 200, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(beat);
  }, [flap, beat]);

  const wingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flap ? 14 - 42 * beat.value : 0}deg` }],
  }));

  return (
    <View style={{ width: size, height: size }} accessible={false}>
      <Svg width={size} height={size} viewBox="0 0 1024 1024">
        <Path d="M276 560 L196 500 Q192 590 262 634 Z" fill={c.shade} />
        <Ellipse cx={500} cy={296} rx={22} ry={56} transform="rotate(-22 500 296)" fill={c.body} />
        <Ellipse cx={550} cy={292} rx={20} ry={48} transform="rotate(18 550 292)" fill={c.body} />
        <Circle cx={490} cy={560} r={250} fill={c.body} />
        <Path d="M716 520 Q822 554 716 594 Z" fill={BEAK} />
        <Circle cx={556} cy={500} r={38} fill={INK} />
        <Circle cx={652} cy={496} r={34} fill={INK} />
        <Circle cx={568} cy={486} r={12} fill="#FFFFFF" />
        <Circle cx={662} cy={484} r={11} fill="#FFFFFF" />
        <Ellipse cx={560} cy={576} rx={26} ry={13} fill={c.blush} opacity={c.blushOpacity} />
        <Ellipse cx={672} cy={572} rx={22} ry={12} fill={c.blush} opacity={c.blushOpacity} />
      </Svg>
      {/* The wing is its own layer so it can rotate around the shoulder. */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transformOrigin: w.origin }, wingStyle]}>
        <Svg width={size} height={size} viewBox="0 0 1024 1024">
          <Ellipse
            cx={w.cx}
            cy={w.cy}
            rx={w.rx}
            ry={w.ry}
            transform={`rotate(${w.rotate} ${w.cx} ${w.cy})`}
            fill={c.shade}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
