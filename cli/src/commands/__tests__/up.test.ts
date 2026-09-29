import { describe, expect, it } from "vitest";
import { formatUpSuccess } from "../up.js";

describe("tdk up success output", () => {
  it("prints the first-win block with exact UI and networks copy", () => {
    expect(formatUpSuccess(10350)).toEqual([
      "TDK is up.",
      "Tilt UI: http://localhost:10350",
      "App URLs:",
      "  run: tdk networks",
      "Stop: tdk down",
    ]);
  });

  it("includes at most five discovered app URLs", () => {
    const lines = formatUpSuccess(10351, ["a", "b", "c", "d", "e", "f"]);
    expect(lines.filter((line) => /^ {2}/.test(line))).toEqual(["  a", "  b", "  c", "  d", "  e"]);
  });
});
