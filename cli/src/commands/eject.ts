import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { confirmOrCancel } from "../utils/command-helpers.js";
import { requireProjectRoot, runCommand } from "../utils/errors.js";

export const EJECTED_CONTENT = `# Ejected from TDK

TDK generated the Tilt and Docker runtime files in this project. They are now yours to edit.

Run \`tilt up\` to start the landscape. TDK will no longer regenerate these files automatically.
`;

export const ejectCommand = new Command("eject")
  .description("Take ownership of the generated Tilt and Docker files")
  .option("--dry-run", "List generated files without changing the project", false)
  .option("--yes", "Skip the confirmation prompt", false)
  .action(async (options) => {
    await runCommand(async () => {
      const projectRoot = requireProjectRoot();
      const generatedPaths = [".tdk/.tdk-out", "engine", "discovery", "specs", "ext"];
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
