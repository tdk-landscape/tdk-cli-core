import chalk from "chalk";
import { Command } from "commander";
import { createDiscoveryContext } from "../utils/discovery-context.js";
import { runCommand } from "../utils/errors.js";
import { formatCount, showDetail, showEmptyState, showStep } from "../utils/formatting.js";

export const stacksCommand = new Command("stacks")
  .description("List all stacks and their resources")
  .alias("ls") // Keep 'tdk ls' as shorthand
  .option("-v, --verbose", "Show detailed information about each stack", false)
  .option("--services", "Include list of services in each stack", false)
  .action(async (options) => {
    await runCommand(async () => {
      const discovery = createDiscoveryContext();

      if (discovery.stackNames.length === 0) {
        showEmptyState("stacks");
        return;
      }

      if (options.verbose || options.services) {
        showStep(`Found ${formatCount(discovery.stacks.length, "stack")}:\n`);

        for (const stack of discovery.stacks) {
          console.log(chalk.bold(`${stack.name}`));
          showDetail(`${stack.description}`);

          if (options.services) {
            showDetail("Services:");
            for (const service of stack.resources) {
              showDetail(`${service.name}`, 4);
            }
          }

          console.log();
        }
      } else {
        showStep(`Found ${formatCount(discovery.stackNames.length, "stack")}:\n`);

        for (const name of discovery.stackNames) {
          const serviceCount = discovery.resourcesByStack.get(name)?.length || 0;
          console.log(chalk.bold(`  ${name}`));
          showDetail(`${formatCount(serviceCount, "service")}`, 4);
        }

        showDetail(
          "\nRun with --verbose for more details, or --services to see all services in each stack.",
          0,
        );
      }
    });
  });
