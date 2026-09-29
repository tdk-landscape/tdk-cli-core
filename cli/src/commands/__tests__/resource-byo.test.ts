import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveByoPort, resourceCommand } from "../../commands/resource.js";
import { resourcesCommand } from "../../commands/resources.js";
import { upCommand } from "../../commands/up.js";
import { discoverResourcesFromRoot } from "../../utils/services.js";

const originalCwd = process.cwd();

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

  async function createByo(args: string[] = []): Promise<string> {
    await resourceCommand.parseAsync(
      ["node", "tdk", "widget", "--type", "byo", "--stack", "shop", "--yes", ...args],
      { from: "node" },
    );
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
      await upCommand.parseAsync(["node", "tdk", "shop", "--dry-run"], { from: "node" });
      expect(output.join("\n")).toContain('Would start 1 service from stack "shop"');
      expect(output.join("\n")).toContain("- widget");
    } finally {
      console.log = originalLog;
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

  it("rejects malformed, out-of-range, and conflicting custom ports", () => {
    expect(() => resolveByoPort("4550x", 4000, [])).toThrow(/integer from 4000 through 5999/);
    expect(() => resolveByoPort("3999", 4000, [])).toThrow(/integer from 4000 through 5999/);
    expect(() => resolveByoPort("4550", 4000, [{ config: { port: 4550 } }])).toThrow(
      /already assigned/,
    );
  });
});
