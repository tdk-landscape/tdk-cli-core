import { execSync } from "node:child_process";
import chalk from "chalk";
import { Command } from "commander";
import { ensureProjectRuntimeAssets } from "../generator/template-engine.js";
import { handleDryRun } from "../utils/command-helpers.js";
import { errorFactories, handleTiltFailure, withTiltCheck } from "../utils/errors.js";
import { formatCount } from "../utils/formatting.js";
import { findAvailablePort } from "../utils/port-assignment.js";
import { findProjectRoot } from "../utils/paths.js";
import { appendHealthPath, resolveSubdomainBases } from "../utils/service-urls.js";
import {
  discoverResources,
  discoverStacks,
  getResourcesForStack,
  stackExists,
} from "../utils/services.js";
import { buildTiltUpArgs, runTilt } from "../utils/tilt.js";

export const upCommand = new Command("up")
  .description("Start all services (optionally filtered by stack)")
  .alias("deploy")
  .argument("[stack-name]", "Name of the stack to start (optional - runs all if omitted)")
  .option("-v, --verbose", "Enable verbose output", false)
  .option("-q, --quiet", "Suppress non-essential output", false)
  .option("--dry-run", "Show what would be started without starting", false)
  .option("-f, --force", "Kill existing Tilt process before starting", false)
  .action(async (stackName, options) => {
    await withTiltCheck(async () => {
      const projectRoot = findProjectRoot() ?? process.cwd();
      const copiedAssets = ensureProjectRuntimeAssets(projectRoot);
      if (copiedAssets.length > 0 && options.verbose && !options.quiet) {
        console.log(chalk.gray(`Refreshed runtime assets: ${copiedAssets.join(", ")}`));
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
            `Starting ${formatCount(serviceNames.length, "service")} from ${stackDescription}...`,
          ),
        );
        serviceNames.forEach((name) => {
          console.log(chalk.gray(`  - ${name}`));
        });

        const { appBase, apiBase } = resolveSubdomainBases();
        const frontends = servicesToStart.filter((s) => s.config?.appType === "frontend");
        const backends = servicesToStart.filter((s) => s.config?.appType === "backend");

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
            console.log(
              chalk.gray(`  - ${svc.name}: ${apiBase}${chalk.cyan(appendHealthPath(apiPath))}`),
            );
          });
        }
      }

      const dryRunCommand = stackName
        ? `tilt up -- --focus=${stackName} ${focusServiceNames.join(" ")}`
        : "tilt up";
      if (handleDryRun(options, "not starting services", dryRunCommand)) {
        return;
      }

      if (options.force && !options.quiet) {
        console.log(chalk.yellow("Force flag set - killing any existing Tilt processes..."));
        execSync("killall tilt 2>/dev/null || true", { shell: "/bin/sh", stdio: "pipe" });
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const basePort = 10350;
      let port = basePort;

      if (process.env.TILT_PORT) {
        port = parseInt(process.env.TILT_PORT, 10);
      } else {
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

      const tiltArgs = buildTiltUpArgs(focusServiceNames, {
        verbose: options.verbose,
        quiet: options.quiet,
        force: options.force,
        focusTargets: stackName ? [stackName] : undefined,
      });

      if (!options.quiet) {
        console.log(chalk.gray("\nRunning tilt up..."));
        console.log(chalk.gray(`Using Tiltfile: .tdk/.tdk-out/Tiltfile`));
        console.log(chalk.blue(`📊 Tilt UI: http://localhost:${port}/\n`));
      }
      const result = await runTilt("up", tiltArgs, {
        verbose: options.verbose,
        quiet: options.quiet,
        inheritStdio: !options.quiet, // Suppress tilt output in quiet mode
      });

      if (result.exitCode !== 0) {
        handleTiltFailure("up", result.exitCode);
      }
    });
  });
