export const STACK_FEATURES = {
    "database-management": {
        name: "database-management",
        description: "Generate and load the stack-level PostgreSQL docker-compose file",
        generatedFiles: ["services/platform/database-management/docker-compose.yml"],
    },
};
export function isStackFeatureEnabledInStacks(stacks, featureName) {
    if (!STACK_FEATURES[featureName])
        return false;
    return ["pre_alpha", "alpha", "beta"].some((phase) => stacks[phase]?.enabledStacks?.includes(featureName));
}
//# sourceMappingURL=stack-features.js.map