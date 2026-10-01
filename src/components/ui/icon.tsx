import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";

// Line icons on a 20px grid: 1.7 stroke, round caps and joins (RemindU Design System v1).
const ICONS = {
  back: <Path d="M12.5 3.5L6 10l6.5 6.5" />,
  home: <Path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />,
  close: <Path d="M5 5l10 10M15 5L5 15" />,
  check: <Path d="M4.5 10.5l3.5 3.5 7.5-8" />,
  chevronDown: <Path d="M5 7.5l5 5 5-5" />,
  chevronRight: <Path d="M7.5 5l5 5-5 5" />,
  plus: <Path d="M10 4v12M4 10h12" />,
  minus: <Path d="M4 10h12" />,
  settings: (
    <>
      <Path d="M3 6h14M3 14h14" />
      <Circle cx="7" cy="6" r="2" fill="currentColor" />
      <Circle cx="13" cy="14" r="2" fill="currentColor" />
    </>
  ),
  history: (
    <>
      <Circle cx="10" cy="10" r="7" />
      <Path d="M10 6v4l2.5 2.5" />
    </>
  ),
  mail: (
    <>
      <Rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <Path d="M3 6l7 5 7-5" />
    </>
  ),
  // tabs and screens
  timer: (
    <>
      <Circle cx="10" cy="11" r="6.5" />
      <Path d="M10 7.5V11l2 1.5M8 2.5h4M15 5l1.2-1.2" />
    </>
  ),
  user: (
    <>
      <Circle cx="10" cy="7" r="3.5" />
      <Path d="M3.5 17.5c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
    </>
  ),
  gear: (
    <>
      <Circle cx="10" cy="10" r="2.5" />
      <Path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
      <Circle cx="10" cy="10" r="5.5" />
    </>
  ),
  search: (
    <>
      <Circle cx="9" cy="9" r="5.5" />
      <Path d="M13 13l4 4" />
    </>
  ),
  flame: <Path d="M10 17.5c3 0 5-2 5-5 0-3.5-3-5-3.5-9-2 1.5-3.5 3.5-3.5 6-1-.5-1.5-1.5-1.5-2.5C5 8.5 5 10.5 5 12.5c0 3 2 5 5 5z" />,
  phone: (
    <>
      <Rect x="5.5" y="2.5" width="9" height="15" rx="2" />
      <Path d="M9 15h2" />
    </>
  ),
  star: <Path d="M10 2.8l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.1l5-.7L10 2.8z" />,
  wind: <Path d="M2.5 8h9a2.5 2.5 0 10-2.5-2.5M2.5 12h12a2.5 2.5 0 11-2.5 2.5M2.5 10h6" />,
  moon: <Path d="M16.5 12.5A7 7 0 017.5 3.5a7 7 0 109 9z" />,
  help: (
    <>
      <Circle cx="10" cy="10" r="7.5" />
      <Path d="M7.8 7.8a2.3 2.3 0 114 1.5c-.8.6-1.8 1-1.8 2.2" />
      <Circle cx="10" cy="14" r="0.5" fill="currentColor" />
    </>
  ),
  shield: <Path d="M10 2.5l6 2.5v4.5c0 4-2.6 6.7-6 8-3.4-1.3-6-4-6-8V5l6-2.5z" />,
  logout: <Path d="M8 3.5H4.5a1 1 0 00-1 1v11a1 1 0 001 1H8M12.5 6.5L16 10l-3.5 3.5M16 10H7.5" />,
  trash: <Path d="M3.5 5.5h13M8 5.5V4a1 1 0 011-1h2a1 1 0 011 1v1.5M5 5.5l.8 10.6a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4L15 5.5" />,
  sliders: (
    <>
      <Path d="M3 6h14M3 14h14" />
      <Circle cx="7" cy="6" r="2" fill="currentColor" />
      <Circle cx="13" cy="14" r="2" fill="currentColor" />
    </>
  ),
  // personas
  book: <Path d="M3 4.5h5a2 2 0 012 2V16a1.5 1.5 0 00-1.5-1.5H3V4.5zM17 4.5h-5a2 2 0 00-2 2V16a1.5 1.5 0 011.5-1.5H17V4.5z" />,
  target: (
    <>
      <Circle cx="10" cy="10" r="7" />
      <Circle cx="10" cy="10" r="3.5" />
      <Circle cx="10" cy="10" r="0.5" fill="currentColor" />
    </>
  ),
  briefcase: (
    <>
      <Rect x="2.5" y="6" width="15" height="10.5" rx="2" />
      <Path d="M7 6V4.5A1.5 1.5 0 018.5 3h3A1.5 1.5 0 0113 4.5V6M2.5 10.5h15" />
    </>
  ),
  rocket: (
    <>
      <Path d="M10 2.5c3 1.5 4.5 4.5 4.5 8l-2 2.5h-5l-2-2.5c0-3.5 1.5-6.5 4.5-8z" />
      <Circle cx="10" cy="8" r="1.5" />
      <Path d="M8 16.5h4" />
    </>
  ),
  video: (
    <>
      <Rect x="2.5" y="5" width="10.5" height="10" rx="2" />
      <Path d="M13 9l4.5-2.5v7L13 11" />
    </>
  ),
  presentation: (
    <>
      <Rect x="2.5" y="3" width="15" height="10" rx="1.5" />
      <Path d="M10 13v4M7 17h6" />
    </>
  ),
  sparkle: <Path d="M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5l-1.6-4.4-4.4-1.6 4.4-1.6L10 2.5zM15.5 13.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z" />,
  // permissions
  eye: (
    <>
      <Path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z" />
      <Circle cx="10" cy="10" r="2.5" />
    </>
  ),
  layers: <Path d="M10 2.5l7.5 4-7.5 4-7.5-4 7.5-4zM2.5 10l7.5 4 7.5-4M2.5 13.5l7.5 4 7.5-4" />,
  bell: <Path d="M5 8a5 5 0 0110 0v4l1.5 2.5h-13L5 12V8zM8 16.5a2 2 0 004 0" />,
  battery: (
    <>
      <Rect x="2.5" y="6" width="13" height="8" rx="2" />
      <Path d="M17.5 9v2" />
      <Rect x="4.5" y="8" width="5" height="4" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  /** Defaults to the theme's foreground colour. */
  color?: string;
};

export function Icon({ name, size = 18, color }: IconProps) {
  const theme = useTheme();
  const c = color ?? theme.foreground;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      color={c}
      stroke={c}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </Svg>
  );
}
