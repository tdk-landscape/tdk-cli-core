import { createServer } from "node:net";
import { describe, expect, it } from "vitest";
import { createHostPortPlan } from "../host-port-plan.js";

describe("createHostPortPlan", () => {
  it("chooses bounded fallback ports when defaults are occupied", async () => {
    const plan = await createHostPortPlan({
      env: {},
      isAvailable: async (port) => ![8080, 8443, 15432].includes(port),
      ranges: {
        ingressHttp: { start: 8080, end: 8081 },
        ingressHttps: { start: 8443, end: 8444 },
        postgres: { start: 15432, end: 15433 },
      },
    });
    expect(plan).toEqual({
      ingressHttp: 8081,
      ingressHttps: 8444,
      postgres: 15433,
      explicit: { ingressHttp: false, ingressHttps: false, postgres: false },
    });
  });

  it("honors explicit overrides and rejects collisions", async () => {
    const env = { TDK_HTTP_PORT: "18080", TDK_HTTPS_PORT: "18443", TDK_POSTGRES_PORT: "15433" };
    const plan = await createHostPortPlan({ env, isAvailable: async () => true });
    expect([plan.ingressHttp, plan.ingressHttps, plan.postgres]).toEqual([18080, 18443, 15433]);
    expect(Object.values(plan.explicit).every(Boolean)).toBe(true);
    await expect(
      createHostPortPlan({ env, isAvailable: async (port) => port !== 18080 }),
    ).rejects.toThrow("TDK_HTTP_PORT=18080 is already in use");
  });

  it("rejects invalid ports and fails with an override hint when ranges are exhausted", async () => {
    await expect(
      createHostPortPlan({ env: { TDK_HTTP_PORT: "70000" }, isAvailable: async () => true }),
    ).rejects.toThrow("TDK_HTTP_PORT must be an integer");
    await expect(
      createHostPortPlan({
        env: {},
        isAvailable: async () => false,
        ranges: {
          ingressHttp: { start: 8080, end: 8080 },
          ingressHttps: { start: 8443, end: 8443 },
          postgres: { start: 15432, end: 15432 },
        },
      }),
    ).rejects.toThrow("Set TDK_HTTP_PORT to a free port");
  });

  it("probes host publish availability on IPv4 loopback", async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected an IP socket");
    try {
      await expect(
        createHostPortPlan({
          env: { TDK_HTTP_PORT: String(address.port) },
          isAvailable: undefined,
        }),
      ).rejects.toThrow(`TDK_HTTP_PORT=${address.port} is already in use`);
    } finally {
      server.close();
    }
  });
});
