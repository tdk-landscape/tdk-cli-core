import chalk from "chalk";
import { Command } from "commander";
import { handleDryRun } from "../utils/command-helpers.js";
import { handleTiltFailure, withTiltCheck } from "../utils/errors.js";
import { createJsonEmitter } from "../utils/json-output.js";
import { buildTiltDownArgs, runTilt } from "../utils/tilt.js";
export const downCommand = new Command("down")
    .description("Stop all tilt resources")
    .option("-v, --verbose", "Enable verbose output", false)
    .option("-f, --force", "Skip confirmation", false)
    .option("--dry-run", "Show what would be stopped without stopping", false)
    .option("--json", "Print one JSON object on stdout; implies quiet human output", false)
    .action(async (options) => {
    const emit = options.json ? createJsonEmitter("DOWN_FAILED", "tdk down") : undefined;
    await withTiltCheck(async () => {
        if (emit && options.dryRun) {
            emit({ ok: true, dryRun: true });
            return;
        }
        if (handleDryRun(options, "not stopping resources", "tilt down")) {
            return;
        }
        const tiltArgs = buildTiltDownArgs({
            force: options.force,
        });
        if (!options.json)
            console.log(chalk.blue("Stopping all tilt resources..."));
        if (options.verbose && !options.json) {
            console.log(chalk.gray("Running: tilt down -f .tdk/.tdk-out/Tiltfile"));
        }
        const result = await runTilt("down", tiltArgs, {
            verbose: options.verbose && !options.json,
            inheritStdio: !options.json,
        });
        if (result.exitCode !== 0) {
            handleTiltFailure("down", result.exitCode);
        }
        emit?.({ ok: true });
    });
});
//# sourceMappingURL=down.js.map