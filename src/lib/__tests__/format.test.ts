import { formatCountdown } from "../format";

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
