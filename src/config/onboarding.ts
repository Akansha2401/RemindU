import type { IconName } from "@/components/ui/icon";
import type { Persona } from "@/types/onboarding";

/** Persona tiles, in display order. Labels live in strings.onboarding.persona.labels. */
export const PERSONAS: readonly { key: Persona; icon: IconName }[] = [
  { key: "student", icon: "book" },
  { key: "exam_prep", icon: "target" },
  { key: "professional", icon: "briefcase" },
  { key: "founder", icon: "rocket" },
  { key: "creator", icon: "video" },
  { key: "teacher", icon: "presentation" },
  { key: "other", icon: "sparkle" },
];

/**
 * Goal and "why" suggestions per persona. Edit copy here.
 * Goals must be 3–80 characters (SET-01); the first goal and why are pre-selected.
 */
export const PERSONA_SUGGESTIONS: Record<Persona, { goals: readonly string[]; whys: readonly string[] }> = {
  student: {
    goals: [
      "Finish my assignments before the deadline",
      "Study 3 focused hours every day",
      "Get through my syllabus this semester",
    ],
    whys: [
      "My future self will thank me",
      "I want to stop feeling behind",
      "I want to make my family proud",
    ],
  },
  exam_prep: {
    goals: [
      "Crack my exam with a rank I'm proud of",
      "Finish today's revision plan",
      "Solve 50 practice questions a day",
    ],
    whys: [
      "This exam decides my next few years",
      "I've worked too hard to waste it now",
      "I want the college I keep thinking about",
    ],
  },
  professional: {
    goals: [
      "Do my most important work first",
      "Finish work on time and log off",
      "Learn a new skill for my career",
    ],
    whys: [
      "I want to grow in my career",
      "I want my evenings back",
      "I'm tired of feeling busy but stuck",
    ],
  },
  founder: {
    goals: [
      "Building my startup, not scrolling",
      "Ship one feature every week",
      "Talk to five customers this week",
    ],
    whys: [
      "I want to build something that lasts",
      "My customers are counting on me",
      "Time is my only real advantage",
    ],
  },
  creator: {
    goals: [
      "Post consistently, not just consume",
      "Finish editing my next video",
      "Write my next script today",
    ],
    whys: [
      "I want to make things, not just watch them",
      "My audience is waiting for my next post",
      "Consistency is how I grow",
    ],
  },
  teacher: {
    goals: [
      "Prepare tomorrow's lessons early",
      "Finish checking papers this week",
      "Be present in class, not on my phone",
    ],
    whys: [
      "My students deserve my full attention",
      "I want to set a good example",
      "I want calmer, better-planned days",
    ],
  },
  other: {
    goals: [
      "Spend less time scrolling",
      "Read for 30 minutes a day",
      "Be more present with my family",
    ],
    whys: [
      "I want my time back",
      "I want to feel in control of my day",
      "The people around me deserve my attention",
    ],
  },
};

export const GOAL_MIN = 3;
export const GOAL_MAX = 80;
export const WHY_MAX = 200;

/** APP-03: pre-toggled on first run, only if installed. Package names are for the Indian Play Store. */
export const SUGGESTED_APPS: readonly { packageName: string; label: string }[] = [
  { packageName: "com.instagram.android", label: "Instagram" },
  { packageName: "com.google.android.youtube", label: "YouTube" },
  { packageName: "com.snapchat.android", label: "Snapchat" },
  { packageName: "com.facebook.katana", label: "Facebook" },
  { packageName: "com.twitter.android", label: "X" },
  { packageName: "com.reddit.frontpage", label: "Reddit" },
  { packageName: "in.mohalla.sharechat", label: "ShareChat" },
  { packageName: "in.mohalla.video", label: "Moj" },
  { packageName: "com.eterno.shortvideos", label: "Josh" },
];

export type PhoneBrand = "xiaomi" | "oppo" | "vivo" | "realme" | "samsung";

/** ONB-06: "keep RemindU running" steps per manufacturer. Slugs match dontkillmyapp.com. */
export const BRAND_GUIDES: Record<PhoneBrand, { name: string; steps: readonly string[] }> = {
  xiaomi: {
    name: "Xiaomi, Redmi and POCO",
    steps: [
      "Settings > Apps > Manage apps > RemindU > turn on Autostart",
      "In the same screen, Battery saver > No restrictions",
    ],
  },
  oppo: {
    name: "Oppo",
    steps: [
      "Settings > Battery > App battery management > RemindU",
      "Turn on Allow background activity and Allow auto launch",
    ],
  },
  vivo: {
    name: "Vivo",
    steps: [
      "Settings > Battery > Background power consumption management > RemindU > Allow",
      "i Manager > App manager > Autostart manager > turn on RemindU",
    ],
  },
  realme: {
    name: "Realme",
    steps: [
      "Settings > Battery > App battery management > RemindU",
      "Turn on Allow background activity and Allow auto launch",
    ],
  },
  samsung: {
    name: "Samsung",
    steps: [
      "Settings > Battery > Background usage limits",
      "Never sleeping apps > add RemindU",
    ],
  },
};

/** Maps expo-device's manufacturer string to a brand guide. */
export function detectBrand(manufacturer: string | null | undefined): PhoneBrand | null {
  const m = (manufacturer ?? "").toLowerCase();
  if (/xiaomi|redmi|poco/.test(m)) return "xiaomi";
  if (m.includes("realme")) return "realme";
  if (m.includes("oppo")) return "oppo";
  if (m.includes("vivo")) return "vivo";
  if (m.includes("samsung")) return "samsung";
  return null;
}

export const dontKillMyAppUrl = (brand: PhoneBrand | null) =>
  `https://dontkillmyapp.com/${brand ?? ""}`;
