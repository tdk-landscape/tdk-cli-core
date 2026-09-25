import { execSync } from "node:child_process";
import type { CheckResult } from "../types/index.js";
/** Host ports Traefik publishes for local ingress. Without these, app routes never come up. */
export declare const INGRESS_PORTS: readonly [80, 443];
export declare function toComposeProjectPrefix(projectName: string): string;
export interface PublishedPortHolder {
    name: string;
    ports: string;
    publishedPorts: number[];
}
/**
 * Parse `docker ps --format '{{.Names}}\t{{.Ports}}'` lines into containers that
 * publish specific host ports (e.g. 0.0.0.0:80->80/tcp).
 */
export declare function parsePublishedPortHolders(dockerPsOutput: string, ports: readonly number[]): PublishedPortHolder[];
export declare function isOwnIngressContainer(containerName: string, projectPrefix: string): boolean;
export declare function findForeignIngressHolders(holders: PublishedPortHolder[], projectPrefix: string): PublishedPortHolder[];
export interface TiltResourceFailure {
    name: string;
    updateStatus: string;
    runtimeStatus: string;
    error: string;
}
/**
 * Extract failing UIResources from `tilt get uiresources -o json`.
 */
export declare function parseTiltResourceFailures(jsonText: string): {
    failures: TiltResourceFailure[];
    pendingCount: number;
    okCount: number;
    total: number;
};
/**
 * Turn noisy Tilt/Docker build errors into an actionable one-liner.
 * Prefer registry/network root causes over truncated ImageBuild exit lines.
 */
export declare function summarizeTiltBuildError(error: string): string;
export declare function isRegistryRelatedBuildError(error: string): boolean;
export declare function projectExpectsVerdaccio(projectRoot?: string): boolean;
/**
 * When the project uses a local Verdaccio registry, fail early with a clear
 * fix instead of only showing truncated ImageBuild exit codes later.
 */
export declare function checkPrivateNpmRegistry(exec?: typeof execSync, projectRoot?: string, registryUrl?: string): CheckResult;
/**
 * Fail when another container already owns Traefik's host ports (80/443).
 * This is the exact failure mode that leaves apps never scheduled while doctor
 * previously reported "Environment ready".
 */
export declare function checkIngressPorts(exec?: typeof execSync, projectName?: string): CheckResult;
/**
 * When a Tilt session is active, surface resource update errors (Traefik port
 * binds, image builds, etc.) instead of claiming the environment is ready
 * while apps sit forever in pending/none.
 */
export declare function checkTiltResourceHealth(exec?: typeof execSync): CheckResult;
export declare function isInfraTiltFailure(name: string): boolean;
/** Critical infra first, then everything else — never drop failures. */
export declare function orderTiltFailures(failures: TiltResourceFailure[]): TiltResourceFailure[];
/**
 * Best-effort root cause for runtime crashes when buildHistory has no error.
 * Reads recent docker logs for the matching container name.
 */
export declare function probeContainerRuntimeError(resourceName: string, exec?: typeof execSync): string | null;
export declare function describeTiltFailure(failure: TiltResourceFailure, exec?: typeof execSync): string;
//# sourceMappingURL=doctor-runtime.d.ts.map