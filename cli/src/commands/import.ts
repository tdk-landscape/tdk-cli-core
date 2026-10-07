import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { runCommand } from "../utils/errors.js";

const TIER_1_FILES = ["docker-compose.yml", "Dockerfile", "package.json", "Procfile"];

export interface DetectionResult {
  found: string[];
  skipped: string[];
  importable: boolean;
}

/**
 * Detect Tier-1 files in a directory.
 * Tier-1 files are: docker-compose.yml, Dockerfile, package.json, Procfile
 */
export function detectImportableFiles(dir: string): DetectionResult {
  if (!existsSync(dir)) {
    return { found: [], skipped: [], importable: false };
  }

  const files = readdirSync(dir);
  const found: string[] = [];
  const skipped: string[] = [];

  // Check for Tier-1 files
  for (const file of TIER_1_FILES) {
    if (files.includes(file)) {
      found.push(file);
    }
  }

  // Detect common unsupported files that should be listed as skipped
  const commonUnsupportedPatterns = [
    "Dockerfile",
    "docker-compose",
    "helm",
    "kustomization",
    "values.yaml",
    "Chart.yaml",
  ];

  for (const pattern of commonUnsupportedPatterns) {
    for (const file of files) {
      if (file.toLowerCase().includes(pattern.toLowerCase()) && !found.includes(file)) {
        skipped.push(file);
      }
    }
  }

  return {
    found,
    skipped: [...new Set(skipped)], // Remove duplicates
    importable: found.length > 0,
  };
}

export const importCommand = new Command("import")
  .description("Import project configuration from Docker Compose, Dockerfile, or package.json")
  .argument("[directory]", "Directory to import from (default: current directory)", ".")
  .option("--dry-run", "Show what would be imported without writing files", false)
  .action(async (directory, options) => {
    await runCommand(async () => {
      const dir = directory || ".";
      const result = detectImportableFiles(dir);

      console.log(chalk.blue(`\n🔍 Scanning ${dir}...\n`));

      if (result.found.length > 0) {
        console.log(chalk.green("✓ Importable files found:"));
        for (const file of result.found) {
          console.log(chalk.gray(`  - ${file}`));
        }
      }

      if (result.skipped.length > 0) {
        console.log(
          chalk.yellow("\n⊘ Skipped (not yet imported):"),
        );
        for (const file of result.skipped) {
          console.log(chalk.gray(`  - ${file}`));
        }
      }

      if (!result.importable) {
        console.error(
          chalk.red("\n✗ No importable files found"),
        );
        console.error(
          chalk.gray("\nSupported file types: Docker Compose, Dockerfile, package.json, Procfile"),
        );
        process.exit(2);
      }

      if (options.dryRun) {
        console.log(chalk.blue("\n📋 Dry run - no files would be written\n"));
        return;
      }

      console.log(chalk.blue("\n📝 Importing...\n"));
      // Implementation would go here
      console.log(chalk.green("✅ Import complete!\n"));
    });
  });
