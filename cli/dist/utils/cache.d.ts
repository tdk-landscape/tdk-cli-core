import type { CacheOptions } from "../types/index.js";
export declare class Cache<T> {
    private data;
    private options;
    constructor(options: CacheOptions);
    has(key: string): boolean;
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    delete(key: string): void;
    clear(): void;
    keys(): string[];
    size(): number;
}
export declare function createCacheValidator(ttlMs: number): {
    isValid(): boolean;
    markUpdated(): void;
    reset(): void;
};
//# sourceMappingURL=cache.d.ts.map