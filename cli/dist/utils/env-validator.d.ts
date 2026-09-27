export interface EnvVariable {
    name: string;
    description: string;
    required: boolean;
    default?: string;
    example?: string;
}
export declare function generateEnvFile(projectRoot: string): string;
export declare function validateEnvFile(projectRoot: string): {
    missing: string[];
    invalid: string[];
    warnings: string[];
};
export declare function ensureEnvFile(projectRoot: string): boolean;
//# sourceMappingURL=env-validator.d.ts.map