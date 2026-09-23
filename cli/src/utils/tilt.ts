import { spawn } from "node:child_process";
import { join } from "node:path";
import type { TiltCommandResult } from "../types/index.js";
import { findProjectRoot } from "./paths.js";

export function runTilt(
  command: string,
  args: string[] = [],
  options: {
    verbose?: boolean;
    quiet?: boolean;
    inheritStdio?: boolean;
    timeoutMs?: number;
  } = {},
): Promise<TiltCommandResult> {
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
      child.stdout?.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data: Buffer) => {
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

export async function isTiltAvailable(): Promise<boolean> {
  try {
    const result = await runTilt("version", [], { inheritStdio: false, timeoutMs: 10_000 });
    return result.exitCode === 0;
  } catch {
    // tilt binary not found (or not spawnable) - treat as unavailable
    return false;
  }
}

export function getTiltfilePath(): string {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    throw new Error("Not in a TDK project (no .tdk/project.json found)");
  }

  return join(projectRoot, ".tdk", ".tdk-out", "Tiltfile");
}

function addTiltfilePath(args: string[]): void {
  const tiltfilePath = getTiltfilePath();
  args.push("-f", tiltfilePath);
}

export function buildTiltUpArgs(
  serviceNames: string[],
  options: {
    verbose?: boolean;
    quiet?: boolean;
    force?: boolean;
    watch?: boolean;
  } = {},
): string[] {
  const args: string[] = [];
  addTiltfilePath(args);
  args.push(...serviceNames);

  if (options.verbose && !options.quiet) {
    args.push("--verbose");
  }

  if (options.watch) {
    args.push("--watch");
  }

  return args;
}

export function buildTiltDownArgs(options: { force?: boolean } = {}): string[] {
  const args: string[] = [];
  addTiltfilePath(args);

  if (options.force) {
    args.push("--force");
  }

  return args;
}
