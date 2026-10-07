import { describe, expect, it } from "vitest";
import { isTiltResourcePending } from "../tilt-resource-state.js";

describe("isTiltResourcePending", () => {
  it.each([
    ["pending", "pending"],
    ["none", "none"],
    ["in_progress", "not_applicable"],
    ["ok", "pending"],
    ["ok", "none"],
  ])("treats update=%s runtime=%s as not ready yet", (update, runtime) => {
    expect(isTiltResourcePending(update, runtime)).toBe(true);
  });

  it.each([
    ["ok", "ok"],
    ["ok", "not_applicable"],
    ["error", "ok"],
  ])("does not treat update=%s runtime=%s as pending", (update, runtime) => {
    expect(isTiltResourcePending(update, runtime)).toBe(false);
  });
});
