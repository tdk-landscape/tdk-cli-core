import chalk from "chalk";
import { Command } from "commander";
import { handleDryRun } from "../utils/command-helpers.js";
import { handleTiltFailure, withTiltCheck } from "../utils/errors.js";
import { buildTiltDownArgs, runTilt } from "../utils/tilt.js";

export const downCommand = new Command("down")
  .description("Stop all tilt resources")
  .option("-v, --verbose", "Enable verbose output", false)
  .option("-f, --force", "Skip confirmation", false)
  .option("--dry-run", "Show what would be stopped without stopping", false)
  .action(async (options) => {
    await withTiltCheck(async () => {
      if (handleDryRun(options, "not stopping resources", "tilt down")) {
        return;
      }

      const tiltArgs = buildTiltDownArgs({
        force: options.force,
      });

      console.log(chalk.blue("Stopping all tilt resources..."));

      if (options.verbose) {
        console.log(chalk.gray("Running: tilt down -f .tdk/.tdk-out/Tiltfile"));
      }

      const result = await runTilt("down", tiltArgs, {
        verbose: options.verbose,
        inheritStdio: true,
      });

      if (result.exitCode !== 0) {
        handleTiltFailure("down", result.exitCode);
      }
    });
  });
