export interface LogLine {
    time: string | null;
    resource: string | null;
    level: string | null;
    source: string | null;
    text: string;
}
export declare const DEFAULT_LOG_TAIL = 200;
/** Go-style duration such as 30s, 5m, 1h or 1h30m, as accepted by `tilt logs --since`. */
export declare function isValidSince(value: string): boolean;
export declare function isValidTail(value: string): boolean;
/** Parse `tilt logs --json` (JSON Lines) into normalized lines, keeping at most the last `limit`. Unparseable lines are skipped. */
export declare function parseTiltLogLines(output: string, limit: number): LogLine[];
//# sourceMappingURL=tilt-logs.d.ts.map