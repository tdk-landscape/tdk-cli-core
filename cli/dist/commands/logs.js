import { Command } from "commander";
import { STANDARD_PORTS } from "../utils/constants.js";
import { runCommand, showErrorAndExit } from "../utils/errors.js";
import { createMachineEnvelope } from "../utils/machine-output.js";
import { isTiltAvailable, runTilt } from "../utils/tilt.js";
import { DEFAULT_LOG_TAIL, isValidPort, isValidSince, isValidTail, parseTiltLogLines, } from "../utils/tilt-logs.js";
/** Resource names Tilt knows about, or null when they cannot be listed (the logs call then reports the real error). */
async function tiltResourceNames(port) {
    try {
        const result = await runTilt("get", ["uiresources", "-o", "json", "--port", port], {
            inheritStdio: false,
        });
        if (result.exitCode !== 0)
            return null;
        const items = JSON.parse(result.stdout)
            .items;
        return (items ?? []).flatMap((item) => (item.metadata?.name ? [item.metadata.name] : []));
    }
    catch {
        return null;
    }
}
export const logsCommand = new Command("logs")
    .description("Print a bounded snapshot of recent logs from the running stack")
    .option("-s, --service <names...>", "Only these services (Tilt resource names)")
    .option("--tail <n>", "Number of most recent lines to return", String(DEFAULT_LOG_TAIL))
    .option("--since <duration>", "Only logs newer than this duration, for example 30s, 5m, 1h")
    .option("--port <n>", "Tilt UI port (default: TILT_PORT or 10350)")
    .option("--json", "Output one JSON object and exit", false)
    .action(async (options) => {
    const fail = (code, message, exitCode = 1) => {
        if (options.json) {
            console.log(JSON.stringify(createMachineEnvelope(null, [{ code, message }])));
            console.error(message);
            process.exit(exitCode);
        }
        return showErrorAndExit(message, exitCode);
    };
    if (!isValidTail(options.tail))
        fail("USAGE", "--tail must be a positive integer", 2);
    if (options.since && !isValidSince(options.since)) {
        fail("USAGE", "--since must be a duration such as 30s, 5m or 1h", 2);
    }
    const portText = options.port ?? process.env.TILT_PORT ?? String(STANDARD_PORTS.tiltUi);
    if (!isValidPort(portText))
        fail("USAGE", "--port must be a valid port number", 2);
    const tail = Number(options.tail);
    const services = options.service ?? [];
    const action = async () => {
        if (!(await isTiltAvailable())) {
            fail("TILT_MISSING", "Tilt is not installed. Run: tdk doctor");
        }
        if (services.length > 0) {
            const known = await tiltResourceNames(portText);
            const unknown = services.filter((name) => known && !known.includes(name));
            if (unknown.length > 0) {
                fail("UNKNOWN_SERVICE", `Unknown service ${unknown.join(", ")}. Valid names: ${(known ?? []).join(", ")}`, 2);
            }
        }
        const args = ["--port", portText, "--tail", String(tail)];
        if (options.since)
            args.push("--since", options.since);
        if (options.json)
            args.push("--json");
        args.push(...services);
        const result = await runTilt("logs", args, { inheritStdio: false });
        if (result.exitCode !== 0) {
            fail("TILT_NOT_RUNNING", `Could not read logs from Tilt on port ${portText}: ${result.stderr.trim() || "is the stack running? Start it with: tdk up"}`);
        }
        if (!options.json) {
            process.stdout.write(result.stdout);
            return;
        }
        const lines = parseTiltLogLines(result.stdout, tail);
        console.log(JSON.stringify(createMachineEnvelope({ services, tail, since: options.since ?? null, lines })));
    };
    await runCommand(action);
});
//# sourceMappingURL=logs.js.map