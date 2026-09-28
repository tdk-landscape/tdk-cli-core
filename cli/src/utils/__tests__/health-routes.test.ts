import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkHealthRoutes } from "../doctor-runtime.js";

describe("checkHealthRoutes", () => {
  let root: string;

  function service(name: string, config: Record<string, unknown>, files: Record<string, string>) {
    const dir = join(root, "services", "shop", name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "service.json"),
      JSON.stringify({ appName: name, stack: "shop", port: 4000, ...config }),
    );
    for (const [file, content] of Object.entries(files)) {
      mkdirSync(join(dir, file, ".."), { recursive: true });
      writeFileSync(join(dir, file), content);
    }
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "tdk-health-routes-"));
    mkdirSync(join(root, ".tdk"), { recursive: true });
    writeFileSync(
      join(root, ".tdk", "project.json"),
      JSON.stringify({ project: { name: "shop" } }),
    );
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("passes when the backend defines /health", () => {
    service(
      "orders-api",
      { appType: "backend" },
      {
        "src/index.ts": "app.get('/health', (c) => c.json({ status: 'ok' }));",
      },
    );
    const result = checkHealthRoutes(root);
    expect(result.didPass).toBe(true);
    expect(result.message).toContain("1 backend define");
  });

  it("fails and names the backend when the route is missing", () => {
    service(
      "orders-api",
      { appType: "backend" },
      {
        "src/index.ts": 'app.get("/orders", (c) => c.json([]));',
      },
    );
    const result = checkHealthRoutes(root);
    expect(result.didPass).toBe(false);
    expect(result.message).toContain('orders-api: no "/health" route');
    expect(result.message).toContain("404");
    expect(result.fix).toContain('app.get("/health"');
  });

  it("uses healthCheckPath from service.json", () => {
    service(
      "orders-api",
      { appType: "backend", healthCheckPath: "/status" },
      {
        "src/index.ts": "app.get('/health', h); // old path",
      },
    );
    const missing = checkHealthRoutes(root);
    expect(missing.didPass).toBe(false);
    expect(missing.message).toContain('no "/status" route');

    writeFileSync(
      join(root, "services", "shop", "orders-api", "src", "index.ts"),
      "router.get(`/status`, h);",
    );
    expect(checkHealthRoutes(root).didPass).toBe(true);
  });

  it("finds the route in a nested file", () => {
    service(
      "orders-api",
      { appType: "backend" },
      {
        "src/index.ts": "import { routes } from './http/routes';",
        "src/http/routes.ts": 'if (url.pathname === "/health") return ok();',
      },
    );
    expect(checkHealthRoutes(root).didPass).toBe(true);
  });

  it("does not count a mention in a test file", () => {
    service(
      "orders-api",
      { appType: "backend" },
      {
        "src/index.ts": "app.get('/orders', h);",
        "src/index.test.ts": "await fetch('/health');",
      },
    );
    expect(checkHealthRoutes(root).didPass).toBe(false);
  });

  it("skips when there are no backends, and ignores frontends", () => {
    service("storefront", { appType: "frontend" }, { "src/main.ts": "render();" });
    const result = checkHealthRoutes(root);
    expect(result.isSkipped).toBe(true);
  });
});
