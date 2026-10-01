import type { ScreenTimeDay } from "@/types/guard";
import type { SessionRecord } from "@/types/stats";
import {
  averageVisitMs,
  dateKey,
  dayStreak,
  greetingFor,
  heatmap,
  peakHour,
  screenTimeBars,
  totalCheckIns,
  usageByDay,
} from "../logic";

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const MIN = 60_000;

function record(partial: Partial<SessionRecord>): SessionRecord {
  return { createdAt: at(2026, 10, 1), endedAt: null, logs: [], checkIns: 0, ...partial };
}

describe("dayStreak", () => {
  const now = at(2026, 10, 10);

  it("counts every day a timer was running, up to today", () => {
    expect(dayStreak([record({ createdAt: at(2026, 10, 7) })], now)).toBe(4);
  });

  it("is zero with no timers", () => {
    expect(dayStreak([], now)).toBe(0);
  });

  it("keeps yesterday's streak alive before anything runs today", () => {
    const ended = record({ createdAt: at(2026, 10, 8), endedAt: at(2026, 10, 9, 20) });
    expect(dayStreak([ended], now)).toBe(2);
  });

  it("breaks on a day with nothing running", () => {
    const old = record({ createdAt: at(2026, 10, 1), endedAt: at(2026, 10, 3) });
    const recent = record({ createdAt: at(2026, 10, 9) });
    expect(dayStreak([old, recent], now)).toBe(2);
  });
});

describe("usage stats", () => {
  const logs: [number, number][] = [
    [at(2026, 10, 1, 23, 50), at(2026, 10, 2, 0, 10)], // crosses midnight
    [at(2026, 10, 2, 9), at(2026, 10, 2, 9, 30)],
    [at(2026, 10, 2, 9, 40), at(2026, 10, 2, 9, 40) + 2_000], // app switch, not a visit
  ];
  const records = [record({ logs, checkIns: 2 }), record({ checkIns: 1 })];

  it("splits time across midnight", () => {
    const byDay = usageByDay(records);
    expect(byDay["2026-10-01"]).toBe(10 * MIN);
    expect(byDay["2026-10-02"]).toBe(40 * MIN + 2_000);
  });

  it("averages visits and ignores app switches", () => {
    expect(averageVisitMs(records)).toBe((20 * MIN + 30 * MIN) / 2);
    expect(averageVisitMs([record({})])).toBeNull();
  });

  it("finds the busiest hour", () => {
    expect(peakHour(records)).toBe(9);
    expect(peakHour([])).toBeNull();
  });

  it("adds up check-ins", () => {
    expect(totalCheckIns(records)).toBe(3);
  });
});

describe("screenTimeBars", () => {
  const now = at(2026, 10, 7); // a Wednesday
  const day = (date: string, totalMs: number): ScreenTimeDay => ({ date, totalMs, apps: [] });
  const days = {
    "2026-10-07": day("2026-10-07", 60 * MIN),
    "2026-10-01": day("2026-10-01", 30 * MIN),
    "2026-09-15": day("2026-09-15", 120 * MIN),
    "2026-09-16": day("2026-09-16", 60 * MIN),
  };

  it("shows the last seven days, ending today", () => {
    const bars = screenTimeBars(days, "week", now);
    expect(bars).toHaveLength(7);
    expect(bars[6]).toEqual({ key: "2026-10-07", label: "W", ms: 60 * MIN });
    expect(bars[0].key).toBe("2026-10-01");
  });

  it("averages each month over the days that have data", () => {
    const bars = screenTimeBars(days, "year", now);
    expect(bars).toHaveLength(12);
    expect(bars[11].key).toBe("2026-10");
    expect(bars[10].ms).toBe(90 * MIN);
  });
});

describe("heatmap", () => {
  it("ends with the current week and scales levels to the busiest day", () => {
    const now = at(2026, 10, 7);
    const grid = heatmap({ "2026-10-07": 60 * MIN, "2026-10-06": 10 * MIN }, now, 4);
    expect(grid).toHaveLength(4);
    const lastWeek = grid[3];
    expect(lastWeek[0].date).toBe(dateKey(at(2026, 10, 4))); // Sunday
    expect(lastWeek[3]).toMatchObject({ date: "2026-10-07", level: 4, future: false });
    expect(lastWeek[2].level).toBe(1);
    expect(lastWeek[4].future).toBe(true);
  });
});

describe("greetingFor", () => {
  it("follows the time of day", () => {
    expect(greetingFor(8)).toBe("morning");
    expect(greetingFor(14)).toBe("afternoon");
    expect(greetingFor(19)).toBe("evening");
    expect(greetingFor(23)).toBe("night");
  });
});
