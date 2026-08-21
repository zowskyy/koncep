import { describe, expect, it } from "vitest";
import {
  assertProjectStatusTransition,
  canTransitionProjectStatus
} from "./project";

describe("project status transitions", () => {
  it("allows the forward workflow", () => {
    expect(canTransitionProjectStatus("draft", "published")).toBe(true);
    expect(canTransitionProjectStatus("published", "supported")).toBe(true);
    expect(canTransitionProjectStatus("supported", "completed")).toBe(true);
  });

  it("prevents transitions that skip stages", () => {
    expect(canTransitionProjectStatus("draft", "supported")).toBe(false);
    expect(canTransitionProjectStatus("published", "completed")).toBe(false);
  });

  it("prevents completed projects from moving backward", () => {
    expect(canTransitionProjectStatus("completed", "draft")).toBe(false);

    expect(() =>
      assertProjectStatusTransition("completed", "published")
    ).toThrow('Cannot transition a project from "completed" to "published".');
  });
});
