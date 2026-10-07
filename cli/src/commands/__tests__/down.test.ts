import { afterEach, describe, expect, it, vi } from "vitest";

const { runTiltMock } = vi.hoisted(() => ({ runTiltMock: vi.fn() }));

vi.mock("../../utils/errors.js", () => ({
  handleTiltFailure: vi.fn(),
  withTiltCheck: async (action: () => Promise<void>) => action(),
}));

vi.mock("../../utils/tilt.js", () => ({
  buildTiltDownArgs: vi.fn(),
  runTilt: runTiltMock,
}));

import { buildTiltDownArgs } from "../../utils/tilt.js";
import { downCommand } from "../down.js";

describe("tdk down", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    runTiltMock.mockReset();
  });

  it("prints the dry-run plan without building arguments or invoking Tilt", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      await downCommand.parseAsync(["node", "tdk", "--dry-run"], { from: "node" });

      const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
      expect(output).toContain("Dry run - not stopping resources");
      expect(output).toContain("Would run: tilt down");
      expect(buildTiltDownArgs).not.toHaveBeenCalled();
      expect(runTiltMock).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
