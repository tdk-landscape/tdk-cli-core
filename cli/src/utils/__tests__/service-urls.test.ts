import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DiscoveredResource } from "../../types/index.js";
import {
  appendHealthPath,
  buildHealthTargets,
  pingHealthTarget,
  resolveServicePath,
  resolveSubdomainBases,
} from "../service-urls.js";

function resource(
  name: string,
  appType: string,
  config: Record<string, unknown> = {},
): DiscoveredResource {
  return {
    name,
    path: `/tmp/${name}`,
    configPath: `/tmp/${name}/service.json`,
    config: { appName: name, appType, ...config } as DiscoveredResource["config"],
  };
}

describe("appendHealthPath", () => {
  it("appends /health", () => {
    expect(appendHealthPath("/menu")).toBe("/menu/health");
  });

  it("collapses trailing slashes", () => {
    expect(appendHealthPath("/menu///")).toBe("/menu/health");
  });
});

describe("resolveSubdomainBases", () => {
  const original = process.env.TDK_SERVICE_BASE_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TDK_SERVICE_BASE_URL;
    } else {
      process.env.TDK_SERVICE_BASE_URL = original;
    }
  });

  it("splits a bare domain into app/api subdomains", () => {
    process.env.TDK_SERVICE_BASE_URL = "http://demo.localhost";
    expect(resolveSubdomainBases()).toEqual({
      appBase: "http://app.demo.localhost",
      apiBase: "http://api.demo.localhost",
    });
  });

  it("does not add subdomains to plain localhost", () => {
    process.env.TDK_SERVICE_BASE_URL = "http://localhost:8080";
    expect(resolveSubdomainBases()).toEqual({
      appBase: "http://localhost:8080",
      apiBase: "http://localhost:8080",
    });
  });
});

describe("resolveServicePath", () => {
  it("strips the -api suffix for backends", () => {
    expect(resolveServicePath(resource("menu-api", "backend"))).toBe("/api/menu");
  });

  it("prefers an explicit apiPath", () => {
    expect(resolveServicePath(resource("menu-api", "backend", { apiPath: "/api/v2/menu" }))).toBe(
      "/api/v2/menu",
    );
  });

  it("prefers an explicit basePath for frontends", () => {
    expect(resolveServicePath(resource("floor-app", "frontend", { basePath: "/floor" }))).toBe(
      "/floor",
    );
  });

  it("falls back to the service name for frontends", () => {
    expect(resolveServicePath(resource("floor-app", "frontend"))).toBe("/floor-app");
  });
});

describe("buildHealthTargets", () => {
  const original = process.env.TDK_SERVICE_BASE_URL;

  beforeEach(() => {
    process.env.TDK_SERVICE_BASE_URL = "http://demo.localhost";
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TDK_SERVICE_BASE_URL;
    } else {
      process.env.TDK_SERVICE_BASE_URL = original;
    }
  });

  it("routes frontends to app.* and backends to api.*", () => {
    const targets = buildHealthTargets([
      resource("floor-app", "frontend"),
      resource("menu-api", "backend"),
    ]);

    expect(targets).toEqual([
      { name: "floor-app", appType: "frontend", url: "http://app.demo.localhost/floor-app/health" },
      { name: "menu-api", appType: "backend", url: "http://api.demo.localhost/api/menu/health" },
    ]);
  });

  it("skips services that have no Traefik route", () => {
    const targets = buildHealthTargets([
      resource("kitchen-worker", "worker"),
      resource("shared-lib", "library"),
      resource("client-sdk", "sdk"),
      resource("db-migrator", "migrator"),
      resource("menu-api", "backend"),
    ]);

    expect(targets.map((t) => t.name)).toEqual(["menu-api"]);
  });
});

describe("pingHealthTarget", () => {
  const target = { name: "menu-api", appType: "backend" as const, url: "http://api/health" };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports ok for a 2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 200 })),
    );
    await expect(pingHealthTarget(target, 100)).resolves.toMatchObject({ ok: true, status: 200 });
  });

  it("reports the status code for a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 404 })),
    );
    await expect(pingHealthTarget(target, 100)).resolves.toMatchObject({ ok: false, status: 404 });
  });

  it("captures the reason when the request never completes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connect ECONNREFUSED");
      }),
    );
    const probe = await pingHealthTarget(target, 100);
    expect(probe.ok).toBe(false);
    expect(probe.status).toBeUndefined();
    expect(probe.error).toContain("ECONNREFUSED");
  });

  it("reports a timeout as a timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const err = new Error("timed out");
        err.name = "TimeoutError";
        throw err;
      }),
    );
    await expect(pingHealthTarget(target, 100)).resolves.toMatchObject({
      ok: false,
      error: "no response within 100ms",
    });
  });
});
