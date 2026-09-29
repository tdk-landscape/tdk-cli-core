import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EJECTED_CONTENT, ejectCommand } from "../eject.js";

const originalCwd = process.cwd();

describe("tdk eject", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "tdk-eject-test-"));
    mkdirSync(join(tempDir, ".tdk"), { recursive: true });
    writeFileSync(
      join(tempDir, ".tdk", "project.json"),
      JSON.stringify({
        version: "1.0.0",
        project: { name: "test", version: "1.0.0" },
        phases: Object.fromEntries(
          ["pre_alpha", "alpha", "beta", "out_of_scope"].map((name) => [
            name,
            { name, description: "", enabledStacks: [] },
          ]),
        ),
        optional_infra: {
          monitoring: false,
          elk: false,
          debezium: false,
          golden_image: false,
          verdaccio: false,
        },
        discovery: { paths: ["services/**"] },
      }),
    );
    mkdirSync(join(tempDir, ".tdk", ".tdk-out"), { recursive: true });
    writeFileSync(join(tempDir, ".tdk", ".tdk-out", "Tiltfile"), "# generated\n");
    writeFileSync(join(tempDir, ".tdk", ".tdk-out", "docker-compose.yml"), "services: {}\n");
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists kept and created files in dry-run without writing", async () => {
    const output: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => output.push(args.join(" "));

    try {
      await ejectCommand.parseAsync(["node", "tdk", "--dry-run"], { from: "node" });
    } finally {
      console.log = originalLog;
    }

    expect(output.join("\n")).toContain("Files kept:");
    expect(output.join("\n")).toContain("Files created:\n  EJECTED.md");
    expect(existsSync(join(tempDir, "EJECTED.md"))).toBe(false);
  });

  it("writes EJECTED.md and prints the next steps with --yes", async () => {
    const output: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => output.push(args.join(" "));

    try {
      await ejectCommand.parseAsync(["node", "tdk", "--yes"], { from: "node" });
    } finally {
      console.log = originalLog;
    }

    expect(readFileSync(join(tempDir, "EJECTED.md"), "utf-8")).toBe(EJECTED_CONTENT);
    expect(output).toEqual([
      "Ejected. Tilt and Docker files are yours.",
      "Next: tilt up",
      "Read EJECTED.md",
    ]);
  });

  it("requires a TDK project", async () => {
    rmSync(join(tempDir, ".tdk", "project.json"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    try {
      await ejectCommand.parseAsync(["node", "tdk", "--dry-run"], { from: "node" });
      expect(error).toHaveBeenCalledWith(
        expect.stringContaining("tdk eject: no .tdk/project.json in this directory or parents"),
      );
      expect(exit).toHaveBeenCalledWith(1);
    } finally {
      error.mockRestore();
      exit.mockRestore();
    }
  });
});
