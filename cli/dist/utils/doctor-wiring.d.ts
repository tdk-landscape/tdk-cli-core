import { execSync } from "node:child_process";
import type { CheckResult } from "../types/index.js";
import { type ExecAsync } from "./exec-async.js";
export declare function checkResourcePackageJson(projectRoot?: string): CheckResult;
/**
 * Two resources with one appName share a Compose service name and Traefik router and service names
 * (all built from the name, none from the directory), so one of them is lost or misrouted.
 */
export declare function checkDuplicateResourceNames(projectRoot?: string): CheckResult;
/**
 * Two routed resources on one `port`. This is a warning, not a failure: the engine publishes no service
 * port on the host and gives each resource its own container, which Traefik reaches as <container>:<port>,
 * so two containers can listen on 4000 at once. The pair still confuses the checks and URLs that identify
 * a backend by its port, and usually means a copied service.json.
 */
export declare function checkDuplicateResourcePorts(projectRoot?: string): CheckResult;
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