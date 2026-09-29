import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { confirmOrCancel } from "../utils/command-helpers.js";
import { runCommand } from "../utils/errors.js";
import { findProjectRoot } from "../utils/paths.js";

export const EJECTED_CONTENT = `# Ejected from TDK

## Keep

Keep the generated Tiltfile, Docker Compose files, and Traefik configuration. Tilt and Docker use these files to run your local landscape.

## Optional to delete

After checking that the files above contain everything you need, you may delete the TDK project metadata and generated files. Keep any files you have edited or rely on.

## To go back

Run \`tdk config regenerate\` to regenerate the TDK configuration.
`;

export const ejectCommand = new Command("eject")
  .description("Take ownership of the generated Tilt and Docker files")
  .option("--dry-run", "List generated files without changing the project", false)
  .option("--yes", "Skip the confirmation prompt", false)
  .action(async (options) => {
    await runCommand(async () => {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        throw new Error("tdk eject: no .tdk/project.json in this directory or parents");
      }
      const generatedPaths = [".tdk/.tdk-out"];
      const presentPaths = generatedPaths.filter((path) => existsSync(join(projectRoot, path)));
      const files = presentPaths.flatMap((path) => {
        const absolutePath = join(projectRoot, path);
        if (statSync(absolutePath).isFile()) return [path];
        try {
          return readdirSync(absolutePath, { recursive: true }).map((entry) =>
            join(path, entry.toString()),
          );
        } catch {
          return [path];
        }
      });
      if (!existsSync(join(projectRoot, ".tdk", ".tdk-out", "Tiltfile"))) {
        throw new Error(
          "Generated Tilt files are missing. Run `tdk project --yes` before ejecting.",
        );
      }
      const rootTiltfile = join(projectRoot, "Tiltfile");
      if (existsSync(rootTiltfile)) files.push("Tiltfile");
      const ejectedPath = join(projectRoot, "EJECTED.md");
      const willCreate = existsSync(ejectedPath) ? [] : ["EJECTED.md"];

      if (options.dryRun) {
        console.log("Files kept:");
        for (const path of files) console.log(`  ${path}`);
        console.log("Files created:");
        for (const path of willCreate) console.log(`  ${path}`);
        if (willCreate.length === 0) console.log("  (none)");
        return;
      }

      if (
        !options.yes &&
        !(await confirmOrCancel("Take ownership of the generated Tilt and Docker files?"))
      ) {
        return;
      }

      if (!existsSync(ejectedPath)) writeFileSync(ejectedPath, EJECTED_CONTENT, { flag: "wx" });
      console.log(chalk.green("Ejected. Tilt and Docker files are yours."));
      console.log("Next: tilt up");
      console.log("Read EJECTED.md");
    });
  });
