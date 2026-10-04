import { describe, expect, it } from "vitest";
import { isValidSince, isValidTail, parseTiltLogLines } from "../tilt-logs.js";

const line = (message: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    time: "t",
    resource: "api",
    level: "info",
    source: "runtime",
    message,
    ...extra,
  });

describe("parseTiltLogLines", () => {
  it("normalizes Tilt JSON Lines", () => {
    expect(parseTiltLogLines(line("hello"), 10)).toEqual([
      { time: "t", resource: "api", level: "info", source: "runtime", text: "hello" },
    ]);
  });
  it("keeps only the last `limit` lines", () => {
    const out = ["a", "b", "c"].map((m) => line(m)).join("\n");
    expect(parseTiltLogLines(out, 2).map((l) => l.text)).toEqual(["b", "c"]);
  });
  it("skips blank and non-JSON lines and tolerates missing fields", () => {
    const out = `notice\n\n${JSON.stringify({ message: "x" })}\n`;
    expect(parseTiltLogLines(out, 5)).toEqual([
      { time: null, resource: null, level: null, source: null, text: "x" },
    ]);
  });
});

describe("option validation", () => {
  it("accepts Go-style durations only", () => {
    for (const ok of ["30s", "5m", "1h", "1h30m", "250ms"]) expect(isValidSince(ok)).toBe(true);
    for (const bad of ["", "5", "m", "5 minutes", "-1s"]) expect(isValidSince(bad)).toBe(false);
  });
  it("accepts positive integer tails only", () => {
    expect(isValidTail("200")).toBe(true);
    for (const bad of ["0", "-1", "1.5", "10x", ""]) expect(isValidTail(bad)).toBe(false);
  });
});
