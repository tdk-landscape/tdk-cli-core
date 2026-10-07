import type { CheckResult } from "../types/index.js";
/** A dependsOn that is not a list of service names cannot be followed, so say so instead of failing later. */
export declare function checkDependsOnShape(projectRoot?: string): CheckResult;
/** Services that wait on each other can never both start. A dependsOn name that is not a service is left to the unknown-name check. */
export declare function checkCircularDependencies(projectRoot?: string): CheckResult;
/** A port outside 1-65535 can never be bound, and `tdk up` would otherwise find out only when Docker fails. */
export declare function checkServicePorts(projectRoot?: string): CheckResult;
/**
 * Runs before anything starts (also under --dry-run, like the drift gate): duplicate service names, circular
 * dependsOn and invalid ports exit with 1 and say which file, which field, and how to fix it.
 */
export declare function enforceServiceConfigGate(projectRoot: string, options?: {
    onInvalid?: (message: string) => void;
}, exit?: (code: number) => never): void;
//# sourceMappingURL=service-config-checks.d.ts.map