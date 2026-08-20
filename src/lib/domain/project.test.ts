import { describe, expect, it } from "vitest";
import { canTransition } from "./project";

describe("project status transitions", () => {
  it("allows a draft project to be published", () => {
    expect(canTransition("draft", "published")).toBe(true);
  });

  it("allows a published project to gather support", () => {
    expect(canTransition("published", "gathering_support")).toBe(true);
  });

  it("prevents a completed project from going backward", () => {
    expect(canTransition("completed", "draft")).toBe(false);
  });
});
