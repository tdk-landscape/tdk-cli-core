import { connect } from "node:net";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { ensureProjectRuntimeAssets } from "../generator/template-engine.js";
import {
  DEVCONTAINER_DOCKER_FIX,
  detectHost,
  isContainerHost,
  WEBCONTAINER_UP_MESSAGE,
} from "../utils/agent-host.js";
import { handleDryRun } from "../utils/command-helpers.js";
import { completeEnvFile } from "../utils/env-validator.js";
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
import { createJsonEmitter } from "../utils/json-output.js";
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
import { buildSmokePlans, formatSmokeFailure, runSmokePlans } from "../utils/smoke.js";
import { buildTiltUpArgs, runTilt } from "../utils/tilt.js";
import { stopTiltOnPort } from "../utils/tilt-process.js";
import { findUnknownServices, resolveOnlySelection } from "../utils/up-only.js";
import { waitForTiltResourcesReady } from "../utils/up-readiness.js";
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

/** Why `tdk up` cannot work on this host, or null when it may proceed. Docker reachability is only probed in container hosts. */
export async function hostUpRefusal(
  host = detectHost(),
  dockerReachable: () => Promise<boolean> = defaultDockerReachable,
): Promise<string | null> {
  if (host.kind === "webcontainer") return WEBCONTAINER_UP_MESSAGE;
  if (isContainerHost(host.kind) && !(await dockerReachable())) return DEVCONTAINER_DOCKER_FIX;
  return null;
}

async function defaultDockerReachable(): Promise<boolean> {
  const { execFile } = await import("node:child_process");
  return new Promise((resolve) => {
    execFile("docker", ["ps"], { timeout: 10_000 }, (error) => resolve(!error));
  });
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
  .option(
    "--only <services...>",
    "Start only these services plus the services they depend on (and shared infrastructure)",
  )
  .option(
    "--json",
    "Print one JSON object on stdout when the stack is ready or the command fails; implies --quiet",
    false,
  )
  .action(async (stackName, options) => {
    const emit = options.json ? createJsonEmitter("UP_FAILED", "tdk up") : undefined;
    if (options.json) options.quiet = true;
    const hostRefusal = options.dryRun ? null : await hostUpRefusal();
    if (hostRefusal) {
      emit?.({ ok: false }, [{ code: "HOST_UNSUPPORTED", message: hostRefusal }]);
      showErrorAndExit(hostRefusal);
    }
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
        // An older project's .env predates keys such as JWT_SECRET, which Compose now requires. Add what is missing (never
        // changing an existing value) before anything starts. Only inside a real project, so a stray run never writes a .env.
        if (findProjectRoot()) {
          const addedEnvKeys = completeEnvFile(projectRoot);
          if (addedEnvKeys.length > 0 && !options.quiet) {
            console.log(
              chalk.gray(
                `Added ${addedEnvKeys.join(", ")} to .env (generated; existing values unchanged)`,
              ),
            );
          }
        }

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

      let dependencyNames: string[] = [];
      if (options.only) {
        const unknown = findUnknownServices(options.only, servicesToStart);
        if (unknown.length > 0) {
          const message = `Unknown service ${unknown.join(", ")}. Valid names: ${servicesToStart.map((s) => s.name).join(", ")}`;
          emit?.({ ok: false }, [{ code: "UNKNOWN_SERVICE", message }]);
          showErrorAndExit(message, 2);
        }
        // Dependencies come from the whole project, not just the named stack: dependsOn may cross stacks.
        const selection = resolveOnlySelection(options.only, discoverResources());
        servicesToStart = selection.selected;
        dependencyNames = selection.dependencies;
        focusServiceNames = servicesToStart.map((s) => s.name);
        stackDescription = `${formatCount(options.only.length, "requested service")}${dependencyNames.length > 0 ? ` plus ${dependencyNames.join(", ")}` : ""}`;
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

      const dryRunCommand = options.only
        ? `tilt up -- --focus=${options.only.join(",")} ${focusServiceNames.join(" ")}`
        : stackName
          ? `tilt up -- --focus=${stackName} ${focusServiceNames.join(" ")}`
          : "tilt up";
      if (!options.quiet) {
        console.log(chalk.blue(formatHostPortPlan(hostPortPlan)));
        console.log(
          chalk.gray("Override with TDK_HTTP_PORT, TDK_HTTPS_PORT, or TDK_POSTGRES_PORT."),
        );
      }
      if (emit && options.dryRun) {
        emit({
          ok: true,
          dryRun: true,
          stack: stackName ?? null,
          services: serviceNames,
          ...(options.only ? { requested: options.only, dependencies: dependencyNames } : {}),
          command: dryRunCommand,
        });
        return;
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
        if (availablePort && availablePort !== basePort && options.only) {
          // A second Tilt on another port would run a different Tiltfile selection against the same containers.
          const message = `Port ${basePort} is already in use, so a stack may already be running. --only cannot change a running stack's services: run \`tdk down\` first, or pass --force to replace it.`;
          emit?.({ ok: false }, [{ code: "TILT_ALREADY_RUNNING", message }]);
          showErrorAndExit(message);
        }
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
        focusTargets: options.only ?? (stackName ? [stackName] : undefined),
      });

      if (!options.quiet) {
        console.log(chalk.gray("\nRunning tilt up..."));
        console.log(chalk.gray(`Using Tiltfile: .tdk/.tdk-out/Tiltfile`));
      }

      const tiltRun = runTilt("up", tiltArgs, {
        verbose: options.verbose && !options.json,
        quiet: options.quiet,
        inheritStdio: !options.quiet, // Suppress tilt output in quiet mode
      });

      // Services that declare `smoke` are checked through the public URL once Tilt is up. A miss stops Tilt (containers stay for
      // inspection; `tdk down` removes them) and fails the command.
      const smokePlans = buildSmokePlans(servicesToStart, hostPortPlan.ingressHttp);
      let smokeFailed = false;

      let printedSuccess = false;
      const successOutput = (async () => {
        const uiReady = await waitForTiltUi(port);
        // JSON consumers get success only after every non-deferred resource is built and running, not when the UI port opens.
        let jsonReady = false;
        if (uiReady && emit) {
          const readiness = await waitForTiltResourcesReady(port);
          if (readiness.ready) {
            jsonReady = true;
          } else {
            const detail = readiness.failures.map((f) => `${f.name}: ${f.message}`).join("; ");
            emit({ ok: false, tiltUrl: `http://localhost:${port}`, failures: readiness.failures }, [
              {
                code: readiness.timedOut ? "UP_TIMEOUT" : "UP_RESOURCE_FAILED",
                message: `${readiness.timedOut ? "Timed out waiting for resources" : "Resources failed"}${detail ? ` (${detail})` : ""}. Tilt is still running; inspect it or run: tdk down`,
              },
            ]);
          }
        }
        if (uiReady && !options.quiet) {
          for (const line of formatUpSuccess(port)) console.log(chalk.blue(line));
          printedSuccess = true;
        }
        if (uiReady && smokePlans.length > 0 && (!emit || jsonReady)) {
          if (!options.quiet) {
            console.log(chalk.gray(`Smoke check: ${smokePlans.map((p) => p.name).join(", ")}`));
          }
          const results = await runSmokePlans(smokePlans, {
            recordDir: join(projectRoot, ".tdk", "smoke"),
          });
          for (const smokeResult of results) {
            if (smokeResult.ok) {
              if (!options.quiet)
                console.log(chalk.green(`Smoke check passed: ${smokeResult.name}`));
            } else {
              smokeFailed = true;
              console.error(chalk.red(formatSmokeFailure(smokeResult)));
            }
          }
          if (smokeFailed) {
            stopTiltOnPort(port);
            emit?.({ ok: false }, [
              { code: "UP_SMOKE_FAILED", message: "A smoke check failed; Tilt was stopped" },
            ]);
          }
        }
        if (uiReady && jsonReady && !smokeFailed) {
          emit?.({
            ok: true,
            stack: stackName ?? null,
            services: serviceNames,
            ...(options.only ? { requested: options.only, dependencies: dependencyNames } : {}),
            tiltUrl: `http://localhost:${port}`,
          });
        }
      })();
      const result = await tiltRun;
      await successOutput;

      if (smokeFailed) {
        process.exit(1);
      }

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
