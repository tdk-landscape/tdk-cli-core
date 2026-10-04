export const DEFAULT_LOG_TAIL = 200;
const NANOSECONDS = {
    ns: 1,
    us: 1e3,
    µs: 1e3,
    ms: 1e6,
    s: 1e9,
    m: 6e10,
    h: 3.6e12,
};
// Go's time.Duration is an int64 of nanoseconds, so anything beyond this is rejected by `tilt logs`.
const MAX_DURATION_NANOSECONDS = 2 ** 63 - 1;
/** Go-style duration such as 30s, 5m, 1h or 1h30m, within the range Go's ParseDuration accepts. */
export function isValidSince(value) {
    if (!/^(\d+(\.\d+)?(ns|us|µs|ms|s|m|h))+$/.test(value))
        return false;
    let total = 0;
    for (const [, amount, unit] of value.matchAll(/(\d+(?:\.\d+)?)(ns|us|µs|ms|s|m|h)/g)) {
        total += Number(amount) * (NANOSECONDS[unit] ?? 0);
    }
    return total <= MAX_DURATION_NANOSECONDS;
}
export function isValidPort(value) {
    return /^[1-9]\d{0,4}$/.test(value) && Number(value) <= 65535;
}
export function isValidTail(value) {
    return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}
/** Parse `tilt logs --json` (JSON Lines) into normalized lines, keeping at most the last `limit`. Unparseable lines are skipped. */
export function parseTiltLogLines(output, limit) {
    const lines = [];
    for (const raw of output.split("\n")) {
        if (!raw.trim())
            continue;
        try {
            const entry = JSON.parse(raw);
            const str = (value) => typeof value === "string" && value !== "" ? value : null;
            lines.push({
                time: str(entry.time),
                resource: str(entry.resource),
                level: str(entry.level),
                source: str(entry.source),
                text: typeof entry.message === "string" ? entry.message : "",
            });
        }
        catch {
            // Tilt can print a non-JSON notice before the stream; it is not a log line.
        }
    }
    return lines.slice(-limit);
}
//# sourceMappingURL=tilt-logs.js.map