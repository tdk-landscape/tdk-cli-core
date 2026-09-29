import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkDockerCompose,
  checkDockerRuntime,
  checkDockerVersions,
  checkTilt,
} from "../commands/doctor.js";
import type { CheckResult } from "../types/index.js";
import { checkHostPorts, checkIngressPorts } from "./doctor-runtime.js";
import { checkNatsBroker } from "./doctor-wiring.js";
import { findProjectRoot } from "./paths.js";
import { discoverResourcesFromRoot } from "./services.js";
import { findOnPath } from "./which.js";

export type PreflightItem = {
  id: "node" | "docker" | "compose" | "tilt" | "bun" | "ports" | "nats" | "prisma";
  ok: boolean;
  message: string;
  fix?: string;
};

export type PreflightResult = {
  ok: boolean;
  inProject: boolean;
  items: PreflightItem[];
  header: string;
  footer: string;
};

type Check = () => Promise<CheckResult> | CheckResult;

function item(id: PreflightItem["id"], result: CheckResult): PreflightItem {
  return {
    id,
    ok: result.didPass || Boolean(result.isSkipped),
    message: result.message,
    fix: result.fix,
  };
}

export function nodeTooOld(version: string): boolean {
  const [major = 0, minor = 0] = String(version)
    .split(".")
    .map((part) => Number.parseInt(part, 10));
  return (
    !Number.isFinite(major) || !Number.isFinite(minor) || major < 22 || (major === 22 && minor < 12)
  );
}

async function safeCheck(
  id: PreflightItem["id"],
  check: Check,
  fallback: string,
): Promise<PreflightItem> {
  try {
    return item(id, await check());
  } catch {
    return { id, ok: false, message: fallback };
  }
}

function usesPrisma(projectRoot: string): boolean {
  try {
    return discoverResourcesFromRoot(projectRoot).some((resource) => {
      return resource.config?.featuresEnabled?.includes("prisma") ?? false;
    });
  } catch {
    return false;
  }
}

export async function runColdPreflight(opts: { cwd?: string } = {}): Promise<PreflightResult> {
  const cwd = opts.cwd ?? process.cwd();
  const projectRoot = findProjectRoot(cwd);
  const inProject = Boolean(projectRoot);
  const items: PreflightItem[] = [];
  const nodeVersion = process.versions.node;
  items.push({
    id: "node",
    ok: !nodeTooOld(nodeVersion),
    message: nodeVersion,
    fix: nodeTooOld(nodeVersion)
      ? `Install Node.js 22.12+ (current: ${nodeVersion}). https://nodejs.org`
      : undefined,
  });

  items.push(await safeCheck("docker", checkDockerRuntime, "Docker daemon is not running"));
  items.push(
    await safeCheck(
      "compose",
      async () => {
        const [compose, versions] = await Promise.all([
          checkDockerCompose(),
          checkDockerVersions(),
        ]);
        if (!compose.didPass) return compose;
        return versions;
      },
      "Docker Engine or Compose version check failed",
    ),
  );
  items.push(await safeCheck("tilt", checkTilt, "Tilt CLI not found"));
  let bun = false;
  const bunPath = findOnPath("bun");
  if (bunPath) {
    try {
      const version = execFileSync(bunPath, ["--version"], {
        encoding: "utf-8",
        timeout: 3000,
      }).trim();
      const [major = 0, minor = 0] = version.split(".").map((part) => Number.parseInt(part, 10));
      bun = major > 1 || (major === 1 && minor >= 2);
    } catch {
      /* reported as a failed runtime check */
    }
  }
  items.push({
    id: "bun",
    ok: bun,
    message: bun ? "Bun 1.2+ is available on PATH" : "Bun 1.2+ not found on PATH",
    fix: bun ? undefined : "Install Bun 1.2+: https://bun.sh",
  });
  const [hostPorts, ingressPorts] = await Promise.all([
    safeCheck("ports", checkHostPorts, "Could not check required host ports"),
    safeCheck("ports", checkIngressPorts, "Could not check ingress ports"),
  ]);
  if (!hostPorts.ok || !ingressPorts.ok) {
    const port5432 = !hostPorts.ok && /(?:^|\n)\s*5432\s*\(/.test(hostPorts.message);
    const messages = [
      !hostPorts.ok
        ? port5432
          ? "Port 5432 is taken (usually local Postgres). Stop it or TDK cannot bind the bundled Postgres."
          : hostPorts.message
        : undefined,
      !ingressPorts.ok ? ingressPorts.message : undefined,
    ].filter((message): message is string => Boolean(message));
    const fixes = [hostPorts.fix, ingressPorts.fix].filter((fix): fix is string => Boolean(fix));
    items.push({
      id: "ports",
      ok: false,
      message: messages.join("\n"),
      fix: fixes.join(" "),
    });
  }

  if (projectRoot) {
    const nats = await safeCheck(
      "nats",
      () => checkNatsBroker(projectRoot),
      "NATS broker check failed",
    );
    if (!nats.ok) items.push(nats);
    if (usesPrisma(projectRoot)) {
      let dbUp = false;
      try {
        const config = JSON.parse(readFileSync(join(projectRoot, ".tdk", "project.json"), "utf-8"));
        const projectName = String(config?.project?.name ?? "").replace(/-/g, "_");
        if (projectName) {
          const running = execFileSync(
            findOnPath("docker") ?? "docker",
            [
              "ps",
              "--filter",
              `label=com.docker.compose.project=${projectName}`,
              "--filter",
              "label=com.docker.compose.service=postgres",
              "--filter",
              "health=healthy",
              "--format",
              "{{.Names}}",
            ],
            { encoding: "utf-8", timeout: 3000 },
          ).trim();
          dbUp = running.length > 0;
        }
      } catch {
        /* Docker unavailable is already represented by the machine checks. */
      }
      if (!dbUp)
        items.push({
          id: "prisma",
          ok: false,
          message:
            "A Prisma resource is configured, but the project Postgres service is not healthy",
          fix: "Run `tdk up` to start the bundled Postgres, then check `tdk doctor`.",
        });
    }
  }

  const failures = items.filter((check) => !check.ok).slice(0, 8);
  const machineFailed = failures.some((check) =>
    ["node", "docker", "compose", "tilt", "bun", "ports"].includes(check.id),
  );
  const header = failures.length
    ? machineFailed
      ? "Cold start blocked. Bun/Prisma/NATS are not the first failure.\nThey are generated after `tdk project`. Fix the machine checks below."
      : "Machine is ready. Project wiring is not."
    : "";
  const footer = failures.length
    ? ""
    : inProject
      ? "Environment ready for TDK"
      : "This machine is ready for TDK.\nNext: mkdir my-app && cd my-app && tdk project --yes";
  return { ok: failures.length === 0, inProject, items: failures, header, footer };
}

export function formatColdPreflight(result: PreflightResult): string {
  const lines = [result.header];
  for (const check of result.items) {
    lines.push(`FAIL ${check.id.padEnd(7)} ${check.message}`);
    if (check.fix) lines.push(`  ${check.fix}`);
  }
  if (result.footer) lines.push(result.footer);
  return lines.filter(Boolean).join("\n");
}

export async function assertMachineReadyOrExit(): Promise<void> {
  const result = await runColdPreflight();
  const machineFailure = result.items.some((check) =>
    ["node", "docker", "compose", "tilt", "bun", "ports"].includes(check.id),
  );
  if (machineFailure) {
    console.error(formatColdPreflight(result));
    process.exit(1);
  }
}
