/**
 * Project-Level Features
 *
 * These are infrastructure and optional services enabled at the project level.
 * They are available to all resources and are configured in project.json stacks.
 *
 * Default: All CORE features enabled in pre_alpha stack
 * Optional/premium: disabled by default (can be enabled in optional_infra)
 */
export interface ProjectFeature {
    name: string;
    description: string;
    category: "core" | "optional" | "premium";
    phase: "pre_alpha" | "alpha" | "beta";
    enabled_by_default: boolean;
    dependsOn?: string[];
}
export declare const PROJECT_FEATURES: Record<string, ProjectFeature>;
/**
 * Get all enabled project features
 */
export declare function getEnabledProjectFeatures(optional_infra?: Record<string, boolean>): string[];
//# sourceMappingURL=project-features.d.ts.map