/** Runs a shell command without blocking the event loop; resolves with trimmed-free stdout. */
export type ExecAsync = (command: string, timeoutMs: number) => Promise<string>;
export declare const execAsync: ExecAsync;
/** `exec` kills a timed-out child and sets `killed`; `execSync` reports ETIMEDOUT. */
export declare function isExecTimeout(err: unknown): boolean;
//# sourceMappingURL=exec-async.d.ts.map