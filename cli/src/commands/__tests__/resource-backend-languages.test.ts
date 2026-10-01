import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BACKEND_LANGUAGES, DEFAULT_BACKEND_LANGUAGE } from "../../backend-languages/registry.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const cliBin = join(repoRoot, "cli", "bin", "tdk.js");

function tdk(args: string[], cwd: string, input = "y\n") {
  return spawnSync(process.execPath, [cliBin, ...args], {
    cwd,
    encoding: "utf-8",
    input,
    env: { ...process.env, TDK_EXTENSION_SOURCE: repoRoot },
  });
}

function listFiles(root: string, dir = root): string[] {
  return readdirSync(dir)
    .flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? listFiles(root, path) : [relative(root, path)];
    })
    .sort();
}

const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

// Captured from the CLI on main before the provider extraction: `tdk resource orders-api
// --type backend --stack shop` with no --language. Any drift here changes historical output.
const BUN_BASELINE: Record<string, string> = {
  Dockerfile: "774de124dcb019d75714cac2613b9f793ee66ed3d95f6b80f7b85150acae6145",
  "package.json": "398877b088717f97af437af3d2233a7863af6ef442a62ba0fafcf29830d29ee1",
  "service.json": "3045ec15b53d3b8106b28543209e127dd7bf940afa1b20001d5ee3a0923f4987",
  "src/index.ts": "f50139530382e929db7128be7cb55f3bbc5f2fae03264979d675d3be4d0f4ef3",
  "tests/orders-api.test.ts": "a4946ac3123eb4bee78d7b84304cad8b7c36d4268688e3c878da2aaa11ef98ab",
  "tsconfig.json": "6982db23a5ea4c059e7404031b33634884bf69395ed0b8c143c7079045942804",
};

describe("backend language registry", () => {
  it("keeps Bun the default and registers exactly bun, node, python", () => {
    expect(DEFAULT_BACKEND_LANGUAGE).toBe("bun");
    expect(Object.keys(BACKEND_LANGUAGES).sort()).toEqual(["bun", "node", "python"]);
  });

  it("matches the service schema enum", () => {
    const schema = JSON.parse(
      readFileSync(join(repoRoot, "engine", "schemas", "service-schema.json"), "utf-8"),
    );
    expect([...schema.properties.language.enum].sort()).toEqual(
      Object.keys(BACKEND_LANGUAGES).sort(),
    );
  });

  it("does not add generated-service dependencies to the CLI package", () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, "cli", "package.json"), "utf-8"));
    const all = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    for (const forbidden of ["fastapi", "uvicorn", "@hono/node-server"]) {
      expect(all).not.toContain(forbidden);
    }
  });
});

describe("tdk resource --language", () => {
  let projectRoot = "";

  beforeAll(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-backend-language-"));
    execFileSync(process.execPath, [cliBin, "project", "--yes"], {
      cwd: projectRoot,
      env: { ...process.env, TDK_EXTENSION_SOURCE: repoRoot },
    });
  });

  afterAll(() => {
    if (projectRoot.startsWith(tmpdir())) rmSync(projectRoot, { recursive: true, force: true });
  });

  const dir = (name: string) => join(projectRoot, "services", "shop", name);
  const service = (name: string) =>
    JSON.parse(readFileSync(join(dir(name), "service.json"), "utf-8"));

  it("keeps the historical Bun output when --language is omitted", () => {
    const result = tdk(
      ["resource", "orders-api", "--type", "backend", "--stack", "shop"],
      projectRoot,
    );
    expect(result.status).toBe(0);

    const root = dir("orders-api");
    expect(listFiles(root)).toEqual(Object.keys(BUN_BASELINE).sort());
    for (const [file, hash] of Object.entries(BUN_BASELINE)) {
      expect(sha(join(root, file)), file).toBe(hash);
    }
    expect(service("orders-api").language).toBeUndefined();
  });

  it("scaffolds Node.js and normalizes the id case-insensitively", () => {
    const result = tdk(
      ["resource", "node-api", "--type", "backend", "--language", "Node", "--stack", "shop"],
      projectRoot,
    );
    expect(result.status).toBe(0);

    const root = dir("node-api");
    const manifest = service("node-api");
    expect(manifest).toMatchObject({
      language: "node",
      appType: "backend",
      healthCheckPath: "/health",
    });
    expect(manifest.dev.command).toContain("node --watch");
    expect(manifest.featuresEnabled).not.toContain("prisma");

    expect(listFiles(root)).toEqual([
      "Dockerfile",
      "package.json",
      "service.json",
      "src/index.ts",
      "tests/node-api.test.ts",
      "tsconfig.json",
    ]);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
    expect(pkg.scripts.start).toBe("node dist/index.js");
    expect(readFileSync(join(root, "Dockerfile"), "utf-8")).toMatch(/^FROM node:/);
    expect(readFileSync(join(root, "Dockerfile"), "utf-8")).not.toContain("bun");
    expect(readFileSync(join(root, "src/index.ts"), "utf-8")).toContain("/health");
    expect(existsSync(join(root, "bunfig.toml"))).toBe(false);
  });

  it("scaffolds Python with FastAPI, a pytest smoke test, and a python:3.12-slim image", () => {
    const result = tdk(
      ["resource", "py-api", "--type", "backend", "--language", "python", "--stack", "shop"],
      projectRoot,
    );
    expect(result.status).toBe(0);

    const root = dir("py-api");
    expect(service("py-api")).toMatchObject({
      language: "python",
      appType: "backend",
      healthCheckPath: "/health",
    });
    expect(listFiles(root)).toEqual([
      "Dockerfile",
      "pyproject.toml",
      "service.json",
      "src/main.py",
      "tests/test_health.py",
    ]);
    const pyproject = readFileSync(join(root, "pyproject.toml"), "utf-8");
    expect(pyproject).toMatch(/fastapi==/);
    expect(pyproject).toMatch(/uvicorn\[standard\]==/);
    const dockerfile = readFileSync(join(root, "Dockerfile"), "utf-8");
    expect(dockerfile).toContain("FROM python:3.12-slim");
    expect(dockerfile).toContain("uvicorn");
    expect(dockerfile).not.toMatch(/bun|node:/);
    expect(readFileSync(join(root, "tests/test_health.py"), "utf-8")).toContain('"/health"');
  });

  it("persists an explicit bun selection", () => {
    const result = tdk(
      ["resource", "bun-api", "--type", "backend", "--language", "bun", "--stack", "shop"],
      projectRoot,
    );
    expect(result.status).toBe(0);
    expect(service("bun-api").language).toBe("bun");
    expect(listFiles(dir("bun-api"))).toEqual(
      Object.keys(BUN_BASELINE)
        .map((f) => f.replace("orders-api", "bun-api"))
        .sort(),
    );
  });

  it("rejects an unknown language before creating the directory", () => {
    const result = tdk(
      ["resource", "ruby-api", "--type", "backend", "--language", "ruby", "--stack", "shop"],
      projectRoot,
    );
    expect(result.status).not.toBe(0);
    const output = `${result.stdout}${result.stderr}`;
    for (const id of ["bun", "node", "python"]) expect(output).toContain(id);
    expect(existsSync(dir("ruby-api"))).toBe(false);
  });

  it.each(["frontend", "worker", "bring-your-own", "sdk"])(
    "rejects --language on a %s resource",
    (type) => {
      const name = `lang-${type}`;
      const result = tdk(
        ["resource", name, "--type", type, "--language", "node", "--stack", "shop"],
        projectRoot,
      );
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toContain(
        "--language can only be used with --type backend",
      );
      expect(existsSync(dir(name))).toBe(false);
    },
  );
});
