export declare function getErrorMessage(err: unknown): string;
export declare function logVerbose(message: string, err?: unknown): void;
declare class TdkError extends Error {
    suggestions: string[];
    exitCode: number;
    constructor(message: string, suggestions?: string[], exitCode?: number);
    display(): void;
    /** Display this error and exit the process with its exit code. */
    exit(): never;
}
export declare const errorFactories: {
    tiltNotInstalled: () => TdkError;
    dockerNotAvailable: () => TdkError;
    dockerNotResponding: () => TdkError;
    stackNotFound: (name: string) => TdkError;
    resourceNotFound: (name: string) => TdkError;
    directoryExists: (path: string) => TdkError;
    invalidPath: (path: string) => TdkError;
    notInProject: () => TdkError;
};
export declare function requireProjectRoot(): string;
export declare function runCommand<T>(action: () => Promise<T>, options?: {
    verbose?: boolean;
}): Promise<T | never>;
export declare function withTiltCheck<T>(action: () => Promise<T>, options?: {
    verbose?: boolean;
}): Promise<T | never>;
export declare function showErrorAndExit(message: string, exitCode?: number): never;
export declare function handleTiltFailure(command: "up" | "down", exitCode: number): never;
export {};
//# sourceMappingURL=errors.d.ts.map