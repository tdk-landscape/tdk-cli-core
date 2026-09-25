import { existsSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { createDiscoveryContext } from "../utils/discovery-context.js";
import { requireProjectRoot, runCommand } from "../utils/errors.js";
import { formatCount } from "../utils/formatting.js";
import { MASTER_CONFIG_FILES } from "../utils/constants.js";
export const projectsCommand = new Command("projects")
    .description("Show project information and configuration status")
    .alias("info")
    .option("--check", "Check if project is properly configured", false)
    .action(async (options) => {
    await runCommand(async () => {
        const projectRoot = requireProjectRoot();
        console.log(chalk.blue("Project Information\n"));
        console.log(chalk.bold("Project Root:"));
        console.log(chalk.gray(`  ${projectRoot}`));
        console.log();
        const outDir = join(projectRoot, ".tdk", ".tdk-out");
        const missing = MASTER_CONFIG_FILES.filter((file) => !existsSync(join(outDir, file)));
        console.log(chalk.bold("Master Configuration:"));
        if (missing.length === 0) {
            for (const file of MASTER_CONFIG_FILES) {
                console.log(chalk.green(`  ✓ ${file}`));
            }
        }
        else {
            for (const file of MASTER_CONFIG_FILES) {
                const exists = !missing.includes(file);
                if (exists) {
                    console.log(chalk.green(`  ✓ ${file}`));
                }
                else {
                    console.log(chalk.red(`  ✗ ${file} (missing)`));
                }
            }
        }
        console.log();
        const discovery = createDiscoveryContext();
        console.log(chalk.bold("Project Stats:"));
        console.log(chalk.gray(`  Resources: ${discovery.resources.length}`));
        console.log(chalk.gray(`  Stacks:    ${discovery.stackNames.length}`));
        if (discovery.unassignedResources.length > 0) {
            console.log(chalk.yellow(`  ⚠ Unassigned: ${formatCount(discovery.unassignedResources.length, "resource")}`));
        }
        console.log();
        if (discovery.stackNames.length > 0) {
            console.log(chalk.bold("Stacks:"));
            for (const name of discovery.stackNames) {
                const count = discovery.resourcesByStack.get(name)?.length || 0;
                console.log(chalk.gray(`  ${name} (${formatCount(count, "resource")})`));
            }
            console.log();
        }
        if (missing.length > 0) {
            console.log(chalk.yellow("Project not fully configured!"));
            console.log(chalk.gray('Run "tdk project" to create master config files.\n'));
        }
        else {
            console.log(chalk.gray("Quick commands:"));
            console.log(chalk.gray("  tdk resource    - Create a new resource"));
            console.log(chalk.gray("  tdk stack       - Organize resources into stacks"));
            console.log(chalk.gray("  tdk up <stack>  - Start a stack"));
        }
        if (options.check) {
            process.exit(missing.length === 0 ? 0 : 1);
        }
    });
});
//# sourceMappingURL=projects.js.map