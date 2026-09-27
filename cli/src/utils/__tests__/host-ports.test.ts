import { createServer } from "node:net";
import { describe, expect, it } from "vitest";
import { checkHostPorts, probeHostPort } from "../doctor-runtime.js";

const noDocker = (() => "") as never;
const inUse =
  (ports: number[]) =>
  async (port: number): Promise<"free" | "in-use" | "unknown"> =>
    ports.includes(port) ? "in-use" : "free";

describe("checkHostPorts", () => {
  it("passes when every port is free", async () => {
    const result = await checkHostPorts(noDocker, "shop", inUse([]));
    expect(result.didPass).toBe(true);
  });

  it("flags a local Postgres that no container accounts for", async () => {
    const result = await checkHostPorts(noDocker, "shop", inUse([5432]));
    expect(result.didPass).toBe(false);
    expect(result.message).toContain("5432 (Postgres) is used by a program on this machine");
    expect(result.fix).toContain("lsof -nP -iTCP:5432");
  });

  it("accepts ports published by this project's own containers", async () => {
    const dockerPs = "shop_postgres\t0.0.0.0:5432->5432/tcp\nshop_traefik\t0.0.0.0:80->80/tcp";
    const result = await checkHostPorts((() => dockerPs) as never, "shop", inUse([80, 5432]));
    expect(result.didPass).toBe(true);
  });

  it("flags 5432 published by another project's container", async () => {
    const dockerPs = "erp_postgres\t0.0.0.0:5432->5432/tcp";
    const result = await checkHostPorts((() => dockerPs) as never, "shop", inUse([5432]));
    expect(result.didPass).toBe(false);
    expect(result.message).toContain("published by container erp_postgres");
  });

  it("leaves docker-held 80/443 to the ingress check", async () => {
    const dockerPs = "erp_traefik\t0.0.0.0:80->80/tcp";
    const result = await checkHostPorts((() => dockerPs) as never, "shop", inUse([80]));
    expect(result.didPass).toBe(true);
  });
});

describe("probeHostPort", () => {
  it("reports a port held on loopback as in use", async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as { port: number };
    try {
      expect(await probeHostPort(port)).toBe("in-use");
    } finally {
      server.close();
    }
  });
});
