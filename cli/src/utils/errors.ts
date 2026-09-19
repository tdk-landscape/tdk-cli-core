import chalk from "chalk";
import { findProjectRoot } from "./paths.js";
import { isTiltAvailable } from "./tilt.js";

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function logVerbose(message: string, err?: unknown): void {
  if (process.env.TDK_VERBOSE) {
    const errMsg = err !== undefined ? `: ${getErrorMessage(err)}` : "";
    console.warn(chalk.gray(`${message}${errMsg}`));
  }
}

class TdkError extends Error {
  public suggestions: string[];
  public exitCode: number;

  constructor(message: string, suggestions: string[] = [], exitCode: number = 1) {
    super(message);
    this.name = "TdkError";
    this.suggestions = suggestions;
    this.exitCode = exitCode;
  }

  display(): void {
    showError(this.message, undefined, this.suggestions);
  }
}

export const errorFactories = {
  tiltNotInstalled: () =>
    new TdkError("Tilt CLI is not installed", [
      "Install Tilt: `brew install tilt` (macOS)",
      "Or download from: https://docs.tilt.dev/install.html",
      "Verify with: `tilt version`",
    ]),
  stackNotFound: (name: string) =>
    new TdkError(`Stack "${name}" not found`, [
      "Run `tdk stacks` to see available stacks",
      "Run `tdk stack` to assign resources to a stack",
    ]),
  resourceNotFound: (name: string) =>
    new TdkError(`Resource "${name}" not found`, [
      "Run `tdk resources` to list all resources",
      "Check the resource name spelling",
    ]),
  directoryExists: (path: string) =>
    new TdkError(`Directory already exists: ${path}`, [
      "Use `--path` to specify a different location",
      "Remove the existing directory if no longer needed",
    ]),
  invalidPath: (path: string) =>
    new TdkError(`Invalid path: ${path}`, [
      "Path must be within the project directory",
      'Path cannot contain special characters like <>:"|?*',
    ]),
  notInProject: () =>
    new TdkError("Could not find project root (no Tiltfile found)", [
      "Run this from within a project that has a Tiltfile",
      "Run `tdk project` to initialize a new project",
    ]),
};

export function requireProjectRoot(): string {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.error(chalk.red("Error: Could not find project root (no Tiltfile found)."));
    console.error(chalk.gray("Run this from within a project that has a Tiltfile."));
    process.exit(1);
  }
  return projectRoot;
}

function handleCommandError(err: unknown): never {
  console.error(chalk.red(`Error: ${getErrorMessage(err)}`));
  process.exit(1);
}

export async function runCommand<T>(
  action: () => Promise<T>,
  options?: { verbose?: boolean },
): Promise<T | never> {
  try {
    return await action();
  } catch (err: unknown) {
    if (options?.verbose && err instanceof Error && err.stack) {
      console.error(chalk.gray(err.stack));
    }
    return handleCommandError(err);
  }
}

export async function withTiltCheck<T>(
  action: () => Promise<T>,
  options?: { verbose?: boolean },
): Promise<T | never> {
  if (!(await isTiltAvailable())) {
    errorFactories.tiltNotInstalled().display();
    process.exit(1);
  }
  return runCommand(action, options);
}

export function showErrorAndExit(message: string, exitCode: number = 1): never {
  console.error(chalk.red(`Error: ${message}`));
  process.exit(exitCode);
}

/** Display a formatted error message. Does NOT exit. */
function showError(message: string, context?: string, suggestions?: string[]): void {
  console.error(chalk.red(`❌ ${message}`));

  if (context) {
    console.error(chalk.gray(`   ${context}`));
  }

  if (suggestions && suggestions.length > 0) {
    console.error(chalk.yellow("\n💡 Suggestions:"));
    suggestions.forEach((s) => {
      console.error(chalk.cyan(`   → ${s}`));
    });
  }
}

export function handleTiltFailure(command: "up" | "down", exitCode: number): never {
  console.error(chalk.red(`\ntilt ${command} failed with exit code ${exitCode}`));
  process.exit(exitCode);
}
