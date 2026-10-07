import { Command } from "commander";
import type { CheckResult } from "../types/index.js";
import { type ExecAsync } from "../utils/exec-async.js";
export { checkIngressPorts, checkPrivateNpmRegistry, checkTiltResourceHealth, summarizeServiceProbes, summarizeTiltBuildError, } from "../utils/doctor-runtime.js";
export declare const DOCTOR_FIXES: {
    readonly dockerMissing: "See https://docs.docker.com/get-docker/";
    readonly dockerDaemonDown: "Start Docker Desktop, OrbStack, or Colima, then retry: tdk doctor";
    readonly tiltMissing: "curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash";
    readonly bunMissing: "curl -fsSL https://bun.sh/install | bash";
    readonly port80: "Stop the process bound to port 80, or stop local nginx/caddy. Then: tdk doctor";
    readonly port5432: "Stop local Postgres or change the host port. Then: tdk doctor";
    readonly notProject: "tdk project --yes";
};
export declare const WSL2_DOCTOR_MESSAGE = "WSL2 detected. Use Docker Desktop WSL integration. Guide: docs/wsl2.md";
export declare const NATIVE_WINDOWS_DOCTOR_MESSAGE = "Native Windows landscape boot is unsupported. Use WSL2 Ubuntu with Docker Desktop integration. Guide: docs/wsl2.md";
export declare const MIN_TILT_VERSION: readonly [0, 25, 0];
export declare const MIN_BUN_VERSION: readonly [1, 2, 0];
export declare function versionMeetsMinimum(raw: string, minimum: readonly number[]): boolean;
export declare function checkWslProjectLocation(projectPath: string, strict: boolean, isWsl?: boolean): CheckResult;
/** Failures are shown before passing statuses, with a 5432 conflict first. */
export declare function orderDoctorResults(results: CheckResult[]): CheckResult[];
export declare function getDoctorOutcomeMessage(inProject: boolean, allPassed: boolean): string;
export declare function checkDockerRuntime(): Promise<CheckResult>;
export declare const checkDockerCompose: () => Promise<CheckResult>;
export declare function checkDockerVersions(exec?: ExecAsync): Promise<CheckResult>;
export declare function checkTilt(exec?: ExecAsync): Promise<CheckResult>;
export declare function checkDockerOperatingSystem(exec?: ExecAsync): Promise<CheckResult>;
export declare function checkBun(exec?: ExecAsync): Promise<CheckResult>;
/**
 * A repo can pin the oldest CLI it works with: `"minTdkVersion": "1.3.80"` in
 * .tdk/project.json. An older `tdk` fails here, so a team sees one clear line
 * instead of a half-working `tdk up`.
 */
export declare function checkTdkVersion(currentVersion?: string): CheckResult;
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