import type { DiscoveredResource } from "../types/index.js";
export interface HealthTarget {
    name: string;
    appType: "frontend" | "backend";
    url: string;
}
export interface HealthProbe extends HealthTarget {
    ok: boolean;
    /** HTTP status code, or undefined when the request never completed. */
    status?: number;
    /** Failure reason when the request never completed (DNS, refused, timeout). */
    error?: string;
}
export declare function getProjectName(): string;
export declare function resolveSubdomainBases(): {
    appBase: string;
    apiBase: string;
};
export declare function appendHealthPath(path: string): string;
/** The route `tdk up` advertises for a service, without the /health suffix. */
export declare function resolveServicePath(resource: DiscoveredResource): string;
/**
 * Health URLs for every routable service, matching what `tdk up` prints.
 * Workers, libraries, SDKs and migrators have no Traefik route, so they are
 * skipped rather than reported as unreachable.
 */
export declare function buildHealthTargets(resources: DiscoveredResource[]): HealthTarget[];
export declare function pingHealthTarget(target: HealthTarget, timeoutMs: number): Promise<HealthProbe>;
export declare function pingHealthTargets(targets: HealthTarget[], timeoutMs: number): Promise<HealthProbe[]>;
//# sourceMappingURL=service-urls.d.ts.map