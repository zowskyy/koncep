import { describe, expect, it } from "vitest";
import { SUPPORT_THRESHOLD } from "./support";

describe("support threshold", () => {
  it("uses a positive threshold", () => {
    expect(SUPPORT_THRESHOLD).toBeGreaterThan(0);
  });

  it("is reached exactly at ten supporters", () => {
    expect(SUPPORT_THRESHOLD).toBe(10);
  });
});
