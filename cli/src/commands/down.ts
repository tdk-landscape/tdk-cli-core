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
  .option("--json", "Print one JSON object on stdout; implies quiet human output", false)
  .action(async (options) => {
    await withTiltCheck(async () => {
      if (options.json && options.dryRun) {
        console.log(
          JSON.stringify({ schemaVersion: 1, data: { ok: true, dryRun: true }, errors: [] }),
        );
        return;
      }
      if (handleDryRun(options, "not stopping resources", "tilt down")) {
        return;
      }

      const tiltArgs = buildTiltDownArgs({
        force: options.force,
      });

      if (!options.json) console.log(chalk.blue("Stopping all tilt resources..."));

      if (options.verbose && !options.json) {
        console.log(chalk.gray("Running: tilt down -f .tdk/.tdk-out/Tiltfile"));
      }

      const result = await runTilt("down", tiltArgs, {
        verbose: options.verbose,
        inheritStdio: !options.json,
      });

      if (result.exitCode !== 0) {
        if (options.json) {
          console.log(
            JSON.stringify({
              schemaVersion: 1,
              data: { ok: false },
              errors: [
                {
                  code: "DOWN_FAILED",
                  message: `tilt down failed with exit code ${result.exitCode}`,
                },
              ],
            }),
          );
        }
        handleTiltFailure("down", result.exitCode);
      }
      if (options.json) {
        console.log(JSON.stringify({ schemaVersion: 1, data: { ok: true }, errors: [] }));
      }
    });
  });
