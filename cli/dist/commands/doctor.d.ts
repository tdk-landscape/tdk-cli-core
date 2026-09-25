import { Command } from "commander";
import type { CheckResult } from "../types/index.js";
export { checkIngressPorts, checkPrivateNpmRegistry, checkTiltResourceHealth, summarizeTiltBuildError, } from "../utils/doctor-runtime.js";
export declare function checkGeneratedProjectRuntimeAssets(): CheckResult;
export declare function checkStarlarkLoadExports(): CheckResult;
export declare function checkFrontendDockerPreflight(): CheckResult;
export declare const doctorCommand: Command;
//# sourceMappingURL=doctor.d.ts.map