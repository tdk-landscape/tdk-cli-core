import chalk from "chalk";
import { Command } from "commander";
import { createDiscoveryContext } from "../utils/discovery-context.js";
import { requireProjectRoot, runCommand } from "../utils/errors.js";
import { formatCount, showAllSatisfyCondition, showDetail, showEmptyState, showStep, } from "../utils/formatting.js";
export const resourcesCommand = new Command("resources")
    .description("List all resources (services) in the project")
    .option("-v, --verbose", "Show detailed information about each resource", false)
    .option("-s, --stack <stack>", "Filter resources by stack name")
    .option("--no-stack", "Show only resources without a stack")
    .option("--ports", "Show port assignments", false)
    .action(async (options) => {
    await runCommand(async () => {
        requireProjectRoot();
        const discovery = createDiscoveryContext();
        if (discovery.resources.length === 0) {
            showEmptyState("resources");
            return;
        }
        let resources = discovery.resources;
        if (options.stack) {
            resources = discovery.resourcesByStack.get(options.stack) || [];
            if (resources.length === 0) {
                showEmptyState("stack-services", ` in stack "${options.stack}"`);
                return;
            }
        }
        if (options.noStack) {
            resources = discovery.unassignedResources;
            if (resources.length === 0) {
                showAllSatisfyCondition("resources", "assigned to a stack");
                return;
            }
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
        if (withoutStackCount > 0 && !options.noStack && !options.stack) {
            console.log(chalk.yellow(`\n${formatCount(withoutStackCount, "resource")} not assigned to any stack.`));
            showDetail('Run "tdk resources --no-stack" to see them, or "tdk stack" to assign them.');
        }
    });
});
//# sourceMappingURL=resources.js.map