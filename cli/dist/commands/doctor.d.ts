import { execSync } from "node:child_process";
import { Command } from "commander";
import type { CheckResult } from "../types/index.js";
export { checkIngressPorts, checkPrivateNpmRegistry, checkTiltResourceHealth, summarizeServiceProbes, summarizeTiltBuildError, } from "../utils/doctor-runtime.js";
export declare function checkDockerVersions(exec?: typeof execSync): CheckResult;
export declare function checkGeneratedProjectRuntimeAssets(): CheckResult;
export declare function checkStarlarkLoadExports(): CheckResult;
export declare function checkTypeScriptTypeDependencies(): CheckResult;
export declare function checkFrontendDockerPreflight(): CheckResult;
export declare const doctorCommand: Command;
//# sourceMappingURL=doctor.d.ts.map