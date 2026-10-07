import { relative } from "node:path";
import chalk from "chalk";
import { checkDuplicateResourceNames } from "./doctor-wiring.js";
import { formatCount } from "./formatting.js";
import { findProjectRoot } from "./paths.js";
import { discoverResourcesFromRoot } from "./services.js";
function filePath(projectRoot, resource) {
    return relative(projectRoot, resource.configPath) || resource.configPath;
}
/** Each cycle once, as service names starting from the alphabetically first, ending where it started. */
function findDependencyCycles(resources) {
    const known = new Set(resources.map((r) => r.name));
    const edges = new Map(resources.map((r) => [r.name, (r.config?.dependsOn ?? []).filter((dep) => known.has(dep))]));
    const cycles = new Map();
    const state = new Map();
    const stack = [];
    const visit = (name) => {
        state.set(name, "visiting");
        stack.push(name);
        for (const dep of edges.get(name) ?? []) {
            if (state.get(dep) === "visiting") {
                const loop = stack.slice(stack.indexOf(dep));
                const start = loop.indexOf([...loop].sort()[0] ?? dep);
                const ordered = [...loop.slice(start), ...loop.slice(0, start)];
                cycles.set(ordered.join(">"), [...ordered, ordered[0] ?? dep]);
            }
            else if (!state.has(dep)) {
                visit(dep);
            }
        }
        stack.pop();
        state.set(name, "done");
    };
    for (const name of [...edges.keys()].sort()) {
        if (!state.has(name))
            visit(name);
    }
    return [...cycles.values()];
}
/** Services that wait on each other can never both start. A dependsOn name that is not a service is left to the unknown-name check. */
export function checkCircularDependencies(projectRoot = findProjectRoot() ?? process.cwd()) {
    const resources = discoverResourcesFromRoot(projectRoot);
    const byName = new Map(resources.map((r) => [r.name, r]));
    const cycles = findDependencyCycles(resources);
    if (cycles.length === 0) {
        return {
            name: "Circular dependencies",
            didPass: true,
            message: "No service depends on itself through dependsOn",
        };
    }
    const lines = cycles.map((cycle) => {
        const first = byName.get(cycle[0] ?? "");
        const next = cycle[1] ?? "";
        return `${first ? filePath(projectRoot, first) : cycle[0]} dependsOn "${next}": circular dependency ${cycle.join(" -> ")}`;
    });
    return {
        name: "Circular dependencies",
        didPass: false,
        message: `${cycles.length} ${cycles.length === 1 ? "circular dependency" : "circular dependencies"}:\n    ${lines.join("\n    ")}`,
        fix: 'Remove one "dependsOn" entry in each cycle so the services no longer wait on each other, or move what they share into a third service',
    };
}
/** A port outside 1-65535 can never be bound, and `tdk up` would otherwise find out only when Docker fails. */
export function checkServicePorts(projectRoot = findProjectRoot() ?? process.cwd()) {
    const problems = discoverResourcesFromRoot(projectRoot).flatMap((resource) => {
        const port = resource.config?.port;
        if (port === undefined)
            return [];
        if (typeof port === "number" && Number.isInteger(port) && port >= 1 && port <= 65535)
            return [];
        return [
            `${filePath(projectRoot, resource)} port ${JSON.stringify(port)}: not an integer from 1 to 65535`,
        ];
    });
    if (problems.length === 0) {
        return { name: "Service ports", didPass: true, message: "Every declared port is valid" };
    }
    return {
        name: "Service ports",
        didPass: false,
        message: `${formatCount(problems.length, "invalid port")}:\n    ${problems.join("\n    ")}`,
        fix: 'Set "port" to the port the service listens on, an integer from 1 to 65535',
    };
}
/**
 * Runs before anything starts (also under --dry-run, like the drift gate): duplicate service names, circular
 * dependsOn and invalid ports exit with 1 and say which file, which field, and how to fix it.
 */
export function enforceServiceConfigGate(projectRoot, options = {}, exit = process.exit) {
    const failed = [
        checkDuplicateResourceNames(projectRoot),
        checkCircularDependencies(projectRoot),
        checkServicePorts(projectRoot),
    ].filter((check) => !check.didPass);
    if (failed.length === 0)
        return;
    const text = failed
        .map((check) => `${check.message}${check.fix ? `\nFix: ${check.fix}` : ""}`)
        .join("\n");
    options.onInvalid?.(text);
    for (const check of failed) {
        console.error(chalk.red(`✗ ${check.message}`));
        if (check.fix)
            console.error(chalk.gray(`  Fix: ${check.fix}`));
    }
    exit(1);
}
//# sourceMappingURL=service-config-checks.js.map