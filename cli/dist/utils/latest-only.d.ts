/**
 * Applies only the result of the most recently started load. A slow earlier load that finishes after a newer one is
 * dropped, so a poll that outlasts its interval cannot put older data back on screen.
 */
export declare function latestOnly<T>(apply: (value: T) => void): (load: () => Promise<T>) => Promise<void>;
//# sourceMappingURL=latest-only.d.ts.map