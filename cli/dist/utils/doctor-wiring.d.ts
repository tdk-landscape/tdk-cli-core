import { execSync } from "node:child_process";
import type { CheckResult } from "../types/index.js";
import { type ExecAsync } from "./exec-async.js";
export declare function checkResourcePackageJson(projectRoot?: string): CheckResult;
export declare function checkServiceUrlPorts(projectRoot?: string): CheckResult;
export declare function checkFrontendBackendUrls(projectRoot?: string): CheckResult;
/**
 * A backend or worker that applies migrations from its own start-up (a `start` script, a Dockerfile CMD,
 * an entrypoint script or its source) races its siblings and runs again on every restart. TDK has a
 * `migrator` app type for this: it runs once, before the services that depend on it. This is a warning,
 * not a failure: such services work, and the opt-in Infisical entrypoint is one of them.
 */
export declare function checkMigrationsInApi(projectRoot?: string): CheckResult;
export declare function checkNatsBroker(projectRoot?: string): CheckResult;
interface TiltProcess {
    pid: number;
    root: string;
}
export declare function parseTiltProcesses(psOutput: string): TiltProcess[];
export declare function checkTiltInstances(projectRoot?: string, exec?: typeof execSync): CheckResult;
export declare function checkDockerNetworkCapacity(exec?: ExecAsync): Promise<CheckResult>;
export {};
//# sourceMappingURL=doctor-wiring.d.ts.map