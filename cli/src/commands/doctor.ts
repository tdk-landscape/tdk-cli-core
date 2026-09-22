import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import type { CheckResult } from "../types/index.js";
import {
  MASTER_CONFIG_FILES,
  QUICKSTART_DOCS_URL,
  REQUIRED_PACKAGE_SCRIPTS,
} from "../utils/constants.js";
import { validateEnvFile } from "../utils/env-validator.js";
import { formatCount } from "../utils/formatting.js";
import { findProjectRoot } from "../utils/paths.js";
import { buildHealthTargets, pingHealthTargets } from "../utils/service-urls.js";
import { discoverResourcesFromRoot } from "../utils/services.js";

function createExecCheck(
  name: string,
  command: string,
  successMessage: string,
  failureMessage: string,
  fixInstructions: string,
): () => CheckResult {
  return () => {
    try {
      execSync(command, { stdio: "pipe" });
      return {
        name,
        didPass: true,
        message: successMessage,
      };
    } catch {
      // Error details not needed - failure message tells user what to fix
      return {
        name,
        didPass: false,
        message: failureMessage,
        fix: fixInstructions,
      };
    }
  };
}

function checkDockerRuntime(): CheckResult {
  // Check for Docker
  try {
    execSync("docker ps", { stdio: "pipe" });
    return {
      name: "Container Runtime",
      didPass: true,
      message: "Docker daemon is running",
    };
  } catch {
    // Docker not running, check for Colima
    try {
      execSync("colima status", { stdio: "pipe" });
      // Colima is running
      return {
        name: "Container Runtime",
        didPass: true,
        message: "Colima (Docker runtime) is running",
      };
    } catch {
      // Check if Colima is installed but not running
      try {
        execSync("which colima", { stdio: "pipe" });
        return {
          name: "Container Runtime",
          didPass: false,
          message: "Colima is installed but not running",
          fix: "Start Colima: colima start",
        };
      } catch {
        // Check for Podman
        try {
          execSync("podman ps", { stdio: "pipe" });
          return {
            name: "Container Runtime",
            didPass: true,
            message: "Podman is running",
          };
        } catch {
          // No container runtime found
          return {
            name: "Container Runtime",
            didPass: false,
            message: "No container runtime (Docker/Colima/Podman) is running",
            fix: `Start: colima start (recommended) OR open -a Docker (macOS) OR sudo systemctl start docker (Linux). Setup guide: ${QUICKSTART_DOCS_URL}`,
          };
        }
      }
    }
  }
}

const checkDockerCompose = createExecCheck(
  "Docker Compose",
  "docker compose version",
  "Docker Compose plugin available",
  "Docker Compose plugin not found",
  "Install Docker Compose: https://docs.docker.com/compose/install/",
);

const checkTilt = createExecCheck(
  "Tilt CLI",
  "tilt version",
  "Tilt CLI installed",
  "Tilt CLI not found",
  `Install Tilt: brew install tilt (macOS) or see https://docs.tilt.dev/install.html. Setup guide: ${QUICKSTART_DOCS_URL}`,
);

function checkEnvironmentVariables(): CheckResult {
  const projectRoot = findProjectRoot() ?? process.cwd();
  const validation = validateEnvFile(projectRoot);

  if (validation.missing.length > 0) {
    return {
      name: "Environment Variables",
      didPass: false,
      message: `Missing required env variables: ${validation.missing.join(", ")}`,
      fix: `Edit .env and set these values:\n    ${validation.missing.map((v) => `${v}=<value>`).join("\n    ")}`,
    };
  }

  if (validation.invalid.length > 0) {
    return {
      name: "Environment Variables",
      didPass: false,
      message: `Invalid env variables: ${validation.invalid.join(", ")}`,
      fix: "Edit .env and provide values for empty variables",
    };
  }

  return {
    name: "Environment Variables",
    didPass: true,
    message: "All required environment variables are set",
  };
}

function checkMasterConfigs(): CheckResult {
  // `tdk project` writes generated master configs to .tdk/.tdk-out/, not the
  // project root, so look there (and walk up to find the project root, same
  // as every other command that reads project state).
  const projectRoot = findProjectRoot() ?? process.cwd();
  const outDir = join(projectRoot, ".tdk", ".tdk-out");

  const missing = MASTER_CONFIG_FILES.filter((file) => !existsSync(join(outDir, file)));

  if (missing.length === 0) {
    return {
      name: "Master Configs",
      didPass: true,
      message: `${MASTER_CONFIG_FILES.join(", ")} found`,
    };
  }

  return {
    name: "Master Configs",
    didPass: false,
    message: `Master configs missing: ${missing.join(", ")}`,
    fix: "Run: tdk project",
  };
}

function checkStartupScripts(): CheckResult {
  const projectRoot = findProjectRoot() ?? process.cwd();
  const resources = discoverResourcesFromRoot(projectRoot);

  const problems: string[] = [];

  for (const resource of resources) {
    const packageJsonPath = join(resource.path, "package.json");
    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const appType = resource.config?.appType ?? "backend";
    const requiredScripts = REQUIRED_PACKAGE_SCRIPTS[appType] ?? REQUIRED_PACKAGE_SCRIPTS.backend;

    let scripts: Record<string, string>;
    try {
      scripts = JSON.parse(readFileSync(packageJsonPath, "utf-8")).scripts ?? {};
    } catch {
      problems.push(`${resource.name} (package.json is invalid JSON)`);
      continue;
    }

    const missing = requiredScripts.filter((script) => !scripts[script]);
    if (missing.length > 0) {
      problems.push(`${resource.name}: missing "${missing.join('", "')}"`);
    }
  }

  if (problems.length === 0) {
    return {
      name: "Startup Scripts",
      didPass: true,
      message: "All services have required package.json scripts",
    };
  }

  return {
    name: "Startup Scripts",
    didPass: false,
    message: `Services missing required package.json scripts:\n    ${problems.join("\n    ")}`,
    fix: 'Add the missing scripts to each service\'s package.json, e.g.:\n    "dev": "bun run src/index.ts",\n    "build": "tsc",\n    "start": "bun run dist/index.js"',
  };
}

const DEFAULT_PING_TIMEOUT_MS = 5000;

/**
 * Pings every routable service on the same /health URLs `tdk up` advertises.
 *
 * This is a runtime check, not an environment one: before `tdk up` there is
 * nothing to ping, so a stopped stack is reported as skipped and doctor still
 * passes. Once services are up, an unreachable endpoint is a real failure --
 * it catches the case where a container is running but Traefik never routed
 * to it, which `docker ps` alone will not show.
 */
async function checkServiceHealth(timeoutMs: number): Promise<CheckResult> {
  const projectRoot = findProjectRoot() ?? process.cwd();
  const targets = buildHealthTargets(discoverResourcesFromRoot(projectRoot));

  if (targets.length === 0) {
    return {
      name: "Service Health",
      didPass: true,
      isSkipped: true,
      message: "No routable services to ping",
    };
  }

  const probes = await pingHealthTargets(targets, timeoutMs);
  const reachable = probes.filter((probe) => probe.ok);
  const failed = probes.filter((probe) => !probe.ok);

  // Nothing answered at all: the stack is almost certainly not started yet,
  // which is the normal state for `tdk doctor` before `tdk up`.
  if (reachable.length === 0) {
    return {
      name: "Service Health",
      didPass: true,
      isSkipped: true,
      message: `Services not running - skipped ping of ${formatCount(targets.length, "service")}`,
      fix: "Start them with: tdk up",
    };
  }

  if (failed.length === 0) {
    return {
      name: "Service Health",
      didPass: true,
      message: `All ${formatCount(targets.length, "service")} responding on /health`,
    };
  }

  const details = failed
    .map((probe) => {
      const reason = probe.status ? `HTTP ${probe.status}` : (probe.error ?? "no response");
      return `${probe.name} (${reason})\n      ${probe.url}`;
    })
    .join("\n    ");

  return {
    name: "Service Health",
    didPass: false,
    message: `${formatCount(failed.length, "service")} not responding (${reachable.length}/${probes.length} healthy):\n    ${details}`,
    fix: "Check container state and routing: docker ps, then tdk networks to compare the advertised URLs against Traefik's routers",
  };
}

export const doctorCommand = new Command("doctor")
  .description("Check environment readiness for TDK")
  .option("--no-ping", "Skip pinging running services' /health endpoints")
  .option(
    "--ping-timeout <ms>",
    "Per-service ping timeout in milliseconds",
    String(DEFAULT_PING_TIMEOUT_MS),
  )
  .action(async (options) => {
    console.log(`\n${chalk.bold("🔍 TDK Doctor")}\n`);
    console.log("Checking environment...\n");

    const pingTimeout = Number.parseInt(options.pingTimeout, 10);
    if (!Number.isFinite(pingTimeout) || pingTimeout <= 0) {
      console.log(`${chalk.red("✗")} --ping-timeout must be a positive number of milliseconds`);
      process.exit(1);
    }

    const checks: Array<() => CheckResult | Promise<CheckResult>> = [
      checkDockerRuntime,
      checkTilt,
      checkDockerCompose,
      checkMasterConfigs,
      checkStartupScripts,
      checkEnvironmentVariables,
    ];

    // Runs last: it is the only check that needs the stack already started.
    if (options.ping) {
      checks.push(() => checkServiceHealth(pingTimeout));
    }

    let allPassed = true;

    for (const checkFn of checks) {
      const result = await checkFn();

      if (result.isSkipped) {
        console.log(`${chalk.gray("○")} ${chalk.gray(result.message)}`);
        if (result.fix) {
          console.log(`${chalk.blue("ℹ")} ${result.fix}`);
        }
      } else if (result.didPass) {
        console.log(`${chalk.green("✓")} ${result.message}`);
      } else {
        console.log(`${chalk.red("✗")} ${result.message}`);
        if (result.fix) {
          console.log(`${chalk.blue("ℹ")} Fix: ${result.fix}`);
        }
        allPassed = false;
        break;
      }
    }

    console.log("");

    if (allPassed) {
      console.log(`${chalk.green(chalk.bold("✓"))} Environment ready for TDK`);
      console.log("");
      console.log("Next steps:");
      console.log("  1. Run: tdk up");
      console.log("  2. Open: http://localhost:10350");
    } else {
      console.log(`${chalk.red(chalk.bold("✗"))} Environment not ready`);
      console.log("");
      console.log("Fix the issues above, then run: tdk doctor");
      process.exit(1);
    }
  });
