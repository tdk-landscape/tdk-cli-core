import { describe, expect, it } from "vitest";
import { waitForTiltResourcesReady } from "../up-readiness.js";

const item = (name: string, updateStatus: string, runtimeStatus: string) => ({
  metadata: { name },
  status: { updateStatus, runtimeStatus },
});
const json = (...items: unknown[]) => JSON.stringify({ items });
const opts = { intervalMs: 1, deferred: new Set<string>() };

describe("waitForTiltResourcesReady", () => {
  it("waits for pending resources, then reports ready", async () => {
    const responses = [
      json(item("api", "pending", "pending")),
      json(item("api", "ok", "ok"), item("web", "ok", "not_applicable")),
    ];
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      fetchJson: async () => responses.shift() ?? null,
    });
    expect(result.ready).toBe(true);
  });
  it("is not ready when everything else settled but one resource errored", async () => {
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      fetchJson: async () => json(item("api", "ok", "ok"), item("db", "error", "none")),
    });
    expect(result.ready).toBe(false);
    expect(result.timedOut).toBe(false);
    expect(result.failures.map((f) => f.name)).toEqual(["db"]);
  });
  it("ignores deferred resources", async () => {
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      deferred: new Set(["lazy"]),
      fetchJson: async () => json(item("api", "ok", "ok"), item("lazy", "none", "none")),
    });
    expect(result.ready).toBe(true);
  });
  it("ignores resources Tilt reports as disabled, as in a partial or phased up", async () => {
    const disabled = {
      metadata: { name: "web-run-only" },
      status: { updateStatus: "none", runtimeStatus: "none", disableStatus: { state: "Disabled" } },
    };
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      fetchJson: async () => json(item("api", "ok", "ok"), disabled),
    });
    expect(result.ready).toBe(true);
  });
  it("treats a serve-only resource (update not_applicable) as built", async () => {
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      fetchJson: async () => json(item("api", "not_applicable", "ok")),
    });
    expect(result.ready).toBe(true);
  });
  it("reports an expected service that Tilt has disabled instead of filtering it out", async () => {
    const disabled = {
      metadata: { name: "catalog-api" },
      status: { updateStatus: "none", runtimeStatus: "none", disableStatus: { state: "Disabled" } },
    };
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      expected: ["catalog-api"],
      fetchJson: async () => json(item("postgres", "ok", "ok"), disabled),
    });
    expect(result.ready).toBe(false);
    expect(result.failures).toEqual([{ name: "catalog-api", message: "disabled in Tilt" }]);
  });
  it("is not ready while an expected service is not listed yet", async () => {
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      timeoutMs: 20,
      expected: ["catalog-api"],
      fetchJson: async () => json(item("postgres", "ok", "ok")),
    });
    expect(result).toMatchObject({ ready: false, timedOut: true });
  });
  it("is ready once every expected service is listed, enabled and running", async () => {
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      expected: ["catalog-api"],
      fetchJson: async () => json(item("postgres", "ok", "ok"), item("catalog-api", "ok", "ok")),
    });
    expect(result.ready).toBe(true);
  });
  it("keeps a not_applicable resource failed when its runtime status is an error", async () => {
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      fetchJson: async () =>
        json(item("api", "ok", "ok"), item("worker", "not_applicable", "error")),
    });
    expect(result.ready).toBe(false);
    expect(result.failures.map((f) => f.name)).toEqual(["worker"]);
  });
  it("returns the names Tilt has enabled", async () => {
    const disabled = {
      metadata: { name: "other" },
      status: { updateStatus: "none", runtimeStatus: "none", disableStatus: { state: "Disabled" } },
    };
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      fetchJson: async () => json(item("api", "ok", "ok"), disabled),
    });
    expect(result.enabled).toEqual(["api"]);
  });
  it("times out while resources stay pending", async () => {
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      timeoutMs: 20,
      fetchJson: async () => json(item("api", "pending", "pending")),
    });
    expect(result).toMatchObject({ ready: false, timedOut: true, pending: 1 });
  });
});
