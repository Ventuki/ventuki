import { describe, expect, it } from "vitest";
import { canTransitionPurchase } from "./purchaseFlow";

describe("purchaseFlow transitions", () => {
  it("allows draft -> confirmed", () => {
    expect(canTransitionPurchase("draft", "confirmed")).toBe(true);
  });

  it("allows cancelled -> draft", () => {
    expect(canTransitionPurchase("cancelled", "draft")).toBe(true);
  });

  it("blocks received -> draft", () => {
    expect(canTransitionPurchase("received", "draft")).toBe(false);
  });
});
