import { parseTiltResourceFailures, summarizeTiltBuildError } from "./doctor-runtime.js";
import { isTiltResourcePending } from "./tilt-resource-state.js";
import { onlyEnabledResources } from "./up-readiness.js";
export function transitiveDependencies(name, dependsOn) {
    const seen = new Set();
    const visit = (current) => {
        for (const dep of dependsOn[current] ?? []) {
            if (seen.has(dep))
                continue;
            seen.add(dep);
            visit(dep);
        }
    };
    visit(name);
    return seen;
}
function isPending(item) {
    return isTiltResourcePending(item.status?.updateStatus ?? "", item.status?.runtimeStatus ?? "");
}
export function buildStartupReport(jsonText, dependsOn, deferred = new Set()) {
    const enabledJson = onlyEnabledResources(jsonText);
    const failures = parseTiltResourceFailures(enabledJson, deferred).failures;
    const failed = failures.map((failure) => ({
        name: failure.name,
        message: failure.error
            ? summarizeTiltBuildError(failure.error)
            : `${failure.updateStatus}/${failure.runtimeStatus}`,
    }));
    const failedNames = new Set(failed.map((entry) => entry.name));
    const items = JSON.parse(enabledJson).items ?? [];
    const blocked = [];
    const starting = [];
    for (const item of items) {
        const name = item.metadata?.name ?? "unknown";
        if (name === "(Tiltfile)" || failedNames.has(name) || deferred.has(name) || !isPending(item)) {
            continue;
        }
        const because = [...transitiveDependencies(name, dependsOn)]
            .filter((dep) => failedNames.has(dep))
            .sort();
        if (because.length > 0)
            blocked.push({ name, because });
        else
            starting.push(name);
    }
    return { failed, blocked, starting };
}
/** A failure exists and everything still pending is blocked by it, so waiting longer cannot help. */
export function isStartupStalled(jsonText, dependsOn, deferred = new Set()) {
    const report = buildStartupReport(jsonText, dependsOn, deferred);
    return report.failed.length > 0 && report.starting.length === 0;
}
export function formatStartupReport(report, timedOut) {
    const lines = [];
    for (const { name, message } of report.failed)
        lines.push(`✗ ${name} failed: ${message}`);
    for (const { name, because } of report.blocked) {
        lines.push(`✗ ${name} is not ready because ${because.join(", ")} failed`);
    }
    if (report.starting.length > 0) {
        lines.push(`${timedOut ? "Timed out waiting for" : "Still starting:"} ${report.starting.join(", ")}`);
    }
    if (lines.length > 0) {
        lines.push("The environment is not ready. Tilt is still running; inspect it or run: tdk down");
    }
    return lines;
}
//# sourceMappingURL=startup-report.js.map