import { exec } from "node:child_process";
import { promisify } from "node:util";

const execPromise = promisify(exec);

/** Runs a shell command without blocking the event loop; resolves with trimmed-free stdout. */
export type ExecAsync = (command: string, timeoutMs: number) => Promise<string>;

export const execAsync: ExecAsync = async (command, timeoutMs) => {
  const { stdout } = await execPromise(command, { encoding: "utf-8", timeout: timeoutMs });
  return stdout;
};

/** `exec` kills a timed-out child and sets `killed`; `execSync` reports ETIMEDOUT. */
export function isExecTimeout(err: unknown): boolean {
  const e = err as (NodeJS.ErrnoException & { killed?: boolean }) | undefined;
  return e?.code === "ETIMEDOUT" || e?.killed === true;
}
