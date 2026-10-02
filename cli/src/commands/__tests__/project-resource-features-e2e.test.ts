import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "../../../..");
const cliBin = join(repoRoot, "cli", "bin", "tdk.js");

function runTdk(args: string[], cwd: string, input?: string): string {
  return execFileSync(process.execPath, [cliBin, ...args], {
    cwd,
    encoding: "utf-8",
    input,
    env: {
      ...process.env,
      TDK_EXTENSION_SOURCE: repoRoot,
    },
  });
}

/** `tdk doctor` exits non-zero on machines without Docker, so read its output either way. */
function runTdkAllowFailure(args: string[], cwd: string): string {
  const result = spawnSync(process.execPath, [cliBin, ...args], {
    cwd,
    encoding: "utf-8",
    env: { ...process.env, TDK_EXTENSION_SOURCE: repoRoot },
  });
  return `${result.stdout}${result.stderr}`;
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
    if (projectRoot?.startsWith(tmpdir())) {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  it("recreates a missing .env when `tdk project` runs in an already-initialised repo", () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-project-env-"));

    runTdk(["project", "--yes"], projectRoot);
    const envPath = join(projectRoot, ".env");
    expect(existsSync(envPath)).toBe(true);

    // A fresh clone has .tdk/project.json (committed) but no .env (gitignored).
    rmSync(envPath);
    runTdk(["project", "--yes"], projectRoot);

    const env = readFileSync(envPath, "utf-8");
    expect(env).toMatch(/^TILT_ENV=dev$/m);
    expect(env).toMatch(/^DB_PASSWORD=[0-9a-f]{32}$/m);
  }, 15000);

  it("generates a per-project JWT secret and a DATABASE_URL that uses the generated password", () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-project-env-secrets-"));
    const otherRoot = mkdtempSync(join(tmpdir(), "tdk-project-env-secrets-other-"));

    try {
      runTdk(["project", "--yes"], projectRoot);
      runTdk(["project", "--yes"], otherRoot);

      const env = readFileSync(join(projectRoot, ".env"), "utf-8");
      const other = readFileSync(join(otherRoot, ".env"), "utf-8");
      const jwt = env.match(/^JWT_SECRET=([0-9a-f]{64})$/m)?.[1];
      const password = env.match(/^DB_PASSWORD=([0-9a-f]{32})$/m)?.[1];

      expect(jwt).toBeDefined();
      // Two projects never share a signing secret, and the secret is not a documented default.
      expect(other.match(/^JWT_SECRET=([0-9a-f]{64})$/m)?.[1]).not.toBe(jwt);
      expect(env).not.toContain("local-development-secret");
      expect(env).toContain(`postgresql://postgres:${password}@`);
      expect(env).not.toContain(":postgres@");
    } finally {
      rmSync(otherRoot, { recursive: true, force: true });
    }
  }, 30000);

  it("completes an older .env on `tdk project` without rotating any existing value", () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-project-env-upgrade-"));
    runTdk(["project", "--yes"], projectRoot);

    // What a previous CLI wrote: no JWT_SECRET, and Verdaccio required.
    const envPath = join(projectRoot, ".env");
    writeFileSync(
      envPath,
      "VERDACCIO_URL_DOCKER=http://verdaccio:4873\nTILT_ENV=dev\nDB_PASSWORD=0123456789abcdef0123456789abcdef\nSTRIPE_KEY=sk_test_keep_me\n",
    );

    runTdk(["project", "--yes"], projectRoot);

    const env = readFileSync(envPath, "utf-8");
    expect(env).toMatch(/^JWT_SECRET=[0-9a-f]{64}$/m);
    expect(env).toMatch(/^DB_PASSWORD=0123456789abcdef0123456789abcdef$/m);
    expect(env).toMatch(/^STRIPE_KEY=sk_test_keep_me$/m);
    expect(env.match(/^JWT_SECRET=/gm)).toHaveLength(1);

    // A second run changes nothing: the secret it added is not rotated.
    runTdk(["project", "--yes"], projectRoot);
    expect(readFileSync(envPath, "utf-8")).toBe(env);
  }, 30000);

  it("reports a DATABASE_URL password that differs from DB_PASSWORD in `tdk doctor`", () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-project-env-mismatch-"));
    runTdk(["project", "--yes"], projectRoot);
    writeFileSync(
      join(projectRoot, ".env"),
      "TILT_ENV=dev\nDB_PASSWORD=0123456789abcdef0123456789abcdef\nDATABASE_URL=postgresql://postgres:postgres@postgres:5432/app_dev\n",
    );

    expect(runTdkAllowFailure(["doctor"], projectRoot)).toMatch(
      /warning: DATABASE_URL carries a different password than DB_PASSWORD/,
    );
  }, 60000);

  it("calls a deprecated service.json field deprecated, not unknown, in `tdk doctor`", () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-project-deprecated-"));
    runTdk(["project", "--yes"], projectRoot);
    runTdk(["resource", "dep-api", "--type", "backend", "--stack", "app", "--yes"], projectRoot);
    const servicePath = join(projectRoot, "services", "app", "dep-api", "service.json");
    const service = JSON.parse(readFileSync(servicePath, "utf-8"));
    service.envVars = { LOG_LEVEL: "debug" };
    service.dependencies = ["other"];
    writeFileSync(servicePath, JSON.stringify(service, null, 2));

    const output = runTdkAllowFailure(["doctor"], projectRoot);
    expect(output).toContain("service.json.envVars: deprecated, use params");
    expect(output).toContain("service.json.dependencies: deprecated, use dependsOn");
    // A deprecation is not an unknown field, and the message must not claim it is.
    expect(output).not.toMatch(/Unknown service\.json field: [^\n]*envVars/);
    expect(output).not.toMatch(/Unknown service\.json field: [^\n]*dependencies/);
  }, 90000);

  it("does not require Verdaccio for `tdk doctor`'s environment check", () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-project-env-noverdaccio-"));
    runTdk(["project", "--yes"], projectRoot);
    writeFileSync(
      join(projectRoot, ".env"),
      "TILT_ENV=dev\nDB_PASSWORD=0123456789abcdef0123456789abcdef\n",
    );

    const output = runTdkAllowFailure(["doctor"], projectRoot);
    expect(output).not.toMatch(/Missing required env variables/);
    expect(output).not.toContain("VERDACCIO_URL_DOCKER");
  }, 60000);

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

    // Without TDK_LICENSE_KEY granting it, enabling verdaccio must be refused
    // outright (config.ts:toggleInfraService) rather than silently accepted
    // and then downgraded back to false by generateMasterConfigs.
    expect(() => runTdk(["config", "enable-infra", "verdaccio"], projectRoot)).toThrow(
      /Premium feature/,
    );

    const updatedProjectJson = JSON.parse(readFileSync(projectJsonPath, "utf-8"));
    expect(updatedProjectJson.phases.pre_alpha.enabledStacks).not.toContain("verdaccio");
    expect(updatedProjectJson.optional_infra.verdaccio).toBe(false);

    spec = readFileSync(join(projectRoot, ".tdk", ".tdk-out", "spec.master"), "utf-8");
    expect(starlarkSection(spec, "PRE_ALPHA_RESOURCES")).not.toContain('"verdaccio": True');
    expect(starlarkSection(spec, "OPTIONAL_INFRA_RESOURCES")).toContain('"verdaccio": False');
  }, 10000);

  it("warns instead of silently stripping stale Verdaccio state when no premium license grants it", () => {
    // generateMasterConfigs() intentionally does not enforce the license
    // gate itself (see the comment above hasVerdaccioLicense's call site in
    // template-engine.ts): the real enforcement is that the free-tier
    // verdaccio_loader.star in this public repo is a no-op stub, so hand-
    // edited state here has no functional effect without the private
    // premium overlay. It just warns so the user isn't left guessing.
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-stale-verdaccio-"));

    runTdk(["project", "--yes"], projectRoot);

    const projectJsonPath = join(projectRoot, ".tdk", "project.json");
    const projectJson = JSON.parse(readFileSync(projectJsonPath, "utf-8"));
    projectJson.phases.pre_alpha.enabledStacks.push("verdaccio");
    projectJson.optional_infra.verdaccio = true;
    writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 2));

    runTdk(["config", "regenerate"], projectRoot);

    const updatedProjectJson = JSON.parse(readFileSync(projectJsonPath, "utf-8"));
    expect(updatedProjectJson.phases.pre_alpha.enabledStacks).toContain("verdaccio");
    expect(updatedProjectJson.optional_infra.verdaccio).toBe(true);

    const spec = readFileSync(join(projectRoot, ".tdk", ".tdk-out", "spec.master"), "utf-8");
    expect(starlarkSection(spec, "PRE_ALPHA_RESOURCES")).toContain('"verdaccio": True');
    expect(starlarkSection(spec, "OPTIONAL_INFRA_RESOURCES")).toContain('"verdaccio": True');
  }, 10000);

  it("copies Docker runtime assets and creates the root workspace manifest during project generation", () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-project-runtime-assets-"));

    runTdk(["project", "--yes"], projectRoot);

    const rootPackageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf-8"));
    expect(rootPackageJson.private).toBe(true);
    expect(rootPackageJson.workspaces).toEqual(["services/*/*"]);

    for (const file of [
      "install-deps.sh",
      "bun-hoisted-symlink-fix.sh",
      "prisma-bun-client-link-fix.sh",
      "prisma-normalize-client.sh",
    ]) {
      expect(
        existsSync(join(projectRoot, "shared-platform-engineering", "docker-templates", file)),
      ).toBe(true);
    }
  }, 10000);

  it("vendors free env injection instead of Infisical credentials by default", () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-project-env-injection-"));

    runTdk(["project", "--yes"], projectRoot);

    const envGenerator = readFileSync(
      join(
        projectRoot,
        ".tdk",
        ".tdk-out",
        "tdk-cli-ext",
        "engine",
        "topologies",
        "platform",
        "docker",
        "secrets",
        "infisical.star",
      ),
      "utf-8",
    );
    expect(envGenerator).toContain("TDK_SECRET_PROVIDER");
    expect(envGenerator).not.toContain("INFISICAL_CLIENT_SECRET");

    const dockerfileGenerator = readFileSync(
      join(
        projectRoot,
        ".tdk",
        ".tdk-out",
        "tdk-cli-ext",
        "engine",
        "topologies",
        "platform",
        "docker",
        "dockerfile",
        "dockerfile.star",
      ),
      "utf-8",
    );
    expect(dockerfileGenerator).toContain("use_infisical=False");
  }, 10000);

  it("writes default resource-level features into generated service.json files", () => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-resource-feature-"));
    runTdk(["project", "--yes"], projectRoot);

    runTdk(
      ["resource", "api", "--type", "backend", "--stack", "alpha", "--path", "services/alpha/api"],
      projectRoot,
      "\n",
    );
    runTdk(
      ["resource", "web", "--type", "frontend", "--stack", "alpha", "--path", "services/alpha/web"],
      projectRoot,
      "\n",
    );

    const backendService = JSON.parse(
      readFileSync(join(projectRoot, "services", "alpha", "api", "service.json"), "utf-8"),
    );
    // No prisma by default: `tdk resource` creates no prisma/schema.prisma or dependency, so
    // enabling it made the generated Dockerfile fail on `COPY .../prisma` for every new backend.
    expect(backendService.featuresEnabled).toEqual([]);

    const frontendService = JSON.parse(
      readFileSync(join(projectRoot, "services", "alpha", "web", "service.json"), "utf-8"),
    );
    expect(frontendService.featuresEnabled).toEqual(["api-client", "env-config", "api-index"]);
  }, 10000);
});
