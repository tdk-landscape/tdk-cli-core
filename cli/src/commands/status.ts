import chalk from "chalk";
import { Command } from "commander";
import { createDiscoveryContext } from "../utils/discovery-context.js";
import { runCommand } from "../utils/errors.js";
import { formatCount, showDetail, showStep } from "../utils/formatting.js";
import { getTiltfilePath, isTiltAvailable, runTilt } from "../utils/tilt.js";

export const statusCommand = new Command("status")
  .description("Show status of resources and stacks")
  .option("-v, --verbose", "Show detailed information", false)
  .option("--stacks", "Show stack information (default)", true)
  .option("--resources", "Show all discovered resources", false)
  .option("--tilt", "Show tilt resource status", false)
  .action(async (options) => {
    await runCommand(async () => {
      let tiltAvailable = false;
      try {
        tiltAvailable = await isTiltAvailable();
      } catch {
        // Tilt not available (spawn error)
        tiltAvailable = false;
      }

      showStep("TDK Status\n");
      console.log(
        chalk.bold("Tilt:"),
        tiltAvailable ? chalk.green("available") : chalk.red("not found"),
      );

      if (!tiltAvailable) {
        showDetail("Install Tilt: https://docs.tilt.dev/install.html");
      }

      console.log();

      const discovery = createDiscoveryContext();
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
        console.log(
          chalk.yellow(
            `${formatCount(discovery.unassignedResources.length, "resource")} not in any stack:`,
          ),
        );

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
        } else {
          showDetail("Could not retrieve tilt resource status");
        }
      }

      console.log();
      showDetail('Run "tdk list-stacks" to see all stacks.');
      showDetail('Run "tdk up <stack-name>" to start a stack.');
    });
  });
