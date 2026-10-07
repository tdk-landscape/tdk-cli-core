import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as templateEngine from "../../generator/template-engine.js";
import { checkDriftGate } from "../drift-gate.js";

vi.mock("../../generator/template-engine.js");

describe("drift-gate utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when verification passes", () => {
    vi.mocked(templateEngine.verifyMasterConfigs).mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
      diffs: [],
    });

    const result = checkDriftGate({
      projectRoot: "/test",
      quiet: true,
    });

    expect(result).toBe(true);
  });

  it("exits with code 2 when drift detected and ignoreDrift is false", () => {
    vi.mocked(templateEngine.verifyMasterConfigs).mockReturnValue({
      valid: false,
      errors: ["docker-compose.yml is out of date"],
      warnings: [],
      diffs: [],
    });

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit called");
    });

    expect(() => {
      checkDriftGate({
        projectRoot: "/test",
        ignoreDrift: false,
        quiet: false,
      });
    }).toThrow("exit called");

    expect(exitSpy).toHaveBeenCalledWith(2);
  });

  it("returns true and prints warning when drift detected and ignoreDrift is true", () => {
    vi.mocked(templateEngine.verifyMasterConfigs).mockReturnValue({
      valid: false,
      errors: ["docker-compose.yml is out of date"],
      warnings: [],
      diffs: [],
    });

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = checkDriftGate({
      projectRoot: "/test",
      ignoreDrift: true,
      quiet: false,
    });

    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain("out of date");
  });
});
