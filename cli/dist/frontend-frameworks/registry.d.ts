import type { FrontendFrameworkProvider } from "./types.js";
export declare const DEFAULT_FRONTEND_FRAMEWORK = "react";
export declare const FRONTEND_FRAMEWORKS: Record<string, FrontendFrameworkProvider>;
export declare function getFrontendFramework(frameworkId?: string): FrontendFrameworkProvider;
export declare function resolveFrontendFramework(resourceType: string, frameworkId?: string): FrontendFrameworkProvider | undefined;
//# sourceMappingURL=registry.d.ts.map