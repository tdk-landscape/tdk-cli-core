import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("saas-starter cloning and discovery", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `tdk-saas-test-${Date.now()}`);
  });

  afterEach(() => {
    try {
      // Safety: only delete if path is under tmpdir and contains our test marker
      if (
        testDir &&
        testDir.startsWith(tmpdir()) &&
        testDir.includes("tdk-saas-test-") &&
        testDir.length > 20
      ) {
        execSync(`rm -rf "${testDir}"`, { stdio: "pipe" });
      }
    } catch {
      // cleanup best-effort
    }
  });

  /**
   * Verifies that `tdk project saas` clones the repo correctly with required
   * structure (services/stack/service/service.json files).
   */
  it("should clone saas-starter with valid file structure", () => {
    const cwd = testDir;
    execSync(`mkdir -p "${cwd}"`, { stdio: "pipe" });

    const result = execSync(`cd "${cwd}" && bun /Users/katerynaburym/Developer/Codex/tdk-cli-core/cli/bin/tdk.js project saas --yes`, {
      encoding: "utf-8",
      stdio: "pipe",
    });

    expect(result).toContain("Cloned");
    expect(existsSync(join(cwd, "tdk-saas-starter", "services"))).toBe(true);

    // Verify all 4 saas services exist with valid service.json
    const services = [
      "services/app/dashboard-api/service.json",
      "services/app/dashboard-app/service.json",
      "services/billing/billing-api/service.json",
      "services/billing/checkout-app/service.json",
    ];

    for (const svc of services) {
      const path = join(cwd, "tdk-saas-starter", svc);
      expect(existsSync(path)).toBe(true);
      const content = readFileSync(path, "utf-8");
      const manifest = JSON.parse(content);
      expect(manifest).toHaveProperty("appName");
      expect(manifest).toHaveProperty("stack");
      expect(manifest.healthCheck).toBeDefined();
    }
  });

  /**
   * Verifies that `tdk project --yes` (after cloning) correctly discovers
   * the existing service stacks (app, billing) from service.json files and
   * auto-populates them in project.json's pre_alpha services, so that
   * `tdk up` will enable them (before fix: they were silently filtered out
   * in Tilt discovery).
   */
  it("should auto-populate discovered services in project.json", () => {
    const cwd = testDir;
    execSync(`mkdir -p "${cwd}"`, { stdio: "pipe" });

    // Clone
    execSync(`cd "${cwd}" && bun /Users/katerynaburym/Developer/Codex/tdk-cli-core/cli/bin/tdk.js project saas --yes`, {
      stdio: "pipe",
    });

    const starterRoot = join(cwd, "tdk-saas-starter");

    // Create .env so tdk project doesn't fail on docker-compose validation
    execSync(`touch "${join(starterRoot, ".env")}"`, { stdio: "pipe" });

    // Generate project config
    execSync(
      `cd "${starterRoot}" && TDK_EXTENSION_SOURCE=/Users/katerynaburym/Developer/Codex/tdk-cli-extensions bun /Users/katerynaburym/Developer/Codex/tdk-cli-core/cli/bin/tdk.js project --yes`,
      { stdio: "pipe" }
    );

    // Verify project.json has services populated
    const projectJsonPath = join(starterRoot, ".tdk", "project.json");
    expect(existsSync(projectJsonPath)).toBe(true);

    const projectJson = JSON.parse(readFileSync(projectJsonPath, "utf-8"));
    expect(projectJson.stacks.pre_alpha.services).toContain("app");
    expect(projectJson.stacks.pre_alpha.services).toContain("billing");
  });

  /**
   * Verifies that spec.master is generated with PRE_ALPHA_RESOURCES dict
   * containing the discovered stacks, so that Tilt's should_enable() check
   * will allow them to pass through (before fix: PRE_ALPHA_RESOURCES was empty,
   * and only infra resources appeared in `tilt get uiresources`).
   */
  it("should generate spec.master with discovered services in PRE_ALPHA_RESOURCES", () => {
    const cwd = testDir;
    execSync(`mkdir -p "${cwd}"`, { stdio: "pipe" });

    execSync(`cd "${cwd}" && bun /Users/katerynaburym/Developer/Codex/tdk-cli-core/cli/bin/tdk.js project saas --yes`, {
      stdio: "pipe",
    });

    const starterRoot = join(cwd, "tdk-saas-starter");
    execSync(`touch "${join(starterRoot, ".env")}"`, { stdio: "pipe" });

    execSync(
      `cd "${starterRoot}" && TDK_EXTENSION_SOURCE=/Users/katerynaburym/Developer/Codex/tdk-cli-extensions bun /Users/katerynaburym/Developer/Codex/tdk-cli-core/cli/bin/tdk.js project --yes`,
      { stdio: "pipe" }
    );

    const specPath = join(starterRoot, ".tdk", ".tdk-out", "spec.master");
    expect(existsSync(specPath)).toBe(true);

    const specContent = readFileSync(specPath, "utf-8");

    // Before fix: PRE_ALPHA_RESOURCES = { }
    // After fix: PRE_ALPHA_RESOURCES = { "app": True, "billing": True, }
    expect(specContent).toContain('PRE_ALPHA_RESOURCES = {');
    expect(specContent).toMatch(/"app":\s*True/);
    expect(specContent).toMatch(/"billing":\s*True/);
    expect(specContent).toContain('FOCUS_PRE_ALPHA = list(PRE_ALPHA_RESOURCES.keys())');
  });

  /**
   * Verifies that `tdk doctor` correctly reports master configs as present
   * (they are in .tdk/.tdk-out/, not the project root).
   */
  it("should pass doctor check after project init", () => {
    const cwd = testDir;
    execSync(`mkdir -p "${cwd}"`, { stdio: "pipe" });

    execSync(`cd "${cwd}" && bun /Users/katerynaburym/Developer/Codex/tdk-cli-core/cli/bin/tdk.js project saas --yes`, {
      stdio: "pipe",
    });

    const starterRoot = join(cwd, "tdk-saas-starter");
    execSync(`touch "${join(starterRoot, ".env")}"`, { stdio: "pipe" });

    execSync(
      `cd "${starterRoot}" && TDK_EXTENSION_SOURCE=/Users/katerynaburym/Developer/Codex/tdk-cli-extensions bun /Users/katerynaburym/Developer/Codex/tdk-cli-core/cli/bin/tdk.js project --yes`,
      { stdio: "pipe" }
    );

    // Doctor should pass (all master configs present)
    const doctorResult = execSync(`cd "${starterRoot}" && bun /Users/katerynaburym/Developer/Codex/tdk-cli-core/cli/bin/tdk.js doctor`, {
      encoding: "utf-8",
      stdio: "pipe",
    });

    expect(doctorResult).toContain("Environment ready");
  });
});
