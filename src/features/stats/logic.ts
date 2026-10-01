// Pure stats rules, kept free of React and storage so they can be unit-tested.
// All dates are local calendar days ("yyyy-MM-dd").
import type { AppSession, ScreenTimeDay } from "@/types/guard";
import type { ArchivedSession, ChartBar, ChartRange, HeatCell, HeatLevel, SessionRecord } from "@/types/stats";



export function dateKey(at: number | Date) {
  const d = new Date(at);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function startOfDay(at: number | Date) {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** Active timers and ended ones, in the shape the stats need. */
export function sessionRecords(active: AppSession[], archived: ArchivedSession[]): SessionRecord[] {
  return [
    ...active.map((s) => ({ createdAt: s.createdAt, endedAt: null, logs: s.logs, checkIns: s.checkIns })),
    ...archived.map((s) => ({ createdAt: s.createdAt, endedAt: s.endedAt, logs: s.logs, checkIns: s.checkIns })),
  ];
}

/**
 * Consecutive days, up to today, on which RemindU had at least one timer running.
 * If today isn't covered yet, the streak can still continue from yesterday.
 */
export function dayStreak(records: SessionRecord[], now: number) {
  const covered = new Set<string>();
  for (const r of records) {
    const end = startOfDay(r.endedAt ?? now);
    for (let d = startOfDay(r.createdAt); d <= end; d = addDays(d, 1)) covered.add(dateKey(d));
  }
  let day = startOfDay(now);
  if (!covered.has(dateKey(day))) day = addDays(day, -1);
  let streak = 0;
  while (covered.has(dateKey(day))) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** Time spent in tracked apps per day, splitting stretches that cross midnight. */
export function usageByDay(records: SessionRecord[]) {
  const out: Record<string, number> = {};
  for (const r of records) {
    for (const [start, end] of r.logs) {
      let from = start;
      while (from < end) {
        const nextMidnight = addDays(startOfDay(from), 1).getTime();
        const to = Math.min(end, nextMidnight);
        const key = dateKey(from);
        out[key] = (out[key] ?? 0) + (to - from);
        from = to;
      }
    }
  }
  return out;
}

/** Time spent in tracked apps per hour of the day (0–23). */
export function usageByHour(records: SessionRecord[]) {
  const hours = new Array<number>(24).fill(0);
  for (const r of records) {
    for (const [start, end] of r.logs) {
      let from = start;
      while (from < end) {
        const d = new Date(from);
        d.setMinutes(60, 0, 0); // next full hour
        const to = Math.min(end, d.getTime());
        hours[new Date(from).getHours()] += to - from;
        from = to;
      }
    }
  }
  return hours;
}

// Stretches shorter than this are app switches, not real visits.
const MIN_VISIT_MS = 5_000;

/** Average length of one visit to a tracked app (each time it was opened). */
export function averageVisitMs(records: SessionRecord[]) {
  const visits = records.flatMap((r) => r.logs.map(([s, e]) => e - s)).filter((ms) => ms >= MIN_VISIT_MS);
  if (!visits.length) return null;
  return visits.reduce((a, b) => a + b, 0) / visits.length;
}

/** Hour (0–23) with the most tracked-app time, or null with no usage yet. */
export function peakHour(records: SessionRecord[]) {
  const hours = usageByHour(records);
  const max = Math.max(...hours);
  return max > 0 ? hours.indexOf(max) : null;
}

/** One check-in = one breath taken at "time's up". */
export function totalCheckIns(records: SessionRecord[]) {
  return records.reduce((n, r) => n + r.checkIns, 0);
}

/** Today's total and most used app, from the saved screen time. */
export function todayScreenTime(days: Record<string, ScreenTimeDay>, now: number) {
  const today = days[dateKey(now)];
  return { totalMs: today?.totalMs ?? null, topApp: today?.apps[0] ?? null };
}

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Bars for the screen time chart: the last 7 or 30 days, or the last 12 months
 * (each month shows its average day, so months with partial data stay comparable).
 */
export function screenTimeBars(days: Record<string, ScreenTimeDay>, range: ChartRange, now: number): ChartBar[] {
  const today = startOfDay(now);
  if (range !== "year") {
    const n = range === "week" ? 7 : 30;
    return Array.from({ length: n }, (_, i) => {
      const d = addDays(today, i - n + 1);
      const key = dateKey(d);
      const label = range === "week" ? WEEKDAY[d.getDay()] : i % 5 === 4 || i === n - 1 ? String(d.getDate()) : "";
      return { key, label, ms: days[key]?.totalMs ?? 0 };
    });
  }
  return Array.from({ length: 12 }, (_, i) => {
    const m = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
    const prefix = dateKey(m).slice(0, 7);
    const values = Object.values(days).filter((d) => d.date.startsWith(prefix) && d.totalMs > 0);
    const avg = values.length ? values.reduce((a, d) => a + d.totalMs, 0) / values.length : 0;
    return { key: prefix, label: MONTH[m.getMonth()].charAt(0), ms: avg };
  });
}

/** Average of the bars that have data (a day's average for every range). */
export function averageOf(bars: ChartBar[]) {
  const withData = bars.filter((b) => b.ms > 0);
  if (!withData.length) return null;
  return withData.reduce((a, b) => a + b.ms, 0) / withData.length;
}

/**
 * GitHub-style grid: `weeks` columns of Sunday–Saturday, ending with the current week.
 * Levels are relative to the busiest day shown.
 */
export function heatmap(byDay: Record<string, number>, now: number, weeks = 17): HeatCell[][] {
  const today = startOfDay(now);
  const firstSunday = addDays(today, -today.getDay() - (weeks - 1) * 7);
  const columns = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(firstSunday, w * 7 + d);
      const date = dateKey(day);
      return { date, ms: byDay[date] ?? 0, future: day > today };
    }),
  );
  const max = Math.max(0, ...columns.flat().map((c) => c.ms));
  return columns.map((col) => col.map((c) => ({ ...c, level: levelFor(c.ms, max) })));
}

function levelFor(ms: number, max: number): HeatLevel {
  if (ms <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((ms / max) * 4))) as HeatLevel;
}

export function greetingFor(hour: number) {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}


