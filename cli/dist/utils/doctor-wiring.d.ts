import { execSync } from "node:child_process";
import type { CheckResult } from "../types/index.js";
import { type ExecAsync } from "./exec-async.js";
export declare function checkResourcePackageJson(projectRoot?: string): CheckResult;
export declare function checkServiceUrlPorts(projectRoot?: string): CheckResult;
export declare function checkFrontendBackendUrls(projectRoot?: string): CheckResult;
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