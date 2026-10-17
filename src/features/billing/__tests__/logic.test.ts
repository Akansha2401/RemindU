import type { CustomerInfo, PurchasesEntitlementInfo } from "react-native-purchases";
import { canAddApp, toSubscription } from "../logic";

const ENTITLEMENT = "remindu_pro";

function info(active: Record<string, Partial<PurchasesEntitlementInfo>> = {}) {
  return {
    entitlements: { active, all: active },
    managementURL: "https://play.google.com/store/account/subscriptions",
  } as unknown as CustomerInfo;
}

describe("toSubscription", () => {
  it("is free when the entitlement isn't active", () => {
    expect(toSubscription(info(), ENTITLEMENT)).toEqual({
      ready: true,
      isPro: false,
      productId: null,
      expiresAt: null,
      willRenew: false,
      periodType: null,
      managementUrl: "https://play.google.com/store/account/subscriptions",
    });
  });

  it("ignores other entitlements", () => {
    const sub = toSubscription(info({ other: { productIdentifier: "x" } }), ENTITLEMENT);
    expect(sub.isPro).toBe(false);
  });

  it("reads the active remindu_pro entitlement", () => {
    const sub = toSubscription(
      info({
        [ENTITLEMENT]: {
          productIdentifier: "yearly",
          expirationDate: "2027-10-17T00:00:00Z",
          willRenew: false,
          periodType: "TRIAL",
        },
      }),
      ENTITLEMENT,
    );
    expect(sub).toMatchObject({
      ready: true,
      isPro: true,
      productId: "yearly",
      expiresAt: "2027-10-17T00:00:00Z",
      willRenew: false,
      periodType: "TRIAL",
    });
  });
});

describe("canAddApp", () => {
  const taken = ["insta", "yt"];

  it("allows apps up to the free limit", () => {
    expect(canAddApp("reddit", taken, false, 3)).toBe(true);
    expect(canAddApp("netflix", [...taken, "reddit"], false, 3)).toBe(false);
  });

  it("doesn't count an app that already has a timer twice", () => {
    expect(canAddApp("yt", [...taken, "reddit"], false, 3)).toBe(true);
  });

  it("has no limit with Pro", () => {
    expect(canAddApp("netflix", [...taken, "reddit", "x"], true, 3)).toBe(true);
  });
});
