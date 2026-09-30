import { describe, expect, it, vi } from "vitest";
import { findTiltProcessIdsOnPort, stopTiltOnPort } from "../../utils/tilt-process.js";
import { formatUpSuccess, nativeWindowsUpRefusal } from "../up.js";

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

describe("tdk up platform contract", () => {
  it("refuses native Windows unless the explicit escape hatch is set", () => {
    expect(nativeWindowsUpRefusal("win32")).toContain("tdk doctor");
    expect(nativeWindowsUpRefusal("win32", "0")).not.toBeNull();
    expect(nativeWindowsUpRefusal("win32", "1")).toBeNull();
    expect(nativeWindowsUpRefusal("linux")).toBeNull();
  });
});

describe("Tilt force cleanup", () => {
  it("finds only Tilt listeners on the requested port", () => {
    const runner = vi.fn((command: string) => {
      if (command === "lsof") return "123\n456\n";
      if (command === "ps") return "tilt\n";
      return "";
    });

    expect(findTiltProcessIdsOnPort(10351, "linux", runner)).toEqual([123, 456]);
    expect(runner).toHaveBeenNthCalledWith(1, "lsof", ["-nP", "-t", "-iTCP:10351", "-sTCP:LISTEN"]);
    expect(runner).toHaveBeenNthCalledWith(2, "ps", ["-p", "123", "-o", "comm="]);
    expect(runner).toHaveBeenNthCalledWith(3, "ps", ["-p", "456", "-o", "comm="]);
  });

  it("does not terminate a non-Tilt process on the selected port", () => {
    const runner = vi.fn((command: string) => {
      if (command === "lsof") return "123\n";
      if (command === "ps") return "postgres\n";
      return "";
    });

    expect(stopTiltOnPort(5432, "linux", runner)).toEqual([]);
    expect(runner).toHaveBeenCalledTimes(2);
  });

  it("treats a successful empty port lookup as no existing Tilt process", () => {
    const runner = vi.fn(() => "");
    expect(stopTiltOnPort(10350, "linux", runner)).toEqual([]);
  });

  it("fails closed when listener discovery is unavailable", () => {
    const missingLsof = Object.assign(new Error("lsof unavailable"), { code: "ENOENT" });
    const runner = vi.fn(() => {
      throw missingLsof;
    });

    expect(() => stopTiltOnPort(10350, "linux", runner)).toThrow(/Unable to inspect listeners/);
  });

  it("fails closed when lsof reports a discovery error", () => {
    const lookupError = Object.assign(new Error("permission denied"), {
      status: 1,
      stderr: "lsof: WARNING: can't stat()",
    });
    const runner = vi.fn(() => {
      throw lookupError;
    });

    expect(() => stopTiltOnPort(10350, "linux", runner)).toThrow(/Unable to inspect listeners/);
  });

  it("terminates the Tilt process only on the configured port", () => {
    const runner = vi.fn((command: string) => {
      if (command === "lsof") return "123\n";
      if (command === "ps") return "tilt\n";
      return "";
    });

    expect(stopTiltOnPort(10357, "darwin", runner)).toEqual([123]);
    expect(runner).toHaveBeenLastCalledWith("kill", ["-TERM", "123"]);
    expect(runner).not.toHaveBeenCalledWith("killall", expect.anything());
  });

  it("finds the Tilt process on the requested Windows port", () => {
    const runner = vi.fn((_command: string, _args: string[]) => "789\r\n");
    expect(findTiltProcessIdsOnPort(10350, "win32", runner)).toEqual([789]);
    expect(runner.mock.calls[0]?.[0]).toBe("powershell.exe");
    expect(runner.mock.calls[0]?.[1]?.[2]).toContain("LocalPort $port");
  });
});
