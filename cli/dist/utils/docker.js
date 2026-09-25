import { execSync } from "node:child_process";
// A wedged daemon makes `docker ps` block forever instead of failing.
const RUNTIME_CHECK_TIMEOUT_MS = 10_000;
/** Whether Docker, Colima, or Podman is reachable, hung, or absent. */
export function getContainerRuntimeStatus() {
    let sawTimeout = false;
    for (const command of ["docker ps", "colima status", "podman ps"]) {
        try {
            execSync(command, { stdio: "ignore", timeout: RUNTIME_CHECK_TIMEOUT_MS });
            return "running";
        }
        catch (err) {
            if (err.code === "ETIMEDOUT")
                sawTimeout = true;
        }
    }
    return sawTimeout ? "unresponsive" : "missing";
}
//# sourceMappingURL=docker.js.map