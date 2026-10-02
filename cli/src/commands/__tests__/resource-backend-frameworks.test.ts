import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  BACKEND_FRAMEWORKS,
  DEFAULT_BACKEND_FRAMEWORK,
  getBackendFramework,
  resolveBackendFramework,
} from "../../backend-frameworks/registry.js";

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

describe("backend framework registry", () => {
  it("keeps Hono the default and registers exactly hono, express, fastify", () => {
    expect(DEFAULT_BACKEND_FRAMEWORK).toBe("hono");
    expect(Object.keys(BACKEND_FRAMEWORKS).sort()).toEqual(["express", "fastify", "hono"]);
  });

  it("normalizes case and rejects unknown ids, including prototype keys", () => {
    expect(getBackendFramework(" Express ").id).toBe("express");
    expect(() => getBackendFramework("koa")).toThrow(
      /Supported frameworks: hono, express, fastify/,
    );
    expect(() => getBackendFramework("__proto__")).toThrow(/Unknown backend framework/);
  });

  it("only applies to backends, and not to a language that owns its runtime", () => {
    expect(resolveBackendFramework("backend")).toBeUndefined();
    expect(resolveBackendFramework("frontend", "express")).toBeUndefined();
    expect(resolveBackendFramework("backend", "express")?.id).toBe("express");
    expect(() =>
      resolveBackendFramework("backend", "express", { id: "python", createFiles: () => [] }),
    ).toThrow(/cannot be combined with --language python/);
  });

  it("keeps Express source and dependencies in its provider", () => {
    const provider = getBackendFramework("express");
    const index = provider.createIndex("orders-api");

    expect(provider.dependencies).toHaveProperty("express");
    expect(provider.dependencies).not.toHaveProperty("hono");
    expect(provider.devDependencies).toHaveProperty("@types/express");
    expect(index).toContain("from 'express'");
    expect(index).toContain("app.get('/health'");
    expect(index).toContain("process.env.PORT");
    // Traefik reaches the container over the Docker network, so loopback-only would be unreachable.
    expect(index).toContain("'0.0.0.0'");
    expect(index).not.toContain("hono");
  });

  it("keeps Fastify source and dependencies in its provider", () => {
    const provider = getBackendFramework("fastify");
    const index = provider.createIndex("orders-api");

    expect(provider.dependencies).toHaveProperty("fastify");
    expect(provider.dependencies).not.toHaveProperty("hono");
    expect(provider.dependencies).not.toHaveProperty("express");
    expect(index).toContain("from 'fastify'");
    expect(index).toContain("app.get('/health'");
    expect(index).toContain("process.env.PORT");
    expect(index).toContain("host: '0.0.0.0'");
    expect(index).not.toContain("hono");
  });

  it("does not add generated-service dependencies to the CLI package", () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, "cli", "package.json"), "utf-8"));
    const all = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(all).not.toContain("express");
    expect(all).not.toContain("@types/express");
    expect(all).not.toContain("fastify");
  });

  it("keeps the service schema open to every registered framework id", () => {
    const schema = JSON.parse(
      readFileSync(join(repoRoot, "engine", "schemas", "service-schema.json"), "utf-8"),
    );
    expect(schema.properties.framework.enum).toBeUndefined();
    const idPattern = new RegExp(schema.properties.framework.pattern);
    for (const id of Object.keys(BACKEND_FRAMEWORKS)) expect(id).toMatch(idPattern);
  });
});

describe("tdk resource --framework on a backend", () => {
  let projectRoot = "";

  beforeAll(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "tdk-backend-framework-"));
    execFileSync(process.execPath, [cliBin, "project", "--yes"], {
      cwd: projectRoot,
      env: { ...process.env, TDK_EXTENSION_SOURCE: repoRoot },
    });
  }, 15000);

  afterAll(() => {
    if (projectRoot.startsWith(tmpdir())) rmSync(projectRoot, { recursive: true, force: true });
  }, 15000);

  const dir = (name: string) => join(projectRoot, "services", "shop", name);
  const json = (name: string, file: string) =>
    JSON.parse(readFileSync(join(dir(name), file), "utf-8"));

  it("scaffolds Express with its own source and dependencies, on the shared Bun image", () => {
    const result = tdk(
      ["resource", "express-api", "--type", "backend", "--framework", "express", "--stack", "shop"],
      projectRoot,
    );
    expect(result.status, result.stderr).toBe(0);

    const root = dir("express-api");
    expect(json("express-api", "service.json")).toMatchObject({
      appType: "backend",
      framework: "express",
    });
    // Express runs on the same Bun image, so the shared Dockerfile and tsconfig are kept.
    expect(existsSync(join(root, "Dockerfile"))).toBe(true);
    expect(existsSync(join(root, "tsconfig.json"))).toBe(true);
    expect(json("express-api", "service.json").language).toBeUndefined();

    const pkg = json("express-api", "package.json");
    expect(pkg.dependencies).toHaveProperty("express");
    expect(pkg.dependencies).not.toHaveProperty("hono");
    expect(pkg.devDependencies).toHaveProperty("@types/express");

    const index = readFileSync(join(root, "src", "index.ts"), "utf-8");
    expect(index).toContain("from 'express'");
    expect(index).not.toContain("Hono");
  }, 15000);

  it("scaffolds Fastify on the shared Bun image with its own source and dependencies", () => {
    const result = tdk(
      ["resource", "fastify-api", "--type", "backend", "--framework", "fastify", "--stack", "shop"],
      projectRoot,
    );
    expect(result.status, result.stderr).toBe(0);

    expect(json("fastify-api", "service.json")).toMatchObject({
      appType: "backend",
      framework: "fastify",
    });
    expect(existsSync(join(dir("fastify-api"), "Dockerfile"))).toBe(true);
    const pkg = json("fastify-api", "package.json");
    expect(pkg.dependencies).toHaveProperty("fastify");
    expect(pkg.dependencies).not.toHaveProperty("hono");
    expect(readFileSync(join(dir("fastify-api"), "src", "index.ts"), "utf-8")).toContain(
      "from 'fastify'",
    );
  }, 15000);

  it("persists an explicit hono selection and keeps the Hono source", () => {
    const result = tdk(
      ["resource", "hono-api", "--type", "backend", "--framework", "hono", "--stack", "shop"],
      projectRoot,
    );
    expect(result.status, result.stderr).toBe(0);
    expect(json("hono-api", "service.json").framework).toBe("hono");
    expect(json("hono-api", "package.json").dependencies).toHaveProperty("hono");
    expect(readFileSync(join(dir("hono-api"), "src", "index.ts"), "utf-8")).toContain("new Hono()");
  }, 15000);

  it("leaves a backend without --framework on Hono with no framework field", () => {
    const result = tdk(
      ["resource", "plain-api", "--type", "backend", "--stack", "shop"],
      projectRoot,
    );
    expect(result.status).toBe(0);
    expect(json("plain-api", "service.json")).not.toHaveProperty("framework");
    expect(json("plain-api", "package.json").dependencies).toHaveProperty("hono");
  }, 15000);

  it("rejects an unknown framework, Python, and other resource types before writing", () => {
    const unknown = tdk(
      ["resource", "bad-api", "--type", "backend", "--framework", "koa", "--stack", "shop"],
      projectRoot,
    );
    expect(unknown.status).not.toBe(0);
    expect(`${unknown.stdout}${unknown.stderr}`).toMatch(/Unknown backend framework "koa"/);
    expect(existsSync(dir("bad-api"))).toBe(false);

    const python = tdk(
      [
        "resource",
        "py-express",
        "--type",
        "backend",
        "--language",
        "python",
        "--framework",
        "express",
        "--stack",
        "shop",
      ],
      projectRoot,
    );
    expect(python.status).not.toBe(0);
    expect(`${python.stdout}${python.stderr}`).toMatch(/cannot be combined with --language python/);
    expect(existsSync(dir("py-express"))).toBe(false);

    const worker = tdk(
      ["resource", "job", "--type", "worker", "--framework", "express", "--stack", "shop"],
      projectRoot,
    );
    expect(worker.status).not.toBe(0);
    expect(`${worker.stdout}${worker.stderr}`).toMatch(/only be used with --type frontend or/);
    expect(existsSync(dir("job"))).toBe(false);
  }, 15000);
});
