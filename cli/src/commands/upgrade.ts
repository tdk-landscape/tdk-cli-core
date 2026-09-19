import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { getErrorMessage, logVerbose, showErrorAndExit } from "../utils/errors.js";
import { showCancelled } from "../utils/formatting.js";
import { getPackageVersion } from "../utils/paths.js";

interface InstallInfo {
  method: "npm" | "bun" | "git" | "unknown";
  path?: string;
  version?: string;
}

function detectInstallation(): InstallInfo {
  try {
    const tdkPath = execSync("which tdk", { encoding: "utf-8" }).trim();

    const realPath = execSync(`readlink -f ${tdkPath}`, { encoding: "utf-8" }).trim();
    // If the real path contains tdk-cli and has .git, it's a linked git install
    if (realPath.includes("tdk-cli")) {
      const possibleGitRoot = resolve(realPath, "..", "..", "..");
      if (existsSync(join(possibleGitRoot, ".git"))) {
        return { method: "git", path: possibleGitRoot };
      }
    }

    if (tdkPath.includes("node_modules") || tdkPath.includes(".npm") || tdkPath.includes(".bun")) {
      if (tdkPath.includes(".bun")) {
        return { method: "bun", path: tdkPath };
      }
      return { method: "npm", path: tdkPath };
    }

    const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
    if (existsSync(join(cliRoot, ".git"))) {
      return { method: "git", path: cliRoot };
    }

    return { method: "unknown", path: tdkPath };
  } catch (err: unknown) {
    console.warn(chalk.yellow("⚠️ Could not detect installation method"));
    logVerbose("Installation detection error", err);
    return { method: "unknown" };
  }
}

function getCurrentVersion(): string {
  return getPackageVersion();
}

async function getLatestVersion(): Promise<string | null> {
  const spinner = ora("Checking for latest version...").start();

  try {
    const result = execSync("npm view @tdk/cli version", {
      encoding: "utf-8",
      timeout: 10000,
    }).trim();
    spinner.succeed(`Latest version: ${chalk.green(result)}`);
    return result;
  } catch (_err: unknown) {
    // npm registry failed - package not published yet
    spinner.warn("Package not yet published to npm registry");
    console.log(chalk.yellow("\n💡 For now, please upgrade manually from GitHub:"));
    console.log(chalk.cyan("   npm install -g github:tdk-landscape/tdk-cli"));
    console.log(chalk.cyan("   bun install -g github:tdk-landscape/tdk-cli"));
    console.log(chalk.gray("\n   (npm package will be available soon)"));
    return null;
  }
}

async function upgradeViaNpm(): Promise<boolean> {
  const spinner = ora("Upgrading via npm...").start();

  try {
    execSync("npm install -g @tdk/cli@latest", {
      stdio: "inherit",
      timeout: 120000,
    });
    spinner.succeed("Upgraded successfully via npm");
    return true;
  } catch (err: unknown) {
    // npm registry failed (package may not exist or network issue) - try GitHub fallback
    spinner.text = "npm registry failed, trying GitHub...";
    logVerbose("npm registry error", err);
    try {
      execSync("npm install -g github:tdk-landscape/tdk-cli", {
        stdio: "inherit",
        timeout: 120000,
      });
      spinner.succeed("Upgraded successfully via GitHub");
      return true;
    } catch (err: unknown) {
      spinner.fail(`Upgrade failed: ${getErrorMessage(err)}`);
      return false;
    }
  }
}

async function upgradeViaBun(): Promise<boolean> {
  const spinner = ora("Upgrading via bun...").start();

  try {
    execSync("bun install -g @tdk/cli@latest", {
      stdio: "inherit",
      timeout: 120000,
    });
    spinner.succeed("Upgraded successfully via bun");
    return true;
  } catch (err: unknown) {
    // bun registry failed (package may not exist or network issue) - try GitHub fallback
    spinner.text = "bun registry failed, trying GitHub...";
    logVerbose("bun registry error", err);
    try {
      execSync("bun install -g github:tdk-landscape/tdk-cli", {
        stdio: "inherit",
        timeout: 120000,
      });
      spinner.succeed("Upgraded successfully via GitHub");
      return true;
    } catch (err: unknown) {
      spinner.fail(`Upgrade failed: ${getErrorMessage(err)}`);
      return false;
    }
  }
}

async function upgradeViaGit(path: string): Promise<boolean> {
  const spinner = ora("Pulling latest changes from git...").start();

  try {
    execSync("git rev-parse --git-dir", {
      cwd: path,
      stdio: "pipe",
    });

    spinner.text = "Fetching from origin...";
    execSync("git fetch origin", {
      cwd: path,
      stdio: "pipe",
      timeout: 30000,
    });

    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: path,
      encoding: "utf-8",
    }).trim();

    spinner.text = `Pulling latest on ${branch}...`;
    execSync(`git pull origin ${branch}`, {
      cwd: path,
      stdio: "pipe",
      timeout: 30000,
    });

    if (existsSync(join(path, "cli", "package.json"))) {
      spinner.text = "Rebuilding CLI...";
      execSync("bun install && bun run build", {
        cwd: join(path, "cli"),
        stdio: "pipe",
        timeout: 60000,
      });
    }

    spinner.text = "Re-linking CLI...";
    execSync("bun link --force", {
      cwd: join(path, "cli"),
      stdio: "pipe",
      timeout: 30000,
    });

    spinner.succeed("Upgraded successfully via git pull");
    return true;
  } catch (err: unknown) {
    spinner.fail(`Git upgrade failed: ${getErrorMessage(err)}`);
    return false;
  }
}

export const upgradeCommand = new Command("upgrade")
  .description("Upgrade TDK CLI to the latest version")
  .option("-f, --force", "Force upgrade even if already on latest", false)
  .option("--dry-run", "Show what would be upgraded without actually doing it", false)
  .option("-y, --yes", "Skip confirmation prompt", false)
  .action(async (options) => {
    console.log(chalk.cyan("🚀 TDK CLI Upgrade\n"));

    const currentVersion = getCurrentVersion();
    console.log(chalk.gray(`Current version: ${currentVersion}`));

    const installInfo = detectInstallation();
    console.log(chalk.gray(`Installation method: ${installInfo.method}`));
    console.log();

    if (installInfo.method === "unknown") {
      console.error(chalk.red("❌ Could not detect installation method"));
      console.log(chalk.yellow("\n💡 Manual upgrade (package not on npm yet, use GitHub):"));
      console.log(chalk.cyan("   npm:  npm install -g github:tdk-landscape/tdk-cli"));
      console.log(chalk.cyan("   bun:  bun install -g github:tdk-landscape/tdk-cli"));
      console.log(chalk.cyan("   git:  cd /path/to/tdk-cli && git pull && bun link --force"));
      process.exit(1);
    }

    let latestVersion: string | null = null;

    if (installInfo.method === "git" && installInfo.path) {
      console.log(chalk.blue("📦 Git installation detected - will pull latest from origin"));

      try {
        execSync("git fetch origin", { cwd: installInfo.path, stdio: "pipe" });
        const localHash = execSync("git rev-parse HEAD", {
          cwd: installInfo.path,
          encoding: "utf-8",
        }).trim();
        const remoteHash = execSync("git rev-parse origin/main", {
          cwd: installInfo.path,
          encoding: "utf-8",
        }).trim();

        if (localHash === remoteHash && !options.force) {
          console.log(chalk.green("\n✅ Already up to date with origin/main!"));
          console.log(chalk.gray(`   Current: ${localHash.substring(0, 7)}`));
          console.log(chalk.gray("\n   Tip: Use --force to pull and rebuild anyway"));
          process.exit(0);
        }

        if (localHash !== remoteHash) {
          console.log(chalk.yellow(`\n⬆️  Updates available:`));
          console.log(chalk.gray(`   Local:  ${localHash.substring(0, 7)}`));
          console.log(chalk.gray(`   Remote: ${remoteHash.substring(0, 7)}`));
        } else {
          console.log(chalk.yellow(`\n🔄 Force upgrade requested`));
        }

        latestVersion = remoteHash.substring(0, 7);
      } catch (err: unknown) {
        console.warn(chalk.yellow("⚠️  Could not check git remote, will attempt upgrade anyway"));
        logVerbose("Git remote check failed", err);
        latestVersion = "latest";
      }
    } else {
      latestVersion = await getLatestVersion();

      if (!latestVersion) {
        showErrorAndExit("Could not determine latest version");
      }

      if (currentVersion === latestVersion && !options.force) {
        console.log(chalk.green("\n✅ You are already on the latest version!"));
        console.log(chalk.gray(`   ${currentVersion} (current) = ${latestVersion} (latest)`));
        process.exit(0);
      }

      if (currentVersion !== latestVersion) {
        console.log(chalk.yellow(`\n⬆️  Upgrade available: ${currentVersion} → ${latestVersion}`));
      } else if (options.force) {
        console.log(chalk.yellow(`\n🔄 Force upgrade requested (currently ${currentVersion})`));
      }
    }

    if (options.dryRun) {
      console.log(chalk.blue("\n📋 Dry run mode - would perform:"));
      console.log(chalk.gray(`   Method: ${installInfo.method}`));
      if (installInfo.path) {
        console.log(chalk.gray(`   Path: ${installInfo.path}`));
      }
      if (installInfo.method === "git") {
        console.log(
          chalk.gray("   Action: git pull origin main && bun install && bun link --force"),
        );
      } else {
        console.log(chalk.gray(`   Action: Upgrade to ${latestVersion}`));
      }
      console.log(chalk.yellow("\n   (Not actually upgrading due to --dry-run)"));
      process.exit(0);
    }

    if (!options.yes) {
      console.log();
      const { confirm } = await import("inquirer").then((m) =>
        m.default.prompt([
          {
            type: "confirm",
            name: "confirm",
            message: "Proceed with upgrade?",
            default: true,
          },
        ]),
      );

      if (!confirm) {
        showCancelled();
        process.exit(0);
      }
    } else {
      console.log(chalk.gray("⚡ Auto-confirming (--yes flag)\n"));
    }

    console.log();

    let success = false;

    switch (installInfo.method) {
      case "npm":
        success = await upgradeViaNpm();
        break;
      case "bun":
        success = await upgradeViaBun();
        break;
      case "git":
        if (installInfo.path) {
          success = await upgradeViaGit(installInfo.path);
        }
        break;
    }

    if (!success) {
      console.error(chalk.red("\n❌ Upgrade failed"));
      console.log(
        chalk.yellow("\n💡 Try manual upgrade (use GitHub until npm package is published):"),
      );
      if (installInfo.method === "npm") {
        console.log(chalk.cyan("   npm install -g github:tdk-landscape/tdk-cli"));
      } else if (installInfo.method === "bun") {
        console.log(chalk.cyan("   bun install -g github:tdk-landscape/tdk-cli"));
      } else if (installInfo.method === "git") {
        console.log(chalk.cyan(`   cd ${installInfo.path} && git pull && bun link --force`));
      }
      process.exit(1);
    }

    console.log();
    const verifySpinner = ora("Verifying upgrade...").start();

    try {
      const newVersion = execSync("tdk version", { encoding: "utf-8" }).trim();
      verifySpinner.succeed(`Verified: now running ${chalk.green(newVersion)}`);

      console.log();
      console.log(chalk.green.bold("✨ Upgrade complete!"));
      console.log(chalk.gray(`   Version: ${currentVersion} → ${newVersion}`));

      console.log();
      console.log(chalk.cyan.bold("📍 Installation Details:"));
      if (installInfo.method === "git" && installInfo.path) {
        console.log(chalk.gray(`   Location: ${installInfo.path}`));
        console.log(chalk.gray(`   Method:   git clone + bun link`));
      } else {
        console.log(chalk.gray(`   Method:   ${installInfo.method}`));
      }
      console.log(
        chalk.gray(`   Binary:   ${execSync("which tdk", { encoding: "utf-8" }).trim()}`),
      );

      console.log();
      console.log(chalk.cyan.bold("🚀 Quick Start:"));
      console.log(chalk.white(`   tdk --help         Show all commands`));
      console.log(chalk.white(`   tdk networks       View service URLs`));
      console.log(chalk.white(`   tdk doctor         Check environment`));

      if (newVersion === currentVersion && !options.force) {
        console.log();
        console.log(
          chalk.yellow("💡 Tip: Version appears unchanged. You may need to restart your terminal."),
        );
      }

      console.log();
      console.log(chalk.green("Happy coding! 🎉"));
    } catch (err: unknown) {
      verifySpinner.warn("Could not verify new version");
      console.error(chalk.red(`Verification error: ${getErrorMessage(err)}`));
      console.log();
      console.log(chalk.yellow("⚠️  Upgrade status unknown - verification failed"));
      console.log();
      console.log(chalk.yellow("💡 Verify manually:"));
      console.log(chalk.white("   1. Restart your terminal"));
      console.log(chalk.white("   2. Run: tdk version"));
      if (installInfo.path) {
        console.log(chalk.white(`   3. Compare with: git -C ${installInfo.path} rev-parse HEAD`));
      }
    }
  });
