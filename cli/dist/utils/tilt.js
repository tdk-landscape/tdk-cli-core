import { spawn } from "node:child_process";
import { join } from "node:path";
import { findProjectRoot } from "./paths.js";
export function runTilt(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const tiltArgs = [command, ...args];
        if (options.verbose) {
            console.log(`Executing: tilt ${tiltArgs.join(" ")}`);
        }
        const child = spawn("tilt", tiltArgs, {
            stdio: options.inheritStdio ? "inherit" : "pipe",
            shell: false,
            timeout: options.timeoutMs,
        });
        let stdout = "";
        let stderr = "";
        if (!options.inheritStdio) {
            child.stdout?.on("data", (data) => {
                stdout += data.toString();
            });
            child.stderr?.on("data", (data) => {
                stderr += data.toString();
            });
        }
        child.on("close", (code) => {
            resolve({
                exitCode: code ?? 1,
                stdout,
                stderr,
            });
        });
        child.on("error", (err) => {
            reject(new Error(`Failed to spawn tilt: ${err.message}`));
        });
    });
}
export async function isTiltAvailable() {
    try {
        const result = await runTilt("version", [], { inheritStdio: false, timeoutMs: 10_000 });
        return result.exitCode === 0;
    }
    catch {
        // tilt binary not found (or not spawnable) - treat as unavailable
        return false;
    }
}
export function getTiltfilePath() {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        throw new Error("Not in a TDK project (no .tdk/project.json found)");
    }
    return join(projectRoot, ".tdk", ".tdk-out", "Tiltfile");
}
function addTiltfilePath(args) {
    const tiltfilePath = getTiltfilePath();
    args.push("-f", tiltfilePath);
}
export function buildTiltUpArgs(serviceNames, options = {}) {
    const args = [];
    addTiltfilePath(args);
    // Bare positional resource names only scope what this `tilt up` invocation waits
    // on - they do NOT limit which resources the generated Tiltfile enables. Its focus
    // filter (Config.apply_focus / apply_focus_filter) only reads the `--focus` flag;
    // the positional-args catch-all it also defines (`cfg['args']`) is never read. So
    // without `--focus`, every `tdk up <stack>` silently fell back to Tilt's default
    // "pre-alpha" phase and built every stack in that phase, not just the one asked
    // for. Passing the stack name via `--focus` reuses the Tiltfile's own (already
    // dependency-aware) domain expansion instead of re-deriving it here.
    //
    // `--focus=...` needs a `--` before it: Tilt's own `tilt up` only accepts its own
    // fixed flag set directly (see `tilt up --help`) and rejects anything else with
    // "unknown flag" - `--` is what routes a token through to the Tiltfile's own
    // config.parse(). Bare words like a service name aren't flag-shaped, so they don't
    // need `--` to reach the Tiltfile's positional `args` catch-all.
    if (options.focusTargets && options.focusTargets.length > 0) {
        args.push("--", `--focus=${options.focusTargets.join(",")}`);
    }
    args.push(...serviceNames);
    if (options.verbose && !options.quiet) {
        args.push("--verbose");
    }
    if (options.watch) {
        args.push("--watch");
    }
    return args;
}
export function buildTiltDownArgs(options = {}) {
    const args = [];
    addTiltfilePath(args);
    if (options.force) {
        args.push("--force");
    }
    return args;
}
//# sourceMappingURL=tilt.js.map