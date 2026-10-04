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
  it("times out while resources stay pending", async () => {
    const result = await waitForTiltResourcesReady(1, {
      ...opts,
      timeoutMs: 20,
      fetchJson: async () => json(item("api", "pending", "pending")),
    });
    expect(result).toMatchObject({ ready: false, timedOut: true, pending: 1 });
  });
});
