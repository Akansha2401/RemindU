import { formatCountdown, formatDuration, formatHour } from "../format";

describe("formatCountdown", () => {
  it.each([
    [0, "0:00"],
    [59.2, "1:00"],
    [65, "1:05"],
    [3600, "1:00:00"],
    [5050, "1:24:10"],
    [-3, "0:00"],
  ])("%s s -> %s", (sec, text) => {
    expect(formatCountdown(sec)).toBe(text);
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0m"],
    [20_000, "<1m"],
    [45 * 60_000, "45m"],
    [60 * 60_000, "1h"],
    [192 * 60_000, "3h 12m"],
  ])("%s ms -> %s", (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});

describe("formatHour", () => {
  it.each([
    [0, "12 AM"],
    [9, "9 AM"],
    [12, "12 PM"],
    [21, "9 PM"],
  ])("%s -> %s", (h, text) => {
    expect(formatHour(h)).toBe(text);
  });
});
