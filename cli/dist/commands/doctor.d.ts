import { Command } from "commander";
import type { CheckResult } from "../types/index.js";
import { type ExecAsync } from "../utils/exec-async.js";
export { checkIngressPorts, checkPrivateNpmRegistry, checkTiltResourceHealth, summarizeServiceProbes, summarizeTiltBuildError, } from "../utils/doctor-runtime.js";
export declare function checkDockerRuntime(): Promise<CheckResult>;
export declare const checkDockerCompose: () => Promise<CheckResult>;
export declare function checkDockerVersions(exec?: ExecAsync): Promise<CheckResult>;
export declare const checkTilt: () => Promise<CheckResult>;
export declare function checkBun(): Promise<CheckResult>;
/**
 * Tilt only builds resources under `discovery.paths`, but the CLI finds every service.json,
 * so a resource outside them is listed and given a URL by `tdk up` yet never started.
 */
export declare function checkResourceDiscovery(): CheckResult;
export declare function checkGeneratedProjectRuntimeAssets(): CheckResult;
export declare function checkStarlarkLoadExports(): CheckResult;
export declare function checkTypeScriptTypeDependencies(): CheckResult;
export declare function checkFrontendDockerPreflight(): CheckResult;
export declare const doctorCommand: Command;
//# sourceMappingURL=doctor.d.ts.map