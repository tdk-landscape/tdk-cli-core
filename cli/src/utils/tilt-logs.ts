export interface LogLine {
  time: string | null;
  resource: string | null;
  level: string | null;
  source: string | null;
  text: string;
}

export const DEFAULT_LOG_TAIL = 200;

/** Go-style duration such as 30s, 5m, 1h or 1h30m, as accepted by `tilt logs --since`. */
export function isValidSince(value: string): boolean {
  return /^(\d+(\.\d+)?(ns|us|µs|ms|s|m|h))+$/.test(value);
}

export function isValidTail(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}

/** Parse `tilt logs --json` (JSON Lines) into normalized lines, keeping at most the last `limit`. Unparseable lines are skipped. */
export function parseTiltLogLines(output: string, limit: number): LogLine[] {
  const lines: LogLine[] = [];
  for (const raw of output.split("\n")) {
    if (!raw.trim()) continue;
    try {
      const entry = JSON.parse(raw) as Record<string, unknown>;
      const str = (value: unknown): string | null =>
        typeof value === "string" && value !== "" ? value : null;
      lines.push({
        time: str(entry.time),
        resource: str(entry.resource),
        level: str(entry.level),
        source: str(entry.source),
        text: typeof entry.message === "string" ? entry.message : "",
      });
    } catch {
      // Tilt can print a non-JSON notice before the stream; it is not a log line.
    }
  }
  return lines.slice(-limit);
}
