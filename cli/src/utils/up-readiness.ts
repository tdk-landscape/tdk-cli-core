import { execFile } from "node:child_process";
import { getDeferredResourceNames, parseTiltResourceFailures } from "./doctor-runtime.js";
import { findOnPath } from "./which.js";

export interface ReadinessResult {
  ready: boolean;
  failures: Array<{ name: string; message: string }>;
  pending: number;
  timedOut: boolean;
}

function tiltGetUiResources(port: number): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(
      findOnPath("tilt") ?? "tilt",
      ["get", "uiresources", "-o", "json", "--port", String(port)],
      { timeout: 15_000, maxBuffer: 16 * 1024 * 1024 },
      (error, stdout) => resolve(error ? null : stdout),
    );
  });
}

/**
 * Waits until every non-deferred Tilt resource is built and running. Resolves not-ready as soon as the rest has settled
 * with an errored resource, or at the deadline. Sablier-deferred resources are excluded: they stay idle by design.
 */
export async function waitForTiltResourcesReady(
  port: number,
  options: {
    timeoutMs?: number;
    intervalMs?: number;
    fetchJson?: (port: number) => Promise<string | null>;
    deferred?: Set<string>;
  } = {},
): Promise<ReadinessResult> {
  const timeoutMs = options.timeoutMs ?? Number(process.env.TDK_UP_READY_TIMEOUT_MS ?? 900_000);
  const intervalMs = options.intervalMs ?? 2_000;
  const fetchJson = options.fetchJson ?? tiltGetUiResources;
  const deferred = options.deferred ?? getDeferredResourceNames();
  const deadline = Date.now() + timeoutMs;
  let last: ReadinessResult = { ready: false, failures: [], pending: 0, timedOut: false };
  for (;;) {
    const text = await fetchJson(port);
    if (text) {
      try {
        const parsed = parseTiltResourceFailures(text, deferred);
        last = {
          ready: parsed.failures.length === 0 && parsed.pendingCount === 0 && parsed.okCount > 0,
          failures: parsed.failures.map((failure) => ({
            name: failure.name,
            message: failure.error || `${failure.updateStatus}/${failure.runtimeStatus}`,
          })),
          pending: parsed.pendingCount,
          timedOut: false,
        };
        if (last.ready) return last;
        if (last.failures.length > 0 && last.pending === 0) return last;
      } catch {
        /* Tilt may emit partial output while starting; retry. */
      }
    }
    if (Date.now() >= deadline) return { ...last, ready: false, timedOut: true };
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
