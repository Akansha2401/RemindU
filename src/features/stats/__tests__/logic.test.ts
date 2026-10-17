import type { ScreenTimeDay } from "@/types/guard";
import type { SessionRecord } from "@/types/stats";
import {
  focusByDay,
  focusSummary,
  fromDateKey,
  monthStarts,
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
  return { createdAt: at(2026, 10, 1), endedAt: null, logs: [], checkIns: 0, budgetSec: 30 * 60, ...partial };
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

describe("focusByDay", () => {
  const now = at(2026, 10, 3);

  it("sets each running day's use against the session length, summed over apps", () => {
    const insta = record({ createdAt: at(2026, 10, 2, 9), logs: [[at(2026, 10, 2, 10), at(2026, 10, 2, 10, 40)]] });
    const yt = record({ createdAt: at(2026, 10, 2, 9), budgetSec: 60 * 60 });
    expect(focusByDay([insta, yt], now)).toEqual({
      "2026-10-02": { usedMs: 40 * MIN, limitMs: 90 * MIN },
      "2026-10-03": { usedMs: 0, limitMs: 90 * MIN },
    });
  });

  it("stops at the day a timer ended", () => {
    const ended = record({ createdAt: at(2026, 10, 1), endedAt: at(2026, 10, 2, 8) });
    expect(Object.keys(focusByDay([ended], now))).toEqual(["2026-10-01", "2026-10-02"]);
  });

  it("leaves out days a full (trimmed) log no longer covers", () => {
    const logs = Array.from({ length: 300 }, (_, i): [number, number] => [at(2026, 10, 2, 10) + i * MIN, at(2026, 10, 2, 10) + i * MIN + 1_000]);
    const full = record({ createdAt: at(2026, 9, 20), logs });
    expect(Object.keys(focusByDay([full], now))).toEqual(["2026-10-03"]);
  });
});

describe("heatmap", () => {
  const now = at(2026, 10, 7);

  it("ends with the current week and lights up days within the limits", () => {
    const grid = heatmap(
      {
        "2026-10-05": { usedMs: 5 * MIN, limitMs: 30 * MIN }, // 1/6 of the limit
        "2026-10-06": { usedMs: 25 * MIN, limitMs: 30 * MIN },
        "2026-10-07": { usedMs: 45 * MIN, limitMs: 30 * MIN }, // over
      },
      now,
      4,
    );
    expect(grid).toHaveLength(4);
    const week = grid[3];
    expect(week[0].date).toBe(dateKey(at(2026, 10, 4))); // Sunday
    expect(week[0]).toMatchObject({ status: "none", level: 0 });
    expect(week[1]).toMatchObject({ status: "within", level: 4 });
    expect(week[2]).toMatchObject({ status: "within", level: 1 });
    expect(week[3]).toMatchObject({ status: "over", level: 0 });
    expect(week[4].future).toBe(true);
  });
});

describe("focusSummary", () => {
  it("counts tracked and within days and the longest run", () => {
    const within = { usedMs: 0, limitMs: 30 * MIN };
    const over = { usedMs: 60 * MIN, limitMs: 30 * MIN };
    const grid = heatmap(
      {
        "2026-09-29": within,
        "2026-09-30": within,
        "2026-10-01": over,
        "2026-10-02": within,
        // 3rd: no timer, doesn't break the run
        "2026-10-04": within,
        "2026-10-05": within,
      },
      at(2026, 10, 7),
      2,
    );
    expect(focusSummary(grid)).toEqual({
      trackedDays: 6,
      withinDays: 5,
      bestRun: 3,
      averageUsedMs: 10 * MIN,
    });
  });

  it("is empty without any timers", () => {
    expect(focusSummary(heatmap({}, at(2026, 10, 7), 2))).toEqual({
      trackedDays: 0,
      withinDays: 0,
      bestRun: 0,
      averageUsedMs: null,
    });
  });
});

describe("fromDateKey", () => {
  it("reads the key as a local date", () => {
    expect(fromDateKey("2026-10-07").getTime()).toBe(at(2026, 10, 7, 0));
  });
});

describe("monthStarts", () => {
  it("labels the week where each month starts", () => {
    // 10 weeks ending the week of 7 Oct 2026: columns start on Sundays from 2 Aug.
    const grid = heatmap({}, at(2026, 10, 7), 10);
    expect(monthStarts(grid)).toEqual([
      { week: 0, month: 7 }, // Aug
      { week: 5, month: 8 }, // 6 Sep
      { week: 9, month: 9 }, // 4 Oct
    ]);
  });

  it("drops the first label when the next month starts right after it", () => {
    // Columns start 27 Sep and 4 Oct: "Sep" would sit right next to "Oct".
    const grid = heatmap({}, at(2026, 10, 7), 2);
    expect(monthStarts(grid)).toEqual([{ week: 1, month: 9 }]);
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
