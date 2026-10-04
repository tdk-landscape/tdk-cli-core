export const DEFAULT_LOG_TAIL = 200;
/** Go-style duration such as 30s, 5m, 1h or 1h30m, as accepted by `tilt logs --since`. */
export function isValidSince(value) {
    return /^(\d+(\.\d+)?(ns|us|µs|ms|s|m|h))+$/.test(value);
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