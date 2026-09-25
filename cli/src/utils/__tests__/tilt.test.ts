import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock findProjectRoot to return a controlled path for all tests
vi.mock("../paths.js", () => ({
  findProjectRoot: vi.fn(),
  getPackageVersion: vi.fn(() => "1.1.0"),
}));

import { findProjectRoot } from "../paths.js";

describe("getTiltfilePath", () => {
  beforeEach(() => {
    vi.mocked(findProjectRoot).mockReturnValue("/fake/project");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct tiltfile path for valid project", async () => {
    const { getTiltfilePath } = await import("../tilt.js");
    const tiltfilePath = getTiltfilePath();
    expect(tiltfilePath).toBe("/fake/project/.tdk/.tdk-out/Tiltfile");
  });

  it("should not have double slashes in path", async () => {
    const { getTiltfilePath } = await import("../tilt.js");
    // Ensure root doesn't have trailing slash
    const tiltfilePath = getTiltfilePath();
    expect(tiltfilePath).not.toContain("//");
  });
});

describe("getTiltfilePath error", () => {
  beforeEach(() => {
    vi.mocked(findProjectRoot).mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should throw when not in a TDK project", async () => {
    const { getTiltfilePath } = await import("../tilt.js");
    expect(() => getTiltfilePath()).toThrow("Not in a TDK project");
  });
});

describe("buildTiltUpArgs", () => {
  beforeEach(() => {
    vi.mocked(findProjectRoot).mockReturnValue("/fake/project");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should include -f flag with tiltfile path", async () => {
    const { buildTiltUpArgs } = await import("../tilt.js");
    const args = buildTiltUpArgs(["service-a", "service-b"], {});
    expect(args).toContain("-f");
    const fIndex = args.indexOf("-f");
    expect(fIndex).toBeGreaterThanOrEqual(0);
    expect(args[fIndex + 1]).toContain(".tdk/.tdk-out/Tiltfile");
  });

  it("should include service names in order", async () => {
    const { buildTiltUpArgs } = await import("../tilt.js");
    const args = buildTiltUpArgs(["service-a", "service-b"], {});
    expect(args).toContain("service-a");
    expect(args).toContain("service-b");
  });

  it("should include --verbose flag when verbose is set", async () => {
    const { buildTiltUpArgs } = await import("../tilt.js");
    const args = buildTiltUpArgs([], { verbose: true });
    expect(args).toContain("--verbose");
  });

  it("should NOT include --verbose when quiet is set even if verbose is true", async () => {
    const { buildTiltUpArgs } = await import("../tilt.js");
    const args = buildTiltUpArgs([], { verbose: true, quiet: true });
    expect(args).not.toContain("--verbose");
  });

  it("should include --watch flag when watch is set", async () => {
    const { buildTiltUpArgs } = await import("../tilt.js");
    const args = buildTiltUpArgs([], { watch: true });
    expect(args).toContain("--watch");
  });

  it("should order args: -f, tiltfile, services, options", async () => {
    const { buildTiltUpArgs } = await import("../tilt.js");
    const args = buildTiltUpArgs(["svc-a", "svc-b"], { verbose: true });
    expect(args[0]).toBe("-f");
    expect(args[1]).toContain("Tiltfile");
    expect(args[2]).toBe("svc-a");
    expect(args[3]).toBe("svc-b");
    expect(args[4]).toBe("--verbose");
  });

  it("should call findProjectRoot once", async () => {
    const { buildTiltUpArgs } = await import("../tilt.js");
    buildTiltUpArgs([], {});
    expect(findProjectRoot).toHaveBeenCalledTimes(1);
  });

  it("should include --focus=<stack> before service names when focusTargets is set", async () => {
    // Regression test: `tdk up <stack>` used to pass only bare positional service
    // names, which the generated Tiltfile's focus filter never reads (it only reads
    // --focus), so it silently fell back to building every stack instead of the one
    // requested. --focus must be present and carry the stack name.
    const { buildTiltUpArgs } = await import("../tilt.js");
    const args = buildTiltUpArgs(["finance-api", "finance-app"], { focusTargets: ["finance"] });
    expect(args).toContain("--focus=finance");
    expect(args.indexOf("--focus=finance")).toBeLessThan(args.indexOf("finance-api"));
  });

  it("should join multiple focusTargets with commas in a single --focus flag", async () => {
    const { buildTiltUpArgs } = await import("../tilt.js");
    const args = buildTiltUpArgs([], { focusTargets: ["finance", "hr"] });
    expect(args).toContain("--focus=finance,hr");
  });

  it("should NOT include --focus when focusTargets is empty or omitted", async () => {
    const { buildTiltUpArgs } = await import("../tilt.js");
    const withEmpty = buildTiltUpArgs(["svc"], { focusTargets: [] });
    const withOmitted = buildTiltUpArgs(["svc"], {});
    expect(withEmpty.some((a) => a.startsWith("--focus"))).toBe(false);
    expect(withOmitted.some((a) => a.startsWith("--focus"))).toBe(false);
  });
});

describe("buildTiltDownArgs", () => {
  beforeEach(() => {
    vi.mocked(findProjectRoot).mockReturnValue("/fake/project");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should include -f flag with tiltfile path", async () => {
    const { buildTiltDownArgs } = await import("../tilt.js");
    const args = buildTiltDownArgs({});
    expect(args).toContain("-f");
  });

  it("should include --force flag when force is set", async () => {
    const { buildTiltDownArgs } = await import("../tilt.js");
    const args = buildTiltDownArgs({ force: true });
    expect(args).toContain("--force");
  });

  it("should not include --force flag when force is not set", async () => {
    const { buildTiltDownArgs } = await import("../tilt.js");
    const args = buildTiltDownArgs({});
    expect(args).not.toContain("--force");
  });
});

describe("isTiltAvailable", () => {
  it("should return a boolean", async () => {
    const { isTiltAvailable } = await import("../tilt.js");
    const available = await isTiltAvailable();
    expect(typeof available).toBe("boolean");
  });
});
