import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { Text } from "@/components/ui/text";
import { strings } from "@/constants/strings";
import { Pip } from "./pip";

/**
 * Animated launch screen that takes over from the native splash (app.json → expo-splash-screen).
 * Pip starts exactly where the native splash image sits (same size, centred), so the hand-off is
 * seamless; then clouds drift past, the blocked-app tiles bounce in and get their ✕, and Pip flies
 * off to reveal the app underneath. Tap anywhere to skip. Plays once per cold start.
 */

/** Must match imageWidth in app.json; splash-icon.png draws Pip at 90% of that box. */
export const SPLASH_IMAGE_WIDTH = 200;
const PIP_SIZE = SPLASH_IMAGE_WIDTH * 0.9;

const HOLD_MS = 2200; // scene fully built, then the exit starts
const EXIT_MS = 700;

const COLORS = {
  light: { bg: "#FF5A5F", cloud: "#FF7A7E", spark: "#FFFFFF", tile: "#FFFFFF", glyph: "#18181B", badge: "#18181B", tagline: "#18181B", streak: "rgba(255,255,255,0.7)" },
  dark: { bg: "#18181B", cloud: "#232326", spark: "#F3CF58", tile: "#27272A", glyph: "#E4E4E7", badge: "#FF5A5F", tagline: "#A1A1AA", streak: "rgba(255,90,95,0.6)" },
};
type Palette = (typeof COLORS)["light"];

// Deep links from the limiter service (and the OAuth redirect) skip the intro.
const SKIP_PATHS = /^(gate|session|auth)/;
let played = false;

function launchedByDeepLink() {
  const url = Linking.getLinkingURL();
  if (!url) return false;
  try {
    return SKIP_PATHS.test(Linking.parse(url).path ?? "");
  } catch {
    return false;
  }
}

/** Renders the intro over the app on the first mount of a cold start; nothing after that. */
export function AnimatedSplash({ scheme }: { scheme: "light" | "dark" }) {
  const [visible, setVisible] = useState(() => !played && !launchedByDeepLink());
  useEffect(() => {
    played = true;
  }, []);
  if (!visible) return null;
  return <Scene colors={COLORS[scheme]} onDone={() => setVisible(false)} />;
}

// ── Scene ────────────────────────────────────────────────────────────────────

type Glyph = "video" | "heart" | "chat" | "game" | "camera" | "music";

// Offsets from the screen centre, laid out on a 390pt-wide phone and scaled to the real width.
const TILES: { glyph: Glyph; x: number; y: number; tilt: number }[] = [
  { glyph: "video", x: -161, y: -246, tilt: -12 },
  { glyph: "heart", x: 105, y: -208, tilt: 10 },
  { glyph: "chat", x: -173, y: -18, tilt: 8 },
  { glyph: "game", x: 119, y: -12, tilt: -10 },
  { glyph: "camera", x: -137, y: 140, tilt: 6 },
  { glyph: "music", x: 77, y: 148, tilt: -8 },
];

const CLOUDS = [
  { top: 0.07, w: 210, speed: 16000, start: 0.15, opacity: 1 },
  { top: 0.18, w: 140, speed: 14000, start: 0.75, opacity: 0.7 },
  { top: 0.31, w: 130, speed: 12000, start: 0.05, opacity: 1 },
  { top: 0.75, w: 140, speed: 20000, start: 0.55, opacity: 1 },
];

const SPARKS = [
  { x: 0.45, y: 0.15, size: 28, delay: 0 },
  { x: 0.28, y: 0.3, size: 18, delay: 500 },
  { x: 0.9, y: 0.37, size: 20, delay: 250 },
  { x: 0.49, y: 0.71, size: 16, delay: 700 },
  { x: 0.88, y: 0.63, size: 14, delay: 150 },
  { x: 0.08, y: 0.62, size: 16, delay: 400 },
];

function Scene({ colors, onDone }: { colors: Palette; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const sx = Math.min(width / 390, 1.2);

  const fade = useSharedValue(1); // whole overlay
  const exit = useSharedValue(0); // 0 → 1 drives tiles out and Pip off-screen
  const text = useSharedValue(reduceMotion ? 1 : 0);
  const exiting = useRef(false);

  const startExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    const outMs = reduceMotion ? 0 : EXIT_MS;
    exit.value = withTiming(1, { duration: outMs, easing: Easing.in(Easing.cubic) });
    fade.value = withDelay(outMs * 0.5, withTiming(0, { duration: 300 }, (done) => {
      if (done) scheduleOnRN(onDone);
    }));
  };

  useEffect(() => {
    if (!reduceMotion) text.value = withDelay(700, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }));
    const t = setTimeout(startExit, reduceMotion ? 900 : HOLD_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: text.value * (1 - exit.value),
    transform: [{ translateY: 16 * (1 - text.value) }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, zIndex: 100 }, rootStyle]}>
      <StatusBar style="light" />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={startExit}
        accessibilityRole="button"
        accessibilityLabel={strings.splash.skip}
      >
        {CLOUDS.map((c, i) => (
          <Cloud key={i} {...c} color={colors.cloud} screenWidth={width} screenHeight={height} still={reduceMotion} />
        ))}
        {SPARKS.map((s, i) => (
          <Sparkle key={i} {...s} color={colors.spark} screenWidth={width} screenHeight={height} still={reduceMotion} />
        ))}

        {TILES.map((t, i) => (
          <Tile
            key={t.glyph}
            {...t}
            index={i}
            colors={colors}
            left={width / 2 + t.x * sx}
            top={height / 2 + t.y * sx}
            exit={exit}
            still={reduceMotion}
          />
        ))}

        <FlyingPip
          left={width / 2 - PIP_SIZE / 2}
          top={height / 2 - PIP_SIZE / 2}
          screenWidth={width}
          exit={exit}
          streak={colors.streak}
          tone={colors.bg === COLORS.light.bg ? "white" : "coral"}
          still={reduceMotion}
        />

        <Animated.View style={[styles.text, { bottom: Math.max(64, height * 0.08) }, textStyle]}>
          <Text className="text-center font-bold text-white" style={styles.title}>
            {strings.splash.title}
          </Text>
          <Text className="text-center font-semibold" style={[styles.tagline, { color: colors.tagline }]}>
            {strings.splash.tagline}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ── Pip ──────────────────────────────────────────────────────────────────────

function FlyingPip({
  left, top, screenWidth, exit, streak, tone, still,
}: {
  left: number; top: number; screenWidth: number; exit: SharedValue<number>;
  streak: string; tone: "white" | "coral"; still: boolean;
}) {
  const bob = useSharedValue(0);
  const streaks = useSharedValue(0);

  useEffect(() => {
    if (still) return;
    bob.value = withRepeat(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }), -1, true);
    streaks.value = withDelay(250, withTiming(1, { duration: 300 }));
    return () => cancelAnimation(bob);
  }, [still, bob, streaks]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: exit.value * (screenWidth - left + 40) },
      { translateY: -14 * bob.value + 6 - exit.value * 160 },
      { rotate: `${-2 + 6 * bob.value - 8 * exit.value}deg` },
    ],
  }));
  const streakStyle = useAnimatedStyle(() => ({ opacity: streaks.value * 0.9 }));

  return (
    <Animated.View style={[{ position: "absolute", left, top, width: PIP_SIZE, height: PIP_SIZE }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, streakStyle]} pointerEvents="none">
        {[
          { x: -34, y: 0.43, w: 52 },
          { x: -58, y: 0.53, w: 72 },
          { x: -26, y: 0.63, w: 40 },
        ].map((s, i) => (
          <View
            key={i}
            style={{ position: "absolute", left: s.x * (PIP_SIZE / 240), top: PIP_SIZE * s.y, width: s.w * (PIP_SIZE / 240), height: 5, borderRadius: 3, backgroundColor: streak }}
          />
        ))}
      </Animated.View>
      <Pip size={PIP_SIZE} tone={tone} wave flap={!still} />
    </Animated.View>
  );
}

// ── Blocked-app tiles ────────────────────────────────────────────────────────

const TILE = 56;
const BADGE = 24;

function Tile({
  glyph, tilt, index, colors, left, top, exit, still,
}: {
  glyph: Glyph; tilt: number; index: number; colors: Palette;
  left: number; top: number; exit: SharedValue<number>; still: boolean;
}) {
  const pop = useSharedValue(still ? 1 : 0);
  const badge = useSharedValue(still ? 1 : 0);
  const float = useSharedValue(0);

  useEffect(() => {
    if (still) return;
    const delay = 250 + index * 110;
    // Bouncy entrance: overshoot, squash, settle.
    pop.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 170, mass: 0.8 }));
    badge.value = withDelay(delay + 320, withSequence(
      withTiming(1.4, { duration: 140, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 6, stiffness: 260 }),
    ));
    float.value = withDelay(delay + 500, withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(float);
  }, [still, index, pop, badge, float]);

  const tileStyle = useAnimatedStyle(() => {
    // Leave in the same order they arrived.
    const out = Math.min(1, Math.max(0, exit.value * 1.6 - index * 0.08));
    return {
      opacity: Math.min(1, pop.value * 1.5) * (1 - out),
      transform: [
        { translateY: 30 * (1 - pop.value) - 7 * float.value },
        { scale: pop.value * (1 - out) },
        { rotate: `${tilt}deg` },
      ],
    };
  });
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badge.value }] }));

  return (
    <Animated.View style={[{ position: "absolute", left, top, width: TILE, height: TILE }, tileStyle]}>
      <View style={[styles.tile, { backgroundColor: colors.tile }]}>
        <AppGlyph glyph={glyph} color={colors.glyph} cut={colors.tile} />
      </View>
      <Animated.View style={[styles.badge, { backgroundColor: colors.badge, borderColor: colors.bg }, badgeStyle]}>
        <Svg width={10} height={10} viewBox="0 0 10 10">
          <Path d="M1.5 1.5 L8.5 8.5 M8.5 1.5 L1.5 8.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** Generic category symbols (not real app logos): video, social, chat, games, camera, music. */
function AppGlyph({ glyph, color, cut }: { glyph: Glyph; color: string; cut: string }) {
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24">
      {glyph === "video" && (
        <>
          <Rect x={3} y={5} width={18} height={14} rx={4} fill={color} />
          <Path d="M10 9 L15.5 12 L10 15 Z" fill={cut} />
        </>
      )}
      {glyph === "heart" && (
        <Path d="M12 20 C5 15 3 11 3 8.5 C3 6 5 4 7.5 4 C9.3 4 10.8 5 12 6.6 C13.2 5 14.7 4 16.5 4 C19 4 21 6 21 8.5 C21 11 19 15 12 20 Z" fill={color} />
      )}
      {glyph === "chat" && (
        <>
          <Path d="M5 5 H19 Q21 5 21 7 V15 Q21 17 19 17 H10 L6 20.5 V17 H5 Q3 17 3 15 V7 Q3 5 5 5 Z" fill={color} />
          <Circle cx={8.5} cy={11} r={1.3} fill={cut} />
          <Circle cx={12} cy={11} r={1.3} fill={cut} />
          <Circle cx={15.5} cy={11} r={1.3} fill={cut} />
        </>
      )}
      {glyph === "game" && (
        <>
          <Path d="M7 8 H17 Q21 8 21.5 13 Q22 17.5 19 17.5 Q17.5 17.5 16 15 H8 Q6.5 17.5 5 17.5 Q2 17.5 2.5 13 Q3 8 7 8 Z" fill={color} />
          <Rect x={5.8} y={11.6} width={4} height={1.5} rx={0.6} fill={cut} />
          <Rect x={7.05} y={10.35} width={1.5} height={4} rx={0.6} fill={cut} />
          <Circle cx={16.2} cy={11.4} r={1.2} fill={cut} />
          <Circle cx={18} cy={13.2} r={1.2} fill={cut} />
        </>
      )}
      {glyph === "camera" && (
        <>
          <Path d="M4 8 Q4 6.5 5.5 6.5 H8 L9.5 4.5 H14.5 L16 6.5 H18.5 Q20 6.5 20 8 V17.5 Q20 19 18.5 19 H5.5 Q4 19 4 17.5 Z" fill={color} />
          <Circle cx={12} cy={12.8} r={3.8} fill={cut} />
          <Circle cx={12} cy={12.8} r={1.9} fill={color} />
        </>
      )}
      {glyph === "music" && (
        <Path d="M9 17.5 A3 3 0 1 1 7 14.7 V6.2 L19 3.6 V15 A3 3 0 1 1 17 12.2 V7.2 L9 8.9 Z" fill={color} />
      )}
    </Svg>
  );
}

// ── Sky ──────────────────────────────────────────────────────────────────────

function Cloud({
  top, w, speed, start, opacity, color, screenWidth, screenHeight, still,
}: {
  top: number; w: number; speed: number; start: number; opacity: number;
  color: string; screenWidth: number; screenHeight: number; still: boolean;
}) {
  const from = screenWidth + 20;
  const to = -w - 20;
  const span = from - to;
  const x = useSharedValue(from - span * start);
  const shown = useSharedValue(still ? 1 : 0);

  useEffect(() => {
    if (still) return;
    shown.value = withTiming(1, { duration: 400 });
    // Finish the first pass from the staggered start, then loop full passes right → left.
    const first = speed * (1 - start);
    x.value = withSequence(
      withTiming(to, { duration: first, easing: Easing.linear }),
      withRepeat(withSequence(withTiming(from, { duration: 0 }), withTiming(to, { duration: speed, easing: Easing.linear })), -1),
    );
    return () => cancelAnimation(x);
  }, [still, x, shown, from, to, speed, start]);

  const style = useAnimatedStyle(() => ({ opacity: opacity * shown.value, transform: [{ translateX: x.value }] }));
  const h = w * 0.52;

  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: screenHeight * top, width: w, height: h }, style]}>
      <Svg width={w} height={h} viewBox="0 0 210 110">
        <Circle cx={86} cy={48} r={48} fill={color} />
        <Circle cx={34} cy={70} r={34} fill={color} />
        <Circle cx={136} cy={68} r={38} fill={color} />
        <Rect x={0} y={66} width={200} height={40} rx={20} fill={color} />
      </Svg>
    </Animated.View>
  );
}

function Sparkle({
  x, y, size, delay, color, screenWidth, screenHeight, still,
}: {
  x: number; y: number; size: number; delay: number;
  color: string; screenWidth: number; screenHeight: number; still: boolean;
}) {
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(t);
  }, [still, t, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * t.value,
    transform: [{ scale: 0.35 + 0.75 * t.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left: screenWidth * x, top: screenHeight * y, width: size, height: size }, style]}
    >
      <Svg width={size} height={size} viewBox="0 0 20 20">
        <Path d="M10 0 Q10 10 20 10 Q10 10 10 20 Q10 10 0 10 Q10 10 10 0 Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  badge: {
    position: "absolute",
    right: -9,
    top: -9,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 7,
  },
  text: {
    position: "absolute",
    left: 24,
    right: 24,
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 34, lineHeight: 38, letterSpacing: -1 },
  tagline: { fontSize: 16, lineHeight: 22 },
});
