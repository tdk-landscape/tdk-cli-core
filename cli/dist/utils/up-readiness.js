import { execFile } from "node:child_process";
import { getDeferredResourceNames, parseTiltResourceFailures } from "./doctor-runtime.js";
import { findOnPath } from "./which.js";
function tiltGetUiResources(port) {
    return new Promise((resolve) => {
        execFile(findOnPath("tilt") ?? "tilt", ["get", "uiresources", "-o", "json", "--port", String(port)], { timeout: 15_000, maxBuffer: 16 * 1024 * 1024 }, (error, stdout) => resolve(error ? null : stdout));
    });
}
/**
 * Tilt lists resources outside the current focus (the other release phases, or everything but a `--only` selection) with
 * `disableStatus.state: Disabled` and both statuses `none`, which would read as pending forever. A resource whose update
 * status is `not_applicable` (a serve-only local resource) has nothing to build, so it counts as built.
 */
export function onlyEnabledResources(jsonText) {
    const parsed = JSON.parse(jsonText);
    const items = (parsed.items ?? [])
        .filter((item) => item.status?.disableStatus?.state !== "Disabled")
        .map((item) => item.status?.updateStatus === "not_applicable"
        ? { ...item, status: { ...item.status, updateStatus: "ok" } }
        : item);
    return JSON.stringify({ items });
}
/**
 * Services the caller asked for must not vanish into the disabled filter: one that Tilt lists as disabled (it can be
 * disabled while running) is a failure, and one Tilt does not list yet is still pending.
 */
export function checkExpectedResources(jsonText, expected) {
    const items = JSON.parse(jsonText).items ?? [];
    const byName = new Map(items.map((item) => [item.metadata?.name, item]));
    return {
        missing: expected.filter((name) => !byName.has(name)),
        disabled: expected.filter((name) => byName.get(name)?.status?.disableStatus?.state === "Disabled"),
    };
}
/**
 * Waits until every non-deferred Tilt resource is built and running. Resolves not-ready as soon as the rest has settled
 * with an errored resource, or at the deadline. Sablier-deferred resources are excluded: they stay idle by design.
 */
export async function waitForTiltResourcesReady(port, options = {}) {
    const timeoutMs = options.timeoutMs ?? Number(process.env.TDK_UP_READY_TIMEOUT_MS ?? 900_000);
    const intervalMs = options.intervalMs ?? 2_000;
    const fetchJson = options.fetchJson ?? tiltGetUiResources;
    const deferred = options.deferred ?? getDeferredResourceNames();
    const deadline = Date.now() + timeoutMs;
    let last = { ready: false, failures: [], pending: 0, timedOut: false };
    for (;;) {
        const text = await fetchJson(port);
        if (text) {
            try {
                const parsed = parseTiltResourceFailures(onlyEnabledResources(text), deferred);
                last = {
                    ready: parsed.failures.length === 0 && parsed.pendingCount === 0 && parsed.okCount > 0,
                    failures: parsed.failures.map((failure) => ({
                        name: failure.name,
                        message: failure.error || `${failure.updateStatus}/${failure.runtimeStatus}`,
                    })),
                    pending: parsed.pendingCount,
                    timedOut: false,
                };
                if (options.expected && options.expected.length > 0) {
                    const { missing, disabled } = checkExpectedResources(text, options.expected);
                    if (missing.length > 0) {
                        last = { ...last, ready: false, pending: last.pending + missing.length };
                    }
                    if (disabled.length > 0) {
                        return {
                            ready: false,
                            pending: last.pending,
                            timedOut: false,
                            failures: [
                                ...last.failures,
                                ...disabled.map((name) => ({ name, message: "disabled in Tilt" })),
                            ],
                        };
                    }
                }
                if (last.ready)
                    return last;
                if (last.failures.length > 0 && last.pending === 0)
                    return last;
            }
            catch {
                /* Tilt may emit partial output while starting; retry. */
            }
        }
        if (Date.now() >= deadline)
            return { ...last, ready: false, timedOut: true };
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
}
//# sourceMappingURL=up-readiness.js.map