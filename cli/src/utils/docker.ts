import { execSync } from "node:child_process";

/** True if Docker, Colima, or Podman is installed and its daemon is reachable. */
export function isDockerAvailable(): boolean {
  for (const command of ["docker ps", "colima status", "podman ps"]) {
    try {
      execSync(command, { stdio: "ignore" });
      return true;
    } catch {}
  }
  return false;
}
