import { describe, expect, it } from "vitest";
import type { DiscoveredResource } from "../../types/index.js";
import {
  buildSmokePlans,
  runSmokePlan,
  type SmokeConfig,
  type SmokePlan,
  validateSmoke,
} from "../smoke.js";

const SMOKE: SmokeConfig = {
  via: "proxy",
  timeoutSeconds: 5,
  steps: [
    {
      name: "create",
      method: "POST",
      path: "/records",
      body: { name: "smoke" },
      expect: 201,
      save: { id: "$.id" },
    },
    { name: "read back", path: "/records/{{id}}", expect: 200, bodyContains: "smoke" },
  ],
};

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

type Call = { url: string; method: string; body?: string };
type Reply = { status: number; body?: string } | Error;

/** A fake fetch that answers from a queue per "METHOD url" and records every call. */
function fakeFetch(replies: Record<string, Reply[]>) {
  const calls: Call[] = [];
  const fetch = async (url: string, init: { method: string; body?: string }) => {
    calls.push({ url, method: init.method, body: init.body });
    const queue = replies[`${init.method} ${url}`];
    const next = queue && queue.length > 1 ? queue.shift() : queue?.[0];
    if (!next) throw new Error(`unexpected request ${init.method} ${url}`);
    if (next instanceof Error) throw next;
    return { status: next.status, text: async () => next.body ?? "" };
  };
  return { fetch, calls };
}

function clock() {
  let t = 0;
  return {
    now: () => t,
    sleep: async (ms: number) => {
      t += ms;
    },
  };
}

const PLAN: SmokePlan = {
  name: "orders-api",
  baseUrl: "http://api.shop.localhost/api/orders",
  smoke: SMOKE,
};

describe("validateSmoke", () => {
  it("accepts the documented example", () => {
    expect(validateSmoke(SMOKE)).toEqual([]);
  });

  it("rejects any via other than proxy", () => {
    expect(validateSmoke({ ...SMOKE, via: "container" }).join("\n")).toMatch(/via.*proxy/);
  });

  it("rejects a step without a path, and a path that would skip the proxy", () => {
    const errors = validateSmoke({
      via: "proxy",
      steps: [{ expect: 200 }, { path: "http://localhost:3000/health" }, { path: "records" }],
    }).join("\n");
    expect(errors).toMatch(/steps\[0\].*path/);
    expect(errors).toMatch(/steps\[1\].*path/);
    expect(errors).toMatch(/steps\[2\].*path/);
  });

  it("rejects an empty steps list and a bad expect or timeout", () => {
    expect(validateSmoke({ via: "proxy", steps: [] }).join("\n")).toMatch(/steps/);
    expect(
      validateSmoke({ via: "proxy", timeoutSeconds: 0, steps: [{ path: "/a", expect: 99 }] }).join(
        "\n",
      ),
    ).toMatch(/timeoutSeconds[\s\S]*expect/);
  });
});

describe("buildSmokePlans", () => {
  it("builds one plan per routable resource that declares smoke, from the URL tdk up prints", () => {
    const plans = buildSmokePlans(
      [
        resource("orders-api", "backend", { smoke: SMOKE }),
        resource("shop-web", "frontend", { smoke: { ...SMOKE, steps: [{ path: "/" }] } }),
        resource("plain-api", "backend"),
      ],
      8080,
    );
    expect(plans.map((p) => [p.name, p.baseUrl])).toEqual([
      ["orders-api", expect.stringMatching(/^http:\/\/.*:8080\/api\/orders$/)],
      ["shop-web", expect.stringMatching(/^http:\/\/.*:8080\/shop-web$/)],
    ]);
  });

  it("skips workers and bring-your-own with exposeViaProxy false", () => {
    const plans = buildSmokePlans([
      resource("jobs", "worker", { smoke: SMOKE }),
      resource("byo", "bring-your-own", { smoke: SMOKE, exposeViaProxy: false }),
    ]);
    expect(plans).toEqual([]);
  });

  it("honours apiPath and basePath", () => {
    const [api, web] = buildSmokePlans([
      resource("orders-api", "backend", { smoke: SMOKE, apiPath: "/v2/orders" }),
      resource("shop-web", "frontend", { smoke: SMOKE, basePath: "/shop" }),
    ]);
    expect(api?.baseUrl).toMatch(/\/v2\/orders$/);
    expect(web?.baseUrl).toMatch(/\/shop$/);
  });
});

describe("runSmokePlan", () => {
  const base = PLAN.baseUrl;

  it("writes, saves the id, reads it back through the proxy URL, and passes", async () => {
    const { fetch, calls } = fakeFetch({
      [`POST ${base}/records`]: [{ status: 201, body: '{"id":"abc"}' }],
      [`GET ${base}/records/abc`]: [{ status: 200, body: '{"id":"abc","name":"smoke"}' }],
    });
    const result = await runSmokePlan(PLAN, { fetch, ...clock() });
    expect(result).toEqual({ name: "orders-api", ok: true });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      `POST ${base}/records`,
      `GET ${base}/records/abc`,
    ]);
    expect(JSON.parse(calls[0]?.body ?? "")).toEqual({ name: "smoke" });
  });

  it("fails with url, method, status and a body snippet when the proxy keeps answering 404", async () => {
    const { fetch } = fakeFetch({
      [`POST ${base}/records`]: [{ status: 404, body: "404 page not found" }],
    });
    const result = await runSmokePlan(PLAN, { fetch, ...clock() });
    expect(result.ok).toBe(false);
    expect(result.failure).toContain(`POST ${base}/records`);
    expect(result.failure).toContain("404");
    expect(result.failure).toContain("404 page not found");
    expect(result.failure).toContain("expected 201");
  });

  it("keeps trying a not-ready route until it comes up, within the timeout", async () => {
    const { fetch, calls } = fakeFetch({
      [`POST ${base}/records`]: [
        Object.assign(new Error("fetch failed"), { cause: { code: "ECONNREFUSED" } }),
        { status: 404 },
        { status: 503 },
        { status: 201, body: '{"id":"9"}' },
      ],
      [`GET ${base}/records/9`]: [{ status: 200, body: "smoke" }],
    });
    const result = await runSmokePlan(PLAN, { fetch, ...clock() });
    expect(result.ok).toBe(true);
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(4);
  });

  it("does not retry a real answer with the wrong status (a write must not be repeated)", async () => {
    const { fetch, calls } = fakeFetch({
      [`POST ${base}/records`]: [{ status: 500, body: "boom" }],
    });
    const result = await runSmokePlan(PLAN, { fetch, ...clock() });
    expect(result.ok).toBe(false);
    expect(calls).toHaveLength(1);
    expect(result.failure).toContain("500");
  });

  it("does not repeat a POST after an error that may have reached the service (timeout, reset, unknown)", async () => {
    for (const err of [
      Object.assign(new Error("The operation was aborted"), { name: "TimeoutError" }),
      Object.assign(new Error("fetch failed"), { cause: { code: "ECONNRESET" } }),
      new Error("something odd"),
    ]) {
      const { fetch, calls } = fakeFetch({ [`POST ${base}/records`]: [err] });
      const result = await runSmokePlan(PLAN, { fetch, ...clock() });
      expect(result.ok).toBe(false);
      expect(calls).toHaveLength(1);
      expect(result.failure).toContain("never answered");
    }
  });

  it("retries a GET after any error until the timeout", async () => {
    const plan: SmokePlan = { ...PLAN, smoke: { via: "proxy", steps: [{ path: "/x" }] } };
    const { fetch, calls } = fakeFetch({
      [`GET ${base}/x`]: [
        new Error("socket hang up"),
        new Error("socket hang up"),
        { status: 200 },
      ],
    });
    expect((await runSmokePlan(plan, { fetch, ...clock() })).ok).toBe(true);
    expect(calls).toHaveLength(3);
  });

  it("reports a malformed smoke block as a failed result instead of throwing", async () => {
    const plan = { ...PLAN, smoke: { via: "proxy" } } as unknown as SmokePlan;
    const { fetch, calls } = fakeFetch({});
    const result = await runSmokePlan(plan, { fetch, ...clock() });
    expect(result.ok).toBe(false);
    expect(result.failure).toContain("smoke.steps");
    expect(calls).toHaveLength(0);
  });

  it("fails when the read-back body does not contain the expected text", async () => {
    const { fetch } = fakeFetch({
      [`POST ${base}/records`]: [{ status: 201, body: '{"id":"abc"}' }],
      [`GET ${base}/records/abc`]: [{ status: 200, body: '{"id":"abc","name":"other"}' }],
    });
    const result = await runSmokePlan(PLAN, { fetch, ...clock() });
    expect(result.ok).toBe(false);
    expect(result.failure).toContain('"smoke"');
    expect(result.failure).toContain("read back");
  });

  it("fails when a saved field is missing from the response", async () => {
    const { fetch } = fakeFetch({
      [`POST ${base}/records`]: [{ status: 201, body: '{"nope":1}' }],
    });
    const result = await runSmokePlan(PLAN, { fetch, ...clock() });
    expect(result.ok).toBe(false);
    expect(result.failure).toContain("$.id");
  });

  it("reads nested and indexed save paths", async () => {
    const plan: SmokePlan = {
      ...PLAN,
      smoke: {
        via: "proxy",
        steps: [
          { method: "POST", path: "/x", expect: 200, save: { id: "$.data.items[1].id" } },
          { path: "/x/{{id}}", expect: 200 },
        ],
      },
    };
    const { fetch, calls } = fakeFetch({
      [`POST ${base}/x`]: [{ status: 200, body: '{"data":{"items":[{"id":1},{"id":"two"}]}}' }],
      [`GET ${base}/x/two`]: [{ status: 200 }],
    });
    expect((await runSmokePlan(plan, { fetch, ...clock() })).ok).toBe(true);
    expect(calls[1]?.url).toBe(`${base}/x/two`);
  });
});
