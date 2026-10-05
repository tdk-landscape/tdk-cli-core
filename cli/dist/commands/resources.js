import chalk from "chalk";
import { Command } from "commander";
import { createDiscoveryContext } from "../utils/discovery-context.js";
import { errorFactories, requireProjectRoot, runCommand } from "../utils/errors.js";
import { formatCount, showAllSatisfyCondition, showDetail, showEmptyState, showStep, } from "../utils/formatting.js";
import { createMachineEnvelope, writeMachineError } from "../utils/machine-output.js";
import { findProjectRoot } from "../utils/paths.js";
import { stackExists } from "../utils/services.js";
export const resourcesCommand = new Command("resources")
    .description("List all resources (services) in the project")
    .option("-v, --verbose", "Show detailed information about each resource", false)
    .option("-s, --stack <stack>", "Filter resources by stack name")
    .option("--no-stack", "Show only resources without a stack")
    .option("--ports", "Show port assignments", false)
    .option("--json", "Output a versioned JSON resource report", false)
    .action(async (options) => {
    const action = async () => {
        if (options.json) {
            if (!findProjectRoot()) {
                writeMachineError(new Error("Could not find project root (no .tdk/project.json found)"));
            }
        }
        else {
            requireProjectRoot();
        }
        const discovery = createDiscoveryContext();
        if (options.stack && !stackExists(options.stack, discovery.resources)) {
            const error = errorFactories.stackNotFound(options.stack);
            if (options.json)
                writeMachineError(error);
            error.exit();
        }
        const withoutStackFilter = options.noStack || options.stack === false;
        let resources = discovery.resources;
        if (options.stack) {
            resources = discovery.resourcesByStack.get(options.stack) || [];
            if (resources.length === 0 && !options.json) {
                showEmptyState("stack-services", ` in stack "${options.stack}"`);
                return;
            }
        }
        if (withoutStackFilter) {
            resources = discovery.unassignedResources;
            if (resources.length === 0 && !options.json) {
                showAllSatisfyCondition("resources", "assigned to a stack");
                return;
            }
        }
        if (options.json) {
            const data = resources.map((resource) => ({
                name: resource.name,
                stack: resource.stack ?? null,
                type: resource.config?.appType ?? resource.type ?? "unknown",
                port: resource.port ?? null,
                path: resource.configPath,
            }));
            console.log(JSON.stringify(createMachineEnvelope({ resources: data })));
            return;
        }
        if (resources.length === 0) {
            showEmptyState(options.stack ? "stack-services" : "resources", options.stack ? ` in stack "${options.stack}"` : "");
            return;
        }
        showStep(`Found ${formatCount(resources.length, "resource")}:\n`);
        if (options.verbose || options.ports) {
            for (const resource of resources) {
                console.log(chalk.bold(`${resource.name}`));
                if (resource.stack) {
                    console.log(chalk.gray(`  Stack: ${resource.stack}`));
                }
                else {
                    console.log(chalk.yellow(`  Stack: (not assigned)`));
                }
                if (options.ports && resource.port) {
                    console.log(chalk.gray(`  Port: ${resource.port}`));
                }
                if (options.verbose) {
                    console.log(chalk.gray(`  Type: ${resource.type || "unknown"}`));
                    console.log(chalk.gray(`  Path: ${resource.configPath}`));
                }
                console.log();
            }
        }
        else {
            for (const resource of resources) {
                const stackInfo = resource.stack
                    ? chalk.gray(` [${resource.stack}]`)
                    : chalk.yellow(" [no stack]");
                console.log(`  ${resource.name}${stackInfo}`);
            }
            showDetail("\nRun with --verbose for more details or --ports to see port assignments.", 0);
        }
        const withoutStackCount = options.stack
            ? resources.filter((r) => !r.stack).length
            : discovery.unassignedResources.length;
        if (withoutStackCount > 0 && !withoutStackFilter && !options.stack) {
            console.log(chalk.yellow(`\n${formatCount(withoutStackCount, "resource")} not assigned to any stack.`));
            showDetail('Run "tdk resources --no-stack" to see them, or "tdk stack" to assign them.');
        }
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
//# sourceMappingURL=resources.js.map