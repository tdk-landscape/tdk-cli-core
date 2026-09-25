export interface StackFeature {
    name: string;
    description: string;
    generatedFiles: string[];
}
export declare const STACK_FEATURES: Record<string, StackFeature>;
export interface StackFeaturePhaseConfig {
    pre_alpha?: {
        enabledStacks?: string[];
    };
    alpha?: {
        enabledStacks?: string[];
    };
    beta?: {
        enabledStacks?: string[];
    };
    out_of_scope?: {
        enabledStacks?: string[];
    };
}
export declare function isStackFeatureEnabledInStacks(stacks: StackFeaturePhaseConfig, featureName: string): boolean;
//# sourceMappingURL=stack-features.d.ts.map