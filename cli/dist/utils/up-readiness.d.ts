export interface ReadinessResult {
    ready: boolean;
    failures: Array<{
        name: string;
        message: string;
    }>;
    pending: number;
    timedOut: boolean;
}
/**
 * Waits until every non-deferred Tilt resource is built and running. Resolves not-ready as soon as the rest has settled
 * with an errored resource, or at the deadline. Sablier-deferred resources are excluded: they stay idle by design.
 */
export declare function waitForTiltResourcesReady(port: number, options?: {
    timeoutMs?: number;
    intervalMs?: number;
    fetchJson?: (port: number) => Promise<string | null>;
    deferred?: Set<string>;
}): Promise<ReadinessResult>;
//# sourceMappingURL=up-readiness.d.ts.map