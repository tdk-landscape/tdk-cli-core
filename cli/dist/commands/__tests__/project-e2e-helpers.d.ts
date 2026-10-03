export declare const repoRoot: string;
export declare const cliBin: string;
export declare function runTdk(args: string[], cwd: string, input?: string): string;
/** `tdk doctor` exits non-zero on machines without Docker, so read its output either way. */
export declare function runTdkAllowFailure(args: string[], cwd: string): string;
export declare function starlarkSection(content: string, name: string): string;
//# sourceMappingURL=project-e2e-helpers.d.ts.map