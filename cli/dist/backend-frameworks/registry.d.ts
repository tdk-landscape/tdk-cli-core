import type { BackendFrameworkProvider } from "./types.js";
/** Hono is the historical default; omitting --framework keeps the exact historical output. */
export declare const DEFAULT_BACKEND_FRAMEWORK = "hono";
export declare const honoBackendProvider: BackendFrameworkProvider;
export declare const BACKEND_FRAMEWORKS: Record<string, BackendFrameworkProvider>;
export declare function getBackendFramework(frameworkId?: string): BackendFrameworkProvider;
/**
 * Returns the provider for an explicit `--framework` on a backend, or undefined when none was given
 * (the historical Hono scaffold). Python owns its runtime, so a framework cannot be combined with it.
 */
export declare function resolveBackendFramework(resourceType: string, frameworkId?: string, language?: {
    id: string;
    createFiles?: unknown;
}): BackendFrameworkProvider | undefined;
//# sourceMappingURL=registry.d.ts.map