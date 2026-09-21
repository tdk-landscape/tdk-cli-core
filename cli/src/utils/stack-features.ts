export interface StackFeature {
  name: string;
  description: string;
  generatedFiles: string[];
}

export const STACK_FEATURES: Record<string, StackFeature> = {
  "database-management": {
    name: "database-management",
    description: "Generate and load the stack-level PostgreSQL docker-compose file",
    generatedFiles: ["services/platform/database-management/docker-compose.yml"],
  },
};

export interface StackFeaturePhaseConfig {
  pre_alpha?: { services?: string[] };
  alpha?: { services?: string[] };
  beta?: { services?: string[] };
  out_of_scope?: { services?: string[] };
}

export function isStackFeatureEnabledInStacks(
  stacks: StackFeaturePhaseConfig,
  featureName: string,
): boolean {
  if (!STACK_FEATURES[featureName]) return false;
  return ["pre_alpha", "alpha", "beta"].some((phase) =>
    stacks[phase as keyof StackFeaturePhaseConfig]?.services?.includes(featureName),
  );
}
