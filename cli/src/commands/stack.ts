import { readFileSync } from "node:fs";
import chalk from "chalk";
import { Command } from "commander";
import { confirmOrCancel } from "../utils/command-helpers.js";
import { clearDiscoveryCache, createDiscoveryContext } from "../utils/discovery-context.js";
import { requireProjectRoot, runCommand } from "../utils/errors.js";
import { writeJsonFile } from "../utils/file-helpers.js";
import {
  formatCount,
  showAllSatisfyCondition,
  showCommandHeader,
  showDetail,
  showSuccess,
} from "../utils/formatting.js";
import { promptMultiSelect, promptText } from "../utils/prompt.js";
import { createKebabCaseValidator } from "../utils/validation.js";

export const stackCommand = new Command("stack")
  .description("Organize resources into stacks (groups)")
  .argument("[stack-name]", "Stack name to assign to resources")
  .option("--list", "List resources without a stack", false)
  .action(async (stackName, options) => {
    await runCommand(async () => {
      requireProjectRoot();

      showCommandHeader("Stack Management");

      const discovery = createDiscoveryContext();

      if (discovery.resources.length === 0) {
        console.log(
          chalk.yellow(
            "No resources discovered. Make sure you're in a project with service.json files.",
          ),
        );
        return;
      }

      showDetail(`Found ${formatCount(discovery.resources.length, "resource")}\n`, 0);

      if (discovery.stackNames.length > 0) {
        console.log(chalk.bold("Existing stacks:"));
        for (const name of discovery.stackNames) {
          const count = discovery.resourcesByStack.get(name)?.length || 0;
          showDetail(`${name} (${formatCount(count, "resource")})`);
        }
        console.log();
      }

      if (options.list) {
        if (discovery.unassignedResources.length === 0) {
          showAllSatisfyCondition("resources", "already assigned to a stack");
          return;
        }

        console.log(
          chalk.bold(`${discovery.unassignedResources.length} resources without a stack:`),
        );
        for (const resource of discovery.unassignedResources) {
          showDetail(`${resource.name}`);
          showDetail(`${resource.configPath}`, 4);
        }
        return;
      }

      let targetStack = stackName;
      if (!targetStack) {
        const name = await promptText({
          message: "Stack name (kebab-case recommended):",
          validate: (input: string) => {
            const validation = createKebabCaseValidator("stack")(input);
            return validation === true || validation;
          },
        });
        targetStack = name;
      }

      const resourcesToUpdate = discovery.unassignedResources;

      if (resourcesToUpdate.length === 0) {
        console.log(chalk.yellow("\nNo resources available to add to this stack."));
        return;
      }

      const selectedResources = await promptMultiSelect({
        message: `Select resources to add to stack "${targetStack}":`,
        choices: resourcesToUpdate.map((r) => ({
          title: r.name,
          value: r.configPath,
        })),
        validate: (input: string[]) => {
          if (input.length === 0) return "Select at least one resource";
          return true;
        },
      });

      if (selectedResources.length === 0) {
        console.log(chalk.yellow("No resources selected. Exiting."));
        return;
      }

      showDetail(
        `\nWill add "stack": "${targetStack}" to ${formatCount(selectedResources.length, "resource")}.`,
        0,
      );

      const confirmed = await confirmOrCancel("Proceed?");
      if (!confirmed) return;

      // Clear cache since we're about to modify resources
      clearDiscoveryCache();

      let updated = 0;
      for (const configPath of selectedResources) {
        const content = readFileSync(configPath, "utf-8");
        const config = JSON.parse(content);
        config.stack = targetStack;
        writeJsonFile(configPath, config);

        updated++;
        showSuccess(`${config.appName || configPath}`);
      }

      console.log();
      showSuccess(`Updated ${formatCount(updated, "resource")}.`);
      showDetail(`\nYou can now run: tdk up ${targetStack}`, 0);
    });
  });
