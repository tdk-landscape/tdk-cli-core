export class Cache {
    data;
    options;
    constructor(options) {
        this.data = new Map();
        this.options = options;
    }
    has(key) {
        const entry = this.data.get(key);
        if (!entry)
            return false;
        const isExpired = Date.now() - entry.timestamp > this.options.ttlMs;
        if (isExpired) {
            this.data.delete(key);
            return false;
        }
        return true;
    }
    get(key) {
        if (!this.has(key)) {
            return undefined;
        }
        return this.data.get(key)?.value;
    }
    set(key, value) {
        this.data.set(key, {
            value,
            timestamp: Date.now(),
        });
    }
    delete(key) {
        this.data.delete(key);
    }
    clear() {
        this.data.clear();
    }
    keys() {
        const validKeys = [];
        for (const key of this.data.keys()) {
            if (this.has(key)) {
                validKeys.push(key);
            }
        }
        return validKeys;
    }
    size() {
        return this.keys().length;
    }
}
export function createCacheValidator(ttlMs) {
    let lastUpdated = 0;
    return {
        isValid() {
            return Date.now() - lastUpdated < ttlMs;
        },
        markUpdated() {
            lastUpdated = Date.now();
        },
        reset() {
            lastUpdated = 0;
        },
    };
}
//# sourceMappingURL=cache.js.map