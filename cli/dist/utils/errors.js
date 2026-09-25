import chalk from "chalk";
import { QUICKSTART_DOCS_URL } from "./constants.js";
import { getContainerRuntimeStatus } from "./docker.js";
import { findProjectRoot } from "./paths.js";
import { isTiltAvailable } from "./tilt.js";
export function getErrorMessage(err) {
    return err instanceof Error ? err.message : String(err);
}
export function logVerbose(message, err) {
    if (process.env.TDK_VERBOSE) {
        const errMsg = err !== undefined ? `: ${getErrorMessage(err)}` : "";
        console.warn(chalk.gray(`${message}${errMsg}`));
    }
}
class TdkError extends Error {
    suggestions;
    exitCode;
    constructor(message, suggestions = [], exitCode = 1) {
        super(message);
        this.name = "TdkError";
        this.suggestions = suggestions;
        this.exitCode = exitCode;
    }
    display() {
        showError(this.message, undefined, this.suggestions);
    }
    /** Display this error and exit the process with its exit code. */
    exit() {
        this.display();
        process.exit(this.exitCode);
    }
}
export const errorFactories = {
    tiltNotInstalled: () => new TdkError("Tilt CLI is not installed", [
        "Install Tilt: `brew install tilt` (macOS)",
        "Or download from: https://docs.tilt.dev/install.html",
        "Verify with: `tilt version`",
        `Setup guide: ${QUICKSTART_DOCS_URL}`,
    ]),
    dockerNotAvailable: () => new TdkError("Docker (or a compatible container runtime) is not running", [
        "Start Docker Desktop, then verify with: `docker ps`",
        "Or start Colima: `colima start`",
        "Or start the Docker service on Linux: `sudo systemctl start docker`",
        `Setup guide: ${QUICKSTART_DOCS_URL}`,
    ]),
    dockerNotResponding: () => new TdkError("Docker is running but not responding (`docker ps` hung for 10s)", [
        "Quit and reopen Docker Desktop, or run `colima restart`",
        "Then verify with: `docker ps`",
    ]),
    stackNotFound: (name) => new TdkError(`Stack "${name}" not found`, [
        "Run `tdk stacks` to see available stacks",
        "Run `tdk stack` to assign resources to a stack",
    ]),
    resourceNotFound: (name) => new TdkError(`Resource "${name}" not found`, [
        "Run `tdk resources` to list all resources",
        "Check the resource name spelling",
    ]),
    directoryExists: (path) => new TdkError(`Directory already exists: ${path}`, [
        "Use `--path` to specify a different location",
        "Remove the existing directory if no longer needed",
    ]),
    invalidPath: (path) => new TdkError(`Invalid path: ${path}`, [
        "Path must be within the project directory",
        'Path cannot contain special characters like <>:"|?*',
    ]),
    notInProject: () => new TdkError("Could not find project root (no Tiltfile found)", [
        "Run this from within a project that has a Tiltfile",
        "Run `tdk project` to initialize a new project",
    ]),
};
export function requireProjectRoot() {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        console.error(chalk.red("Error: Could not find project root (no Tiltfile found)."));
        console.error(chalk.gray("Run this from within a project that has a Tiltfile."));
        process.exit(1);
    }
    return projectRoot;
}
function handleCommandError(err) {
    console.error(chalk.red(`Error: ${getErrorMessage(err)}`));
    process.exit(1);
}
export async function runCommand(action, options) {
    try {
        return await action();
    }
    catch (err) {
        if (options?.verbose && err instanceof Error && err.stack) {
            console.error(chalk.gray(err.stack));
        }
        return handleCommandError(err);
    }
}
export async function withTiltCheck(action, options) {
    const problems = [];
    const runtime = getContainerRuntimeStatus();
    if (runtime === "unresponsive") {
        problems.push(errorFactories.dockerNotResponding());
    }
    else if (runtime === "missing") {
        problems.push(errorFactories.dockerNotAvailable());
    }
    if (!(await isTiltAvailable())) {
        problems.push(errorFactories.tiltNotInstalled());
    }
    if (problems.length > 0) {
        console.error(chalk.red(`\nTDK can't start - missing prerequisites:\n`));
        problems.forEach((problem, i) => {
            if (i > 0)
                console.error("");
            problem.display();
        });
        console.error(chalk.gray(`\nRun \`tdk doctor\` for a full environment check.`));
        process.exit(1);
    }
    return runCommand(action, options);
}
export function showErrorAndExit(message, exitCode = 1) {
    console.error(chalk.red(`Error: ${message}`));
    process.exit(exitCode);
}
/** Display a formatted error message. Does NOT exit. */
function showError(message, context, suggestions) {
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
export function handleTiltFailure(command, exitCode) {
    console.error(chalk.red(`\ntilt ${command} failed with exit code ${exitCode}`));
    process.exit(exitCode);
}
//# sourceMappingURL=errors.js.map