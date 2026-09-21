import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { hasVerdaccioLicense } from "../generator/extension-fetch.js";
import {
  generateMasterConfigs,
  readProjectConfig,
  TemplateEngine,
  verifyMasterConfigs,
} from "../generator/template-engine.js";
import type { JsonValue, ProjectConfig } from "../types/index.js";
import { isMasterConfigFileName } from "../types/index.js";
import { assertValid } from "../utils/command-helpers.js";
import { MASTER_CONFIG_FILES } from "../utils/constants.js";
import { requireProjectRoot, runCommand } from "../utils/errors.js";
import { writeJsonFile } from "../utils/file-helpers.js";
import { validateOptionalInfraService } from "../utils/validation.js";

/**
 * Serialize ProjectConfig to JSON-safe value.
 * ProjectConfig is guaranteed to be JSON-serializable (all properties are primitive or plain objects).
 * This wrapper documents the type relationship that TypeScript cannot infer.
 */
function _serializeProjectConfig(config: unknown): JsonValue {
  // ProjectConfig has no index signature but is structurally compatible with JsonValue
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return config as JsonValue;
}

export const configCommand = new Command("config")
  .description("Manage project configuration and regenerate master files")
  .addCommand(
    new Command("regenerate")
      .description("Regenerate all 4 master config files from .tdk/project.json")
      .option("--dry-run", "Show what would change without writing files")
      .action(async (options) => {
        await runCommand(async () => {
          const projectRoot = requireProjectRoot();

          if (options.dryRun) {
            console.log(
              chalk.blue("🔍 Dry run - comparing current files with new configuration...\n"),
            );

            const projectConfig = readProjectConfig(projectRoot);
            const engine = new TemplateEngine();
            const newFiles = engine.generateAll(projectConfig);

            const outputDir = join(projectRoot, ".tdk", ".tdk-out");
            const filesToCheck = MASTER_CONFIG_FILES;

            let hasChanges = false;

            for (const filename of filesToCheck) {
              // Runtime validation with type guard eliminates type assertion
              if (!isMasterConfigFileName(filename)) {
                continue; // Skip unknown files (shouldn't happen with const array)
              }
              const newContent = newFiles[filename];
              const filePath = join(outputDir, filename);

              if (!existsSync(filePath)) {
                console.log(chalk.yellow(`📁 ${filename}`));
                console.log(chalk.gray("   Status: NEW (file does not exist)\n"));
                hasChanges = true;
                continue;
              }

              const currentContent = readFileSync(filePath, "utf-8");

              if (currentContent === newContent) {
                console.log(chalk.green(`✓ ${filename}`));
                console.log(chalk.gray("   Status: No changes\n"));
              } else {
                console.log(chalk.yellow(`📝 ${filename}`));
                console.log(chalk.gray("   Status: MODIFIED"));

                const currentLines = currentContent.split("\n").length;
                const newLines = newContent.split("\n").length;
                const lineDiff = newLines - currentLines;

                if (lineDiff > 0) {
                  console.log(chalk.gray(`   Lines: ${currentLines} → ${newLines} (+${lineDiff})`));
                } else if (lineDiff < 0) {
                  console.log(chalk.gray(`   Lines: ${currentLines} → ${newLines} (${lineDiff})`));
                } else {
                  console.log(chalk.gray(`   Lines: ${currentLines} (content changed)`));
                }

                const currentLinesArr = currentContent.split("\n");
                const newLinesArr = newContent.split("\n");
                let firstDiffLine = -1;

                for (let i = 0; i < Math.max(currentLinesArr.length, newLinesArr.length); i++) {
                  if (currentLinesArr[i] !== newLinesArr[i]) {
                    firstDiffLine = i;
                    break;
                  }
                }

                if (firstDiffLine >= 0) {
                  console.log(chalk.gray(`   First change around line ${firstDiffLine + 1}:`));
                  const contextStart = Math.max(0, firstDiffLine - 1);
                  const contextEnd = Math.min(currentLinesArr.length, firstDiffLine + 2);

                  for (let i = contextStart; i < contextEnd; i++) {
                    const line = currentLinesArr[i];
                    const newLine = newLinesArr[i];
                    if (line !== newLine) {
                      if (line !== undefined) {
                        console.log(
                          chalk.red(
                            `     - ${line.substring(0, 60)}${line.length > 60 ? "..." : ""}`,
                          ),
                        );
                      }
                      if (newLine !== undefined) {
                        console.log(
                          chalk.green(
                            `     + ${newLine.substring(0, 60)}${newLine.length > 60 ? "..." : ""}`,
                          ),
                        );
                      }
                    } else {
                      console.log(
                        chalk.gray(
                          `       ${line.substring(0, 60)}${line.length > 60 ? "..." : ""}`,
                        ),
                      );
                    }
                  }
                }

                console.log("");
                hasChanges = true;
              }
            }

            if (hasChanges) {
              console.log(chalk.blue("💡 Run without --dry-run to apply these changes.\n"));
            } else {
              console.log(chalk.green("✅ All files are already up to date!\n"));
            }

            return;
          }

          console.log(chalk.blue("📋 Regenerating master configuration files...\n"));
          await generateMasterConfigs(projectRoot);
          console.log(chalk.green("\n✅ Configuration regenerated!"));
        });
      }),
  )
  .addCommand(
    new Command("verify")
      .description("Verify that generated files match .tdk/project.json")
      .action(async () => {
        await runCommand(async () => {
          const projectRoot = requireProjectRoot();

          console.log(chalk.blue("🔍 Verifying configuration...\n"));
          const result = verifyMasterConfigs(projectRoot);

          if (result.valid) {
            console.log(chalk.green("✅ All files are in sync!"));
            return;
          } else {
            console.log(chalk.yellow("⚠️  Configuration issues found:"));
            for (const error of result.errors) {
              console.log(chalk.gray(`   - ${error}`));
            }
            console.log(chalk.gray("\nRun `tdk config regenerate` to fix."));
            process.exit(1);
          }
        });
      }),
  )
  .addCommand(
    new Command("edit").description("Open .tdk/project.json in your $EDITOR").action(async () => {
      await runCommand(async () => {
        const projectRoot = requireProjectRoot();

        const projectJsonPath = join(projectRoot, ".tdk", "project.json");
        if (!existsSync(projectJsonPath)) {
          throw new Error(".tdk/project.json not found");
        }

        const editor = process.env.EDITOR || "vi";
        console.log(chalk.blue(`Opening ${projectJsonPath} in ${editor}...`));

        const editorParts = editor.trim().split(/\s+/);
        const editorCmd = editorParts[0];
        const editorArgs = [...editorParts.slice(1), projectJsonPath];

        const allowedEditors = [
          "vi",
          "vim",
          "nano",
          "emacs",
          "code",
          "subl",
          "atom",
          "mate",
          "pico",
          "micro",
          "hx",
        ];
        const editorBase = editorCmd.replace(/.*\//, ""); // Remove path prefix for validation
        if (!allowedEditors.includes(editorBase)) {
          console.error(
            chalk.yellow(`Warning: Unknown editor "${editorCmd}". Using 'vi' instead.`),
          );
          spawnSync("vi", [projectJsonPath], { stdio: "inherit" });
        } else {
          spawnSync(editorCmd, editorArgs, { stdio: "inherit" });
        }

        console.log(chalk.green("\n✅ Editor closed."));
        console.log(chalk.gray("Run `tdk config regenerate` to apply changes."));
      });
    }),
  );

/**
 * Type guard for optional infrastructure service keys.
 * Validates that a service name is a valid key of the optional_infra object.
 */
function isOptionalInfraKey(
  service: string,
  config: ProjectConfig,
): service is keyof ProjectConfig["optional_infra"] {
  return service in config.optional_infra;
}

async function toggleInfraService(service: string, enabled: boolean): Promise<void> {
  const projectRoot = requireProjectRoot();

  // Validates service is in OPTIONAL_INFRA_SERVICES array
  const validation = validateOptionalInfraService(service);
  assertValid(validation);

  // Verdaccio is a Premium feature - refuse to enable it without a license
  // key that actually grants it, rather than writing a config that
  // generateMasterConfigs will just silently downgrade back to false later.
  if (service === "verdaccio" && enabled) {
    const granted = await hasVerdaccioLicense(projectRoot);
    if (!granted) {
      throw new Error(
        "Verdaccio is a Premium feature and requires a license key that grants it. " +
          "Set export TDK_LICENSE_KEY=<key> (get one at https://tdk-landscape.github.io/#waitlist) and try again.",
      );
    }
  }

  const config = readProjectConfig(projectRoot);

  // Runtime validation: ensure service is a valid key of optional_infra
  if (!isOptionalInfraKey(service, config)) {
    throw new Error(
      `Invalid infrastructure service: "${service}". ` +
        `Must be one of: ${Object.keys(config.optional_infra).join(", ")}`,
    );
  }

  // Type-safe assignment: service is now narrowed to OptionalInfraKey
  config.optional_infra[service] = enabled;

  const projectJsonPath = join(projectRoot, ".tdk", "project.json");
  // ProjectConfig is guaranteed to be JSON-serializable
  writeJsonFile(projectJsonPath, config as unknown);

  const action = enabled ? "Enabled" : "Disabled";
  console.log(chalk.green(`✓ ${action}: ${service}`));
  console.log(chalk.gray("Run `tdk config regenerate` to apply."));
}

configCommand
  .addCommand(
    new Command("enable-infra")
      .description("Enable optional infrastructure service")
      .argument("<service>", "Service name (monitoring, elk, debezium, golden_image, verdaccio)")
      .action(async (service) => {
        await runCommand(async () => {
          await toggleInfraService(service, true);
        });
      }),
  )
  .addCommand(
    new Command("disable-infra")
      .description("Disable optional infrastructure service")
      .argument("<service>", "Service name (monitoring, elk, debezium, golden_image, verdaccio)")
      .action(async (service) => {
        await runCommand(async () => {
          await toggleInfraService(service, false);
        });
      }),
  );
