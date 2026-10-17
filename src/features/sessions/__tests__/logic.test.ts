import type { AppSession, AppSessionEdit } from "@/types/guard";
import { applySessionEdit } from "../logic";

const MIN = 60;

function session(over: Partial<AppSession>): AppSession {
  return {
    sessionId: "s1",
    packageName: "com.instagram.android",
    label: "Instagram",
    goal: "Ship the MVP",
    budgetSec: 30 * MIN,
    remainingSec: 30 * MIN,
    frequency: "once",
    everyHours: 1,
    createdAt: 0,
    startedAt: null,
    status: "waiting",
    cooldownUntil: null,
    checkIns: 2,
    logs: [[1, 2]],
    ...over,
  };
}

const edit = (budgetMin: number, over: Partial<AppSessionEdit> = {}): AppSessionEdit => ({
  goal: "Study for CAT",
  budgetSec: budgetMin * MIN,
  frequency: "continuous",
  everyHours: 3,
  ...over,
});

describe("applySessionEdit", () => {
  it("gives a waiting timer the full new length", () => {
    expect(applySessionEdit(session({}), edit(10)).remainingSec).toBe(10 * MIN);
  });

  it("keeps the time already used this round", () => {
    // 30 min round, 20 used: a 60 min length leaves 40.
    const s = session({ status: "paused", startedAt: 1, remainingSec: 10 * MIN });
    expect(applySessionEdit(s, edit(60)).remainingSec).toBe(40 * MIN);
  });

  it("runs out when the new length is shorter than the time used", () => {
    const s = session({ status: "counting", startedAt: 1, remainingSec: 10 * MIN });
    expect(applySessionEdit(s, edit(10)).remainingSec).toBe(0);
  });

  it("leaves a round that already ran out at zero", () => {
    const s = session({ status: "time_up", startedAt: 1, remainingSec: 0 });
    expect(applySessionEdit(s, edit(60)).remainingSec).toBe(0);
  });

  it("applies the edit and keeps logs and check-ins", () => {
    const next = applySessionEdit(session({}), edit(20));
    expect(next).toMatchObject({
      goal: "Study for CAT",
      budgetSec: 20 * MIN,
      frequency: "continuous",
      everyHours: 3,
      checkIns: 2,
      logs: [[1, 2]],
    });
  });
});
