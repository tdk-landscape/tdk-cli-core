import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "../../../..");
const cliBin = join(repoRoot, "cli", "bin", "tdk.js");

function runTdk(args: string[], cwd: string, input?: string): string {
  return execFileSync("bun", [cliBin, ...args], {
    cwd,
    encoding: "utf-8",
    input,
    env: {
      ...process.env,
      TDK_EXTENSION_SOURCE: repoRoot,
    },
  });
}

function starlarkSection(content: string, name: string): string {
  const start = content.indexOf(`${name} = {`);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = content.indexOf("\n}", start);
  expect(end).toBeGreaterThan(start);
  return content.slice(start, end + 2);
}

describe("project and resource feature E2E", () => {
  let projectRoot = "";

  afterEach(() => {
    if (projectRoot && projectRoot.startsWith(tmpdir())) {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  it("keeps Verdaccio as an explicit premium project feature", () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-project-feature-"));

    runTdk(["project", "--yes"], projectRoot);

    const projectJsonPath = join(projectRoot, ".tdk", "project.json");
    const projectJson = JSON.parse(readFileSync(projectJsonPath, "utf-8"));
    expect(projectJson.phases.pre_alpha.enabledStacks).not.toContain("verdaccio");
    expect(projectJson.optional_infra.verdaccio).toBe(false);

    let spec = readFileSync(join(projectRoot, ".tdk", ".tdk-out", "spec.master"), "utf-8");
    expect(starlarkSection(spec, "PRE_ALPHA_RESOURCES")).not.toContain('"verdaccio": True');
    expect(starlarkSection(spec, "OPTIONAL_INFRA_RESOURCES")).toContain('"verdaccio": False');

    runTdk(["config", "enable-infra", "verdaccio"], projectRoot);
    runTdk(["project", "--yes"], projectRoot);

    const updatedProjectJson = JSON.parse(readFileSync(projectJsonPath, "utf-8"));
    expect(updatedProjectJson.phases.pre_alpha.enabledStacks).not.toContain("verdaccio");
    expect(updatedProjectJson.optional_infra.verdaccio).toBe(true);

    spec = readFileSync(join(projectRoot, ".tdk", ".tdk-out", "spec.master"), "utf-8");
    expect(starlarkSection(spec, "PRE_ALPHA_RESOURCES")).not.toContain('"verdaccio": True');
    expect(starlarkSection(spec, "OPTIONAL_INFRA_RESOURCES")).toContain('"verdaccio": True');
  }, 10000);

  it("writes default resource-level features into generated service.json files", () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-resource-feature-"));
    runTdk(["project", "--yes"], projectRoot);

    runTdk(
      [
        "resource",
        "api",
        "--type",
        "backend",
        "--stack",
        "alpha",
        "--path",
        "services/alpha/api",
      ],
      projectRoot,
      "\n",
    );
    runTdk(
      [
        "resource",
        "web",
        "--type",
        "frontend",
        "--stack",
        "alpha",
        "--path",
        "services/alpha/web",
      ],
      projectRoot,
      "\n",
    );

    const backendService = JSON.parse(
      readFileSync(join(projectRoot, "services", "alpha", "api", "service.json"), "utf-8"),
    );
    expect(backendService.features).toEqual(["prisma"]);

    const frontendService = JSON.parse(
      readFileSync(join(projectRoot, "services", "alpha", "web", "service.json"), "utf-8"),
    );
    expect(frontendService.features).toEqual(["api-client", "env-config", "api-index"]);
  }, 10000);
});
