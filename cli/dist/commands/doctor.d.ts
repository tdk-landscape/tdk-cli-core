import { execSync } from "node:child_process";
import { Command } from "commander";
import type { CheckResult } from "../types/index.js";
export { checkIngressPorts, checkPrivateNpmRegistry, checkTiltResourceHealth, summarizeTiltBuildError, } from "../utils/doctor-runtime.js";
export declare function checkDockerVersions(exec?: typeof execSync): CheckResult;
export declare function checkGeneratedProjectRuntimeAssets(): CheckResult;
export declare function checkStarlarkLoadExports(): CheckResult;
/**
 * Backend/frontend tsconfig generators set `"types": ["bun"]` on the
 * assumption that `@types/bun` is a direct devDependency (`tdk resource`
 * adds it for new services). Nothing re-adds it if a service's package.json
 * loses that entry -- e.g. a checkout missing it entirely, or a manual edit
 * -- and the failure only surfaces later as `tsc: TS2688: Cannot find type
 * definition file for 'bun'` inside `bun run build`, mid Docker image build.
 */
export declare function checkTypeScriptTypeDependencies(): CheckResult;
export declare function checkFrontendDockerPreflight(): CheckResult;
export declare const doctorCommand: Command;
//# sourceMappingURL=doctor.d.ts.map