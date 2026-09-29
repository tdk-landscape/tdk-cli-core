import type { CheckResult } from "../types/index.js";
export type PreflightItem = {
    id: "node" | "docker" | "compose" | "tilt" | "bun" | "ports" | "nats" | "prisma";
    ok: boolean;
    message: string;
    fix?: string;
};
export type PreflightResult = {
    ok: boolean;
    inProject: boolean;
    items: PreflightItem[];
    header: string;
    footer: string;
};
/** Returns whether a Node version is below the CLI's 22.12 minimum. */
export declare function nodeTooOld(version: string): boolean;
/** Requires a Docker engine and Compose version check to complete successfully. */
export declare function requireVerifiedDockerVersions(result: CheckResult): CheckResult;
export declare function runColdPreflight(opts?: {
    cwd?: string;
}): Promise<PreflightResult>;
/** Formats only failed preflight checks and the applicable readiness message. */
export declare function formatColdPreflight(result: PreflightResult, options?: {
    includeSuccessFooter?: boolean;
}): string;
/** Exits before machine-dependent command work when any machine check fails. */
export declare function assertMachineReadyOrExit(): Promise<void>;
//# sourceMappingURL=cold-preflight.d.ts.map