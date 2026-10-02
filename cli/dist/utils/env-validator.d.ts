export interface EnvVariable {
    name: string;
    description: string;
    required: boolean;
    default?: string;
    example?: string;
    /** Written by `completeEnvFile` when a project's .env lacks it (a generated value, or the default). */
    complete?: boolean;
}
/** Parses the assignments in a dotenv file: `NAME=value` and `export NAME=value`, ignoring comments and blank lines. */
export declare function parseEnv(content: string): Map<string, string>;
export declare function generateEnvFile(): string;
export declare function validateEnvFile(projectRoot: string): {
    missing: string[];
    invalid: string[];
    warnings: string[];
};
/**
 * Appends the keys a newer CLI expects to an existing .env, without touching or rotating anything already there (an existing
 * DB_PASSWORD must survive, or the database volume stops accepting it). Creates the file when it is missing.
 *
 * @returns the names that were added, empty when the file was already complete
 */
export declare function completeEnvFile(projectRoot: string): string[];
export declare function ensureEnvFile(projectRoot: string): boolean;
//# sourceMappingURL=env-validator.d.ts.map