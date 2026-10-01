import type { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  checkDockerNetworkCapacity,
  checkFrontendBackendUrls,
  checkNatsBroker,
  checkResourcePackageJson,
  checkServiceUrlPorts,
  checkTiltInstances,
  parseTiltProcesses,
} from "../doctor-wiring.js";
import type { ExecAsync } from "../exec-async.js";

let root: string;

function resource(
  stack: string,
  name: string,
  config: Record<string, unknown>,
  files: Record<string, string> = { "package.json": "{}" },
) {
  const dir = join(root, "services", stack, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "service.json"), JSON.stringify({ appName: name, stack, ...config }));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(join(dir, file, ".."), { recursive: true });
    writeFileSync(join(dir, file), content);
  }
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "tdk-doctor-wiring-"));
  mkdirSync(join(root, ".tdk"), { recursive: true });
  writeFileSync(
    join(root, ".tdk", "project.json"),
    JSON.stringify({ project: { name: "reports-demo" } }),
  );
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("checkResourcePackageJson", () => {
  it("passes when every resource has a package.json", () => {
    resource("app", "api", { appType: "backend", port: 4000 });
    expect(checkResourcePackageJson(root).didPass).toBe(true);
  });

  it("skips resources whose language provider owns the runtime files", () => {
    resource("app", "py", { appType: "backend", port: 4000, language: "python" }, {});
    expect(checkResourcePackageJson(root).didPass).toBe(true);
    resource("app", "bun-api", { appType: "backend", port: 4001, language: "bun" }, {});
    expect(checkResourcePackageJson(root).message).toContain("bun-api");
  });

  it("names the resource whose image build would fail", () => {
    resource("app", "api", { appType: "backend", port: 4000 });
    resource("app", "web", { appType: "frontend", port: 3000 }, { "src/main.ts": "" });
    const result = checkResourcePackageJson(root);
    expect(result.didPass).toBe(false);
    expect(result.message).toContain("1 resource without a package.json: web");
    expect(result.message).toContain("not found");
  });
});

describe("checkServiceUrlPorts", () => {
  it("passes when the URL uses the port the target listens on", () => {
    resource("id", "auth", { appType: "backend", port: 4400 });
    resource("app", "api", {
      appType: "backend",
      port: 4410,
      params: { JWKS_URL: "http://auth:4400/.well-known/jwks.json" },
    });
    expect(checkServiceUrlPorts(root).didPass).toBe(true);
  });

  it("catches a URL that guesses the wrong port", () => {
    resource("id", "auth", { appType: "backend", port: 4400 });
    resource("app", "api", {
      appType: "backend",
      port: 4410,
      params: { JWKS_URL: "http://auth:4000/.well-known/jwks.json" },
    });
    const result = checkServiceUrlPorts(root);
    expect(result.didPass).toBe(false);
    expect(result.message).toContain("api param JWKS_URL: auth:4000, but auth listens on 4400");
  });

  it("catches localhost pointing at another service", () => {
    resource("id", "auth", { appType: "backend", port: 4400 });
    resource("app", "api", {
      appType: "backend",
      port: 4410,
      params: { AUTH_URL: "http://localhost:4400", SELF: "http://localhost:4410" },
    });
    const result = checkServiceUrlPorts(root);
    expect(result.didPass).toBe(false);
    expect(result.message).toContain("api param AUTH_URL: localhost:4400");
    expect(result.message).not.toContain("SELF");
  });

  it("ignores URLs to hosts that are not resources", () => {
    resource("app", "api", {
      appType: "backend",
      port: 4410,
      params: { ISSUER: "https://tenant.auth0.com:443/" },
    });
    expect(checkServiceUrlPorts(root).didPass).toBe(true);
  });
});

describe("checkFrontendBackendUrls", () => {
  beforeEach(() => resource("store", "catalog-api", { appType: "backend", port: 4300 }));

  it("catches a frontend calling a backend port on localhost", () => {
    resource(
      "store",
      "web",
      { appType: "frontend", port: 3300 },
      {
        "package.json": "{}",
        "src/api.ts": "export const URL = 'http://localhost:4300';",
      },
    );
    const result = checkFrontendBackendUrls(root);
    expect(result.didPass).toBe(false);
    expect(result.message).toContain("src/api.ts:1 calls localhost:4300 (catalog-api)");
    expect(result.fix).toContain("api.reports-demo.localhost/api/");
  });

  it("ignores comments, tests and unrelated ports", () => {
    resource(
      "store",
      "web",
      { appType: "frontend", port: 3300 },
      {
        "package.json": "{}",
        "src/api.ts": "// was http://localhost:4300\nconst dev = 'http://localhost:5173';",
        "tests/api.test.ts": "fetch('http://localhost:4300')",
        "src/api.test.ts": "fetch('http://localhost:4300')",
      },
    );
    expect(checkFrontendBackendUrls(root).didPass).toBe(true);
  });

  it("passes with the Traefik URL", () => {
    resource(
      "store",
      "web",
      { appType: "frontend", port: 3300 },
      {
        "package.json": "{}",
        "src/api.ts": "export const URL = 'http://api.demo.localhost/api/catalog';",
      },
    );
    expect(checkFrontendBackendUrls(root).didPass).toBe(true);
  });
});

describe("checkNatsBroker", () => {
  it("is skipped when nothing uses nats", () => {
    resource("app", "api", { appType: "backend", port: 4000 });
    const result = checkNatsBroker(root);
    expect(result.isSkipped).toBe(true);
  });

  it("fails when a resource uses nats and no messaging compose exists", () => {
    resource("app", "worker", { appType: "worker", featuresEnabled: ["nats"] });
    const result = checkNatsBroker(root);
    expect(result.didPass).toBe(false);
    expect(result.message).toContain("worker enable the nats feature");
    expect(result.fix).toContain("reports_demo_nats");
  });

  it("passes when the messaging compose file is there", () => {
    resource("app", "worker", { appType: "worker", featuresEnabled: ["nats"] });
    mkdirSync(join(root, "services", "platform", "messaging"), { recursive: true });
    writeFileSync(
      join(root, "services", "platform", "messaging", "docker-compose.yml"),
      "services: {}",
    );
    expect(checkNatsBroker(root).didPass).toBe(true);
  });
});

describe("checkTiltInstances", () => {
  const tiltLine = (pid: number, project: string) =>
    `${pid} tilt up -f ${project}/.tdk/.tdk-out/Tiltfile -- --focus=store`;
  const fakeExec = (output: string) => (() => output) as unknown as typeof execSync;

  it("parses pid and project root from ps output", () => {
    const ps = ["  501 /bin/zsh", `${tiltLine(42, "/work/a")}`, "77 grep tilt"].join("\n");
    expect(parseTiltProcesses(ps)).toEqual([{ pid: 42, root: "/work/a" }]);
  });

  it("passes when no Tilt is running", () => {
    expect(checkTiltInstances(root, fakeExec("1 launchd\n")).didPass).toBe(true);
  });

  it("fails on two Tilts for the same project", () => {
    const ps = `${tiltLine(10, root)}\n${tiltLine(11, root)}\n`;
    const result = checkTiltInstances(root, fakeExec(ps));
    expect(result.didPass).toBe(false);
    expect(result.message).toContain("pids 10, 11");
  });

  it("only notes another project's Tilt", () => {
    const result = checkTiltInstances(root, fakeExec(`${tiltLine(20, "/work/other")}\n`));
    expect(result.didPass).toBe(true);
    expect(result.isSkipped).toBe(true);
    expect(result.message).toContain("/work/other (pid 20)");
  });
});

describe("checkDockerNetworkCapacity", async () => {
  it("passes and removes its probe network", async () => {
    const calls: string[] = [];
    const exec = (async (command: string) => {
      calls.push(command);
      return "";
    }) as unknown as ExecAsync;
    expect((await checkDockerNetworkCapacity(exec)).didPass).toBe(true);
    expect(calls[0]).toMatch(/^docker network create tdk_doctor_probe_/);
    expect(calls[1]).toMatch(/^docker network rm tdk_doctor_probe_/);
  });

  it("fails when Docker has no address pool left", async () => {
    const exec = (async () => {
      throw Object.assign(new Error("failed"), {
        stderr: Buffer.from(
          "Error response from daemon: all predefined address pools have been fully subnetted",
        ),
      });
    }) as unknown as ExecAsync;
    const result = await checkDockerNetworkCapacity(exec);
    expect(result.didPass).toBe(false);
    expect(result.fix).toContain("docker network prune");
  });

  it("does not fail on unrelated Docker errors", async () => {
    const exec = (async () => {
      throw Object.assign(new Error("boom"), {
        stderr: Buffer.from("Cannot connect to the Docker daemon"),
      });
    }) as unknown as ExecAsync;
    expect((await checkDockerNetworkCapacity(exec)).isSkipped).toBe(true);
  });
});
