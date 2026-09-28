import { exec } from "node:child_process";
import { promisify } from "node:util";
const execPromise = promisify(exec);
export const execAsync = async (command, timeoutMs) => {
    const { stdout } = await execPromise(command, { encoding: "utf-8", timeout: timeoutMs });
    return stdout;
};
/** `exec` kills a timed-out child and sets `killed`; `execSync` reports ETIMEDOUT. */
export function isExecTimeout(err) {
    const e = err;
    return e?.code === "ETIMEDOUT" || e?.killed === true;
}
//# sourceMappingURL=exec-async.js.map