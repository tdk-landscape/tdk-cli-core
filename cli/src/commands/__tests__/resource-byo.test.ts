import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { networksCommand } from "../../commands/networks.js";
import { resolveByoPort, resourceCommand } from "../../commands/resource.js";
import { resourcesCommand } from "../../commands/resources.js";
import { statusCommand } from "../../commands/status.js";
import { upCommand } from "../../commands/up.js";
import { clearDiscoveryCache } from "../../utils/discovery-context.js";
import { discoverResourcesFromRoot, resetPrintedServiceWarnings } from "../../utils/services.js";

const originalCwd = process.cwd();

function snapshotTree(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory()) return [entryPath, ...snapshotTree(entryPath)];
    return [`${entryPath}:${readFileSync(entryPath, "utf-8")}`];
  });
}

describe("bring-your-own resource type", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "tdk-byo-test-"));
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
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function createByo(args: string[] = [], output?: string[]): Promise<string> {
    const originalLog = console.log;
    if (output) console.log = (...values: unknown[]) => output.push(values.join(" "));
    try {
      await resourceCommand.parseAsync(
        ["node", "tdk", "widget", "--type", "byo", "--stack", "shop", "--yes", ...args],
        { from: "node" },
      );
    } finally {
      if (output) console.log = originalLog;
    }
    return join(tempDir, "services", "shop", "widget");
  }

  it("creates a discoverable service.json without scaffolding source", async () => {
    const resourcePath = await createByo();
    const service = JSON.parse(readFileSync(join(resourcePath, "service.json"), "utf-8"));

    expect(service).toMatchObject({
      appName: "widget",
      appType: "bring-your-own",
      stack: "shop",
      port: expect.any(Number),
      healthCheckPath: "/health",
      dockerfile: "./Dockerfile",
    });
    expect(service).not.toHaveProperty("exposeViaProxy");
    expect(service).not.toHaveProperty("restart");
    expect(existsSync(join(resourcePath, "src"))).toBe(false);
    expect(existsSync(join(resourcePath, "package.json"))).toBe(false);
    expect(existsSync(join(resourcePath, "tsconfig.json"))).toBe(false);
    expect(existsSync(join(resourcePath, "tests"))).toBe(false);
    expect(discoverResourcesFromRoot(tempDir).map((resource) => resource.name)).toContain("widget");
  });

  it("lists the resource through tdk resources and tdk up --dry-run", async () => {
    await createByo();
    const output: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => output.push(args.join(" "));

    try {
      await resourcesCommand.parseAsync(["node", "tdk", "--stack", "shop"], { from: "node" });
      expect(output.join("\n")).toContain("widget [shop]");

      output.length = 0;
      await resourcesCommand.parseAsync(["node", "tdk", "--stack", "shop", "--json"], {
        from: "node",
      });
      const resourcesReport = JSON.parse(output.join("\n"));
      expect(resourcesReport.schemaVersion).toBe(1);
      expect(resourcesReport.errors).toEqual([]);
      expect(resourcesReport.data.resources).toMatchObject([
        { name: "widget", stack: "shop", type: "bring-your-own" },
      ]);

      output.length = 0;
      await statusCommand.parseAsync(["node", "tdk", "--json"], { from: "node" });
      const statusReport = JSON.parse(output.join("\n"));
      expect(statusReport.schemaVersion).toBe(1);
      expect(statusReport.data.resources).toMatchObject([{ name: "widget", stack: "shop" }]);

      output.length = 0;
      await networksCommand.parseAsync(["node", "tdk", "--json"], { from: "node" });
      const networksReport = JSON.parse(output.join("\n"));
      expect(networksReport.schemaVersion).toBe(1);
      expect(networksReport.errors).toEqual([]);
      expect(networksReport.data.services).toEqual([]);

      output.length = 0;
      await networksCommand.parseAsync(["node", "tdk", "--json-legacy"], { from: "node" });
      expect(JSON.parse(output.join("\n"))).toEqual([]);

      output.length = 0;
      await upCommand.parseAsync(["node", "tdk", "shop", "--dry-run"], { from: "node" });
      expect(output.join("\n")).toContain('Would start 1 service from stack "shop"');
      expect(output.join("\n")).toContain("- widget");
    } finally {
      console.log = originalLog;
    }
  }, 15_000);

  it("fails missing stack filters in text commands", async () => {
    await createByo();
    const output: string[] = [];
    const errors: string[] = [];
    const log = vi.spyOn(console, "log").mockImplementation((...parts: unknown[]) => {
      output.push(parts.map(String).join(" "));
    });
    const error = vi.spyOn(console, "error").mockImplementation((...parts: unknown[]) => {
      errors.push(parts.map(String).join(" "));
    });
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);

    try {
      for (const command of [resourcesCommand, networksCommand]) {
        output.length = 0;
        errors.length = 0;
        exit.mockClear();
        clearDiscoveryCache();
        await command
          .parseAsync(["node", "tdk", "--stack", "missing"], { from: "node" })
          .catch(() => {});

        expect(exit).toHaveBeenCalledWith(1);
        const combined = [...output, ...errors].join("\n");
        expect(combined).toContain('Stack "missing" not found');
        expect(combined).toContain("tdk stacks");
      }
    } finally {
      log.mockRestore();
      error.mockRestore();
      exit.mockRestore();
      clearDiscoveryCache();
    }
  });
  it("keeps --dry-run side-effect free even when --force is also set", async () => {
    await createByo();
    const before = snapshotTree(tempDir);
    const originalTiltPort = process.env.TILT_PORT;
    delete process.env.TILT_PORT;

    try {
      await upCommand.parseAsync(["node", "tdk", "shop", "--dry-run", "--force", "--quiet"], {
        from: "node",
      });
      expect(snapshotTree(tempDir)).toEqual(before);
      expect(process.env.TILT_PORT).toBeUndefined();
    } finally {
      if (originalTiltPort === undefined) delete process.env.TILT_PORT;
      else process.env.TILT_PORT = originalTiltPort;
    }
  });

  it("creates a port-matched Dockerfile stub when none exists", async () => {
    const resourcePath = await createByo();
    const service = JSON.parse(readFileSync(join(resourcePath, "service.json"), "utf-8"));
    const dockerfile = readFileSync(join(resourcePath, "Dockerfile"), "utf-8");
    const healthConfig = readFileSync(join(resourcePath, "health.conf"), "utf-8");

    expect(dockerfile).toContain(`EXPOSE ${service.port}`);
    expect(healthConfig).toContain(`listen ${service.port}`);
  });

  it("uses --image without writing a Dockerfile", async () => {
    const resourcePath = await createByo(["--image", "nginx:alpine"]);
    const service = JSON.parse(readFileSync(join(resourcePath, "service.json"), "utf-8"));

    expect(service.image).toBe("nginx:alpine");
    expect(service).not.toHaveProperty("dockerfile");
    expect(existsSync(join(resourcePath, "Dockerfile"))).toBe(false);
  });

  it("does not overwrite an existing Dockerfile", async () => {
    const resourcePath = join(tempDir, "services", "shop", "widget");
    mkdirSync(resourcePath, { recursive: true });
    const dockerfilePath = join(resourcePath, "Dockerfile");
    const existingContent = "# Custom Dockerfile\nFROM ubuntu:latest\n";
    writeFileSync(dockerfilePath, existingContent);
    const existingAgents = "# Preserve these service instructions\n";
    writeFileSync(join(resourcePath, "AGENTS.md"), existingAgents);

    await createByo();

    expect(readFileSync(dockerfilePath, "utf-8")).toBe(existingContent);
    expect(readFileSync(join(resourcePath, "AGENTS.md"), "utf-8")).toBe(existingAgents);
  });

  it("supports a nested Dockerfile path, a custom port, and --no-proxy", async () => {
    const resourcePath = await createByo([
      "--dockerfile",
      "container/Dockerfile",
      "--port",
      "4550",
      "--no-proxy",
    ]);
    const service = JSON.parse(readFileSync(join(resourcePath, "service.json"), "utf-8"));

    expect(service.port).toBe(4550);
    expect(service.dockerfile).toBe("container/Dockerfile");
    expect(service.exposeViaProxy).toBe(false);
    expect(readFileSync(join(resourcePath, "container", "Dockerfile"), "utf-8")).toContain(
      "EXPOSE 4550",
    );
    expect(readFileSync(join(resourcePath, "container", "Dockerfile"), "utf-8")).toContain(
      "COPY container/health.conf",
    );
    expect(existsSync(join(resourcePath, "container", "health.conf"))).toBe(true);
  });

  it("stores --restart for one-shot jobs and leaves it out by default", async () => {
    const job = await createByo(["--restart", "no"]);
    expect(JSON.parse(readFileSync(join(job, "service.json"), "utf-8")).restart).toBe("no");
  });

  it("rejects an unknown --restart policy before creating the resource", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exit");
    }) as never);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(createByo(["--restart", "sometimes"])).rejects.toThrow("exit");
      expect(errors.mock.calls.flat().join("\n")).toContain('Unknown --restart policy "sometimes"');
    } finally {
      exit.mockRestore();
      errors.mockRestore();
    }
    expect(existsSync(join(tempDir, "services", "shop", "widget"))).toBe(false);
  });

  it("prints and stores the requested custom port", async () => {
    const output: string[] = [];
    const resourcePath = await createByo(["--port", "4500"], output);
    const service = JSON.parse(readFileSync(join(resourcePath, "service.json"), "utf-8"));

    expect(output.join("\n")).toContain("Port: 4500");
    expect(service.port).toBe(4500);
  });

  it("rejects malformed, out-of-range, and conflicting custom ports", () => {
    expect(() => resolveByoPort("4550x", 4000, [])).toThrow(/integer from 4000 through 5999/);
    expect(() => resolveByoPort("3999", 4000, [])).toThrow(/integer from 4000 through 5999/);
    expect(() => resolveByoPort("4550", 4000, [{ config: { port: 4550 } }])).toThrow(
      /already assigned/,
    );
  });

  it("lists valid resources with a warning and keeps tdk up strict", async () => {
    await createByo();
    const badPath = join(tempDir, "services", "shop", "broken", "service.json");
    mkdirSync(dirname(badPath), { recursive: true });
    writeFileSync(badPath, "{ not json");

    const output: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const log = vi.spyOn(console, "log").mockImplementation((...parts: unknown[]) => {
      output.push(parts.map(String).join(" "));
    });
    const warn = vi.spyOn(console, "warn").mockImplementation((...parts: unknown[]) => {
      warnings.push(parts.map(String).join(" "));
    });

    try {
      clearDiscoveryCache();
      await resourcesCommand.parseAsync(["node", "tdk"], { from: "node" });
      expect(output.join("\n")).toContain("widget [shop]");
      expect(warnings.join("\n")).toContain(badPath);
      expect(warnings.join("\n")).toContain("invalid JSON");

      clearDiscoveryCache();
      resetPrintedServiceWarnings();
      output.length = 0;
      warnings.length = 0;
      await statusCommand.parseAsync(["node", "tdk", "--json"], { from: "node" });
      const report = JSON.parse(output.join("\n"));
      expect(report.data.resources).toMatchObject([{ name: "widget", stack: "shop" }]);
      expect(warnings.join("\n")).toContain(badPath);
      expect(warnings.join("\n")).toContain("invalid JSON");

      const previousWindowsOverride = process.env.TDK_ALLOW_NATIVE_WINDOWS;
      process.env.TDK_ALLOW_NATIVE_WINDOWS = "1";
      const error = vi.spyOn(console, "error").mockImplementation((...parts: unknown[]) => {
        errors.push(parts.map(String).join(" "));
      });
      const exit = vi.spyOn(process, "exit").mockImplementation((() => {
        throw new Error("process.exit");
      }) as never);
      try {
        clearDiscoveryCache();
        await upCommand
          .parseAsync(["node", "tdk", "--dry-run", "--quiet"], { from: "node" })
          .catch(() => {});
      } finally {
        error.mockRestore();
        exit.mockRestore();
        if (previousWindowsOverride === undefined) delete process.env.TDK_ALLOW_NATIVE_WINDOWS;
        else process.env.TDK_ALLOW_NATIVE_WINDOWS = previousWindowsOverride;
      }
      expect(errors.join("\n")).toContain(badPath);
    } finally {
      log.mockRestore();
      warn.mockRestore();
      clearDiscoveryCache();
    }
  });
});
