import chalk from "chalk";
import { Command } from "commander";
import { createDiscoveryContext } from "../utils/discovery-context.js";
import { runCommand } from "../utils/errors.js";
import { formatCount, showDetail, showStep } from "../utils/formatting.js";
import { getHostPortPlan } from "../utils/host-port-config.js";
import { createMachineEnvelope, writeMachineError } from "../utils/machine-output.js";
import { findProjectRoot } from "../utils/paths.js";
import { buildServicePorts, buildStackPorts } from "../utils/status-ports.js";
import { getTiltfilePath, isTiltAvailable, runTilt } from "../utils/tilt.js";
export const statusCommand = new Command("status")
    .description("Show status of resources and stacks")
    .option("--json", "Output a versioned JSON status report", false)
    .option("-v, --verbose", "Show detailed information", false)
    .option("--stacks", "Show stack information (default)", true)
    .option("--resources", "Show all discovered resources", false)
    .option("--tilt", "Show tilt resource status", false)
    .action(async (options) => {
    const action = async () => {
        // Discover first: outside a project this fails before any status line is printed.
        const discovery = createDiscoveryContext();
        let tiltAvailable = false;
        try {
            tiltAvailable = await isTiltAvailable();
        }
        catch {
            // Tilt not available (spawn error)
            tiltAvailable = false;
        }
        if (!options.json) {
            showStep("TDK Status\n");
            console.log(chalk.bold("Tilt:"), tiltAvailable ? chalk.green("available") : chalk.red("not found"));
            if (!tiltAvailable) {
                showDetail("Install Tilt: https://docs.tilt.dev/install.html");
            }
            console.log();
        }
        let tiltResources = null;
        let queryError = null;
        if (options.json && options.tilt && tiltAvailable) {
            const result = await runTilt("get", ["-f", getTiltfilePath(), "resources", "--output=json"], {
                inheritStdio: false,
            });
            if (result.exitCode === 0) {
                try {
                    tiltResources = JSON.parse(result.stdout);
                }
                catch (error) {
                    queryError = `Tilt returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`;
                }
            }
            else {
                queryError = result.stderr || "Could not retrieve Tilt resource status";
            }
        }
        if (options.json) {
            let portPlan = null;
            try {
                const root = findProjectRoot();
                portPlan = root ? await getHostPortPlan(root, { inspectDocker: false }) : null;
            }
            catch {
                // Port planning is best effort; stack ports then list only the Tilt UI.
            }
            const errors = queryError ? [{ code: "TILT_STATUS_UNAVAILABLE", message: queryError }] : [];
            const data = {
                tilt: {
                    available: tiltAvailable,
                    resourcesQueried: options.tilt && tiltAvailable,
                    resources: tiltResources,
                },
                resources: discovery.resources.map((resource) => ({
                    name: resource.name,
                    stack: resource.stack ?? null,
                    type: resource.type ?? "unknown",
                    port: resource.port ?? null,
                    ...buildServicePorts(resource, portPlan?.ingressHttp),
                })),
                ports: buildStackPorts(portPlan, process.env.TILT_PORT ? Number.parseInt(process.env.TILT_PORT, 10) : undefined),
                stacks: discovery.stacks.map((stack) => ({
                    name: stack.name,
                    resourceCount: stack.resourceCount,
                })),
            };
            console.log(JSON.stringify(createMachineEnvelope(data, errors)));
            if (errors.length > 0) {
                console.error(queryError);
                process.exit(1);
            }
            return;
        }
        console.log(chalk.bold("Resources:"), `${discovery.resources.length} discovered`);
        console.log(chalk.bold("Stacks:"), `${discovery.stacks.length} defined`);
        if (discovery.stacks.length > 0) {
            for (const stack of discovery.stacks) {
                const resourcesInStack = stack.resources.length;
                showDetail(`${stack.name}: ${formatCount(resourcesInStack, "resource")}`);
                if (options.verbose) {
                    for (const resource of stack.resources) {
                        showDetail(`${resource.name}`, 6);
                    }
                }
            }
        }
        if (discovery.unassignedResources.length > 0) {
            console.log();
            console.log(chalk.yellow(`${formatCount(discovery.unassignedResources.length, "resource")} not in any stack:`));
            if (options.verbose) {
                for (const resource of discovery.unassignedResources) {
                    showDetail(`${resource.name}`);
                }
            }
        }
        if (options.tilt && tiltAvailable) {
            console.log();
            showStep("Tilt Resources:");
            const tiltfilePath = getTiltfilePath();
            const result = await runTilt("get", ["-f", tiltfilePath, "resources"], {
                inheritStdio: false,
            });
            if (result.exitCode === 0) {
                console.log(result.stdout || chalk.gray("  No active tilt resources"));
            }
            else {
                showDetail("Could not retrieve tilt resource status");
            }
        }
        console.log();
        showDetail('Run "tdk list-stacks" to see all stacks.');
        showDetail('Run "tdk up <stack-name>" to start a stack.');
    };
    if (options.json) {
        try {
            await action();
        }
        catch (error) {
            writeMachineError(error);
        }
        return;
    }
    await runCommand(action);
});
//# sourceMappingURL=status.js.map