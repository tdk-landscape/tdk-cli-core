import { connect } from "node:net";
import chalk from "chalk";
import { Command } from "commander";
import { ensureProjectRuntimeAssets } from "../generator/template-engine.js";
import { handleDryRun } from "../utils/command-helpers.js";
import {
  errorFactories,
  handleTiltFailure,
  requireProjectRoot,
  runCommand,
  showErrorAndExit,
  withTiltCheck,
} from "../utils/errors.js";
import { formatCount } from "../utils/formatting.js";
import {
  exportHostPortPlan,
  getHostPortPlan,
  writeSavedHostPortPlan,
} from "../utils/host-port-config.js";
import { formatHostPortPlan } from "../utils/host-port-plan.js";
import { findProjectRoot } from "../utils/paths.js";
import { findAvailablePort } from "../utils/port-assignment.js";
import { isApiServiceType } from "../utils/resource-kind.js";
import { appendHealthPath, resolveSubdomainBases } from "../utils/service-urls.js";
import {
  discoverResources,
  discoverStacks,
  getResourcesForStack,
  stackExists,
} from "../utils/services.js";
import { buildTiltUpArgs, runTilt } from "../utils/tilt.js";
import { stopTiltOnPort } from "../utils/tilt-process.js";
import { enableDiscoveredStacks } from "./project.js";

export function formatUpSuccess(port: number, appUrls: string[] = []): string[] {
  return [
    "TDK is up.",
    `Tilt UI: http://localhost:${port}`,
    "App URLs:",
    ...(appUrls.length > 0
      ? appUrls.slice(0, 5).map((url) => `  ${url}`)
      : ["  run: tdk networks"]),
    "Stop: tdk down",
  ];
}

export function nativeWindowsUpRefusal(
  platform: string,
  allowNativeWindows?: string,
): string | null {
  if (platform !== "win32" || allowNativeWindows === "1") return null;
  return "Landscape startup needs Ubuntu on WSL2. Native Windows is inspect-only.";
}

function waitForTiltUi(port: number, timeoutMs = 30_000): Promise<boolean> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const attempt = () => {
      const socket = connect({ host: "127.0.0.1", port });
      let settled = false;
      const finish = (ready: boolean) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        if (ready || Date.now() >= deadline) resolve(ready);
        else setTimeout(attempt, 250);
      };
      socket.once("connect", () => finish(true));
      socket.once("error", () => finish(false));
    };
    attempt();
  });
}

export const upCommand = new Command("up")
  .description("Start all services (optionally filtered by stack)")
  .alias("deploy")
  .argument("[stack-name]", "Name of the stack to start (optional - runs all if omitted)")
  .option("-v, --verbose", "Enable verbose output", false)
  .option("-q, --quiet", "Suppress non-essential output", false)
  .option("--dry-run", "Show what would be started without starting", false)
  .option("-f, --force", "Kill existing Tilt process before starting", false)
  .action(async (stackName, options) => {
    const platformRefusal = nativeWindowsUpRefusal(
      process.platform,
      process.env.TDK_ALLOW_NATIVE_WINDOWS,
    );
    if (platformRefusal) showErrorAndExit(platformRefusal);

    if (!options.dryRun) {
      const { assertMachineReadyOrExit } = await import("../utils/cold-preflight.js");
      await assertMachineReadyOrExit();
    }
    const action = async (): Promise<void> => {
      const projectRoot = options.dryRun
        ? requireProjectRoot()
        : (findProjectRoot() ?? process.cwd());
      const hostPortPlan = await getHostPortPlan(projectRoot, {
        inspectDocker: !options.dryRun,
      });
      if (!options.dryRun) {
        const copiedAssets = ensureProjectRuntimeAssets(projectRoot);
        if (copiedAssets.length > 0 && options.verbose && !options.quiet) {
          console.log(chalk.gray(`Refreshed runtime assets: ${copiedAssets.join(", ")}`));
        }

        const newlyEnabledStacks = enableDiscoveredStacks(projectRoot);
        if (newlyEnabledStacks.length > 0 && !options.quiet) {
          console.log(
            chalk.gray(
              `Added ${newlyEnabledStacks.join(", ")} to the pre_alpha phase in .tdk/project.json`,
            ),
          );
        }
      }

      let servicesToStart: Awaited<ReturnType<typeof discoverResources>>;
      let stackDescription: string;
      let focusServiceNames: string[] = [];

      if (stackName) {
        if (!stackExists(stackName)) {
          errorFactories.stackNotFound(stackName).exit();
        }

        servicesToStart = getResourcesForStack(stackName);
        focusServiceNames = servicesToStart.map((s) => s.name);
        stackDescription = `stack "${stackName}"`;
      } else {
        servicesToStart = discoverResources();
        const allStacks = discoverStacks();
        stackDescription = `all stacks (${formatCount(allStacks.length, "stack")}, ${formatCount(servicesToStart.length, "service")})`;
      }

      if (options.verbose && !options.quiet) {
        console.log(
          chalk.gray(
            `Found ${formatCount(servicesToStart.length, "service")} in ${stackDescription}`,
          ),
        );
      }

      const serviceNames = servicesToStart.map((s) => s.name);

      if (!options.quiet) {
        console.log(
          chalk.blue(
            `${options.dryRun ? "Would start" : "Starting"} ${formatCount(serviceNames.length, "service")} from ${stackDescription}...`,
          ),
        );
        serviceNames.forEach((name) => {
          console.log(chalk.gray(`  - ${name}`));
        });

        const { appBase, apiBase } = resolveSubdomainBases(hostPortPlan.ingressHttp);
        const frontends = servicesToStart.filter((s) => s.config?.appType === "frontend");
        const backends = servicesToStart.filter((s) => isApiServiceType(s.config?.appType));

        if (frontends.length > 0) {
          console.log(chalk.blue("\n🌍 Frontend URLs:"));
          frontends.forEach((svc) => {
            const basePath = svc.config?.basePath ?? `/${svc.name}`;
            console.log(
              chalk.gray(`  - ${svc.name}: ${appBase}${chalk.cyan(appendHealthPath(basePath))}`),
            );
          });
        }

        if (backends.length > 0) {
          console.log(chalk.blue("\n🔧 Backend API URLs:"));
          backends.forEach((svc) => {
            const servicePathName = svc.name.replace(/-api$/, "");
            const apiPath = svc.config?.apiPath ?? `/api/${servicePathName}`;
            const sablier = svc.config?.sablier;
            const deferredTag =
              sablier?.enable && sablier?.deferStart
                ? chalk.dim(" (deferred — starts on first request)")
                : "";
            console.log(
              chalk.gray(
                `  - ${svc.name}: ${apiBase}${chalk.cyan(appendHealthPath(apiPath))}${deferredTag}`,
              ),
            );
          });
        }
      }

      const dryRunCommand = stackName
        ? `tilt up -- --focus=${stackName} ${focusServiceNames.join(" ")}`
        : "tilt up";
      if (!options.quiet) {
        console.log(chalk.blue(formatHostPortPlan(hostPortPlan)));
        console.log(
          chalk.gray("Override with TDK_HTTP_PORT, TDK_HTTPS_PORT, or TDK_POSTGRES_PORT."),
        );
      }
      if (handleDryRun(options, "not starting services", dryRunCommand)) {
        return;
      }

      exportHostPortPlan(hostPortPlan);
      writeSavedHostPortPlan(projectRoot, hostPortPlan);

      const basePort = 10350;
      let port = basePort;

      if (process.env.TILT_PORT) {
        port = parseInt(process.env.TILT_PORT, 10);
      } else if (!options.force) {
        const availablePort = await findAvailablePort(basePort, 10);
        if (availablePort && availablePort !== basePort) {
          port = availablePort;
          if (!options.quiet) {
            console.log(chalk.yellow(`⚠️  Port ${basePort} is already in use`));
            console.log(chalk.blue(`🔄 Auto-switching to port ${port}\n`));
          }
        }
      }

      process.env.TILT_PORT = port.toString();

      if (options.force) {
        if (!options.quiet) {
          console.log(chalk.yellow(`Force flag set - stopping Tilt on port ${port} if running...`));
        }
        stopTiltOnPort(port);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const tiltArgs = buildTiltUpArgs(focusServiceNames, {
        verbose: options.verbose,
        quiet: options.quiet,
        force: options.force,
        focusTargets: stackName ? [stackName] : undefined,
      });

      if (!options.quiet) {
        console.log(chalk.gray("\nRunning tilt up..."));
        console.log(chalk.gray(`Using Tiltfile: .tdk/.tdk-out/Tiltfile`));
      }

      const tiltRun = runTilt("up", tiltArgs, {
        verbose: options.verbose,
        quiet: options.quiet,
        inheritStdio: !options.quiet, // Suppress tilt output in quiet mode
      });

      let printedSuccess = false;
      const successOutput = (async () => {
        const uiReady = await waitForTiltUi(port);
        if (uiReady && !options.quiet) {
          for (const line of formatUpSuccess(port)) console.log(chalk.blue(line));
          printedSuccess = true;
        }
      })();
      const result = await tiltRun;
      await successOutput;

      if (result.exitCode !== 0) {
        handleTiltFailure("up", result.exitCode);
      }

      if (!options.quiet && result.exitCode === 0 && !printedSuccess) {
        for (const line of formatUpSuccess(port)) console.log(chalk.blue(line));
      }
    };

    if (options.dryRun) {
      await runCommand(action);
    } else {
      await withTiltCheck(action);
    }
  });
