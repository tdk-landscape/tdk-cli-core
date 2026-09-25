import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { MASTER_CONFIG_FILES, QUICKSTART_DOCS_URL, REQUIRED_PACKAGE_SCRIPTS, } from "../utils/constants.js";
import { checkIngressPorts, checkPrivateNpmRegistry, checkTiltResourceHealth, } from "../utils/doctor-runtime.js";
import { validateEnvFile } from "../utils/env-validator.js";
import { formatCount } from "../utils/formatting.js";
import { findProjectRoot } from "../utils/paths.js";
import { buildHealthTargets, pingHealthTargets } from "../utils/service-urls.js";
import { discoverResourcesFromRoot } from "../utils/services.js";
export { checkIngressPorts, checkPrivateNpmRegistry, checkTiltResourceHealth, summarizeTiltBuildError, } from "../utils/doctor-runtime.js";
// A wedged Docker daemon makes `docker ps` block forever instead of failing,
// and doctor is exactly the tool people run when their environment is broken.
const EXEC_TIMEOUT_MS = 10_000;
function isTimeout(err) {
    return err?.code === "ETIMEDOUT";
}
function createExecCheck(name, command, successMessage, failureMessage, fixInstructions) {
    return () => {
        try {
            execSync(command, { stdio: "pipe", timeout: EXEC_TIMEOUT_MS });
            return {
                name,
                didPass: true,
                message: successMessage,
            };
        }
        catch {
            // Error details not needed - failure message tells user what to fix
            return {
                name,
                didPass: false,
                message: failureMessage,
                fix: fixInstructions,
            };
        }
    };
}
function checkDockerRuntime() {
    // Check for Docker
    try {
        execSync("docker ps", { stdio: "pipe", timeout: EXEC_TIMEOUT_MS });
        return {
            name: "Container Runtime",
            didPass: true,
            message: "Docker daemon is running",
        };
    }
    catch (err) {
        if (isTimeout(err)) {
            return {
                name: "Container Runtime",
                didPass: false,
                message: `Docker daemon is not responding (\`docker ps\` hung for ${EXEC_TIMEOUT_MS / 1000}s)`,
                fix: "Restart the runtime: quit and reopen Docker Desktop, or run `colima restart`",
            };
        }
        // Docker not running, check for Colima
        try {
            execSync("colima status", { stdio: "pipe", timeout: EXEC_TIMEOUT_MS });
            // Colima is running
            return {
                name: "Container Runtime",
                didPass: true,
                message: "Colima (Docker runtime) is running",
            };
        }
        catch {
            // Check if Colima is installed but not running
            try {
                execSync("which colima", { stdio: "pipe", timeout: EXEC_TIMEOUT_MS });
                return {
                    name: "Container Runtime",
                    didPass: false,
                    message: "Colima is installed but not running",
                    fix: "Start Colima: colima start",
                };
            }
            catch {
                // Check for Podman
                try {
                    execSync("podman ps", { stdio: "pipe", timeout: EXEC_TIMEOUT_MS });
                    return {
                        name: "Container Runtime",
                        didPass: true,
                        message: "Podman is running",
                    };
                }
                catch {
                    // No container runtime found
                    return {
                        name: "Container Runtime",
                        didPass: false,
                        message: "No container runtime (Docker/Colima/Podman) is running",
                        fix: `Start: colima start (recommended) OR open -a Docker (macOS) OR sudo systemctl start docker (Linux). Setup guide: ${QUICKSTART_DOCS_URL}`,
                    };
                }
            }
        }
    }
}
const checkDockerCompose = createExecCheck("Docker Compose", "docker compose version", "Docker Compose plugin available", "Docker Compose plugin not found", "Install Docker Compose: https://docs.docker.com/compose/install/");
// Generated healthchecks use `start_interval`, which older engines/compose reject.
const MIN_DOCKER_ENGINE_VERSION = [25, 0, 0];
const MIN_DOCKER_COMPOSE_VERSION = [2, 20, 2];
function parseVersion(raw) {
    const match = raw.trim().match(/(\d+)\.(\d+)(?:\.(\d+))?/);
    if (!match) {
        return null;
    }
    return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
}
function isAtLeast(version, minimum) {
    for (const [index, required] of minimum.entries()) {
        const actual = version[index] ?? 0;
        if (actual !== required) {
            return actual > required;
        }
    }
    return true;
}
export function checkDockerVersions(exec = execSync) {
    const run = (command) => String(exec(command, { stdio: "pipe", encoding: "utf-8", timeout: EXEC_TIMEOUT_MS })).trim();
    let engineRaw;
    let composeRaw;
    try {
        engineRaw = run("docker version --format '{{.Server.Version}}'");
        composeRaw = run("docker compose version --short");
    }
    catch {
        return {
            name: "Docker Versions",
            didPass: true,
            isSkipped: true,
            message: "Could not read Docker Engine/Compose versions - skipped version check",
        };
    }
    const engine = parseVersion(engineRaw);
    const compose = parseVersion(composeRaw);
    if (!engine || !compose) {
        return {
            name: "Docker Versions",
            didPass: true,
            isSkipped: true,
            message: `Unrecognized Docker version output (engine "${engineRaw}", compose "${composeRaw}") - skipped version check`,
        };
    }
    const problems = [];
    if (!isAtLeast(engine, MIN_DOCKER_ENGINE_VERSION)) {
        problems.push(`Docker Engine ${engineRaw} (need 25.0+)`);
    }
    if (!isAtLeast(compose, MIN_DOCKER_COMPOSE_VERSION)) {
        problems.push(`Docker Compose ${composeRaw} (need 2.20.2+)`);
    }
    if (problems.length === 0) {
        return {
            name: "Docker Versions",
            didPass: true,
            message: `Docker Engine ${engineRaw} and Compose ${composeRaw} support generated healthchecks`,
        };
    }
    return {
        name: "Docker Versions",
        didPass: false,
        message: `Docker is too old for generated healthchecks (they use start_interval):\n    ${problems.join("\n    ")}`,
        fix: "Update Docker Desktop, or on Linux update docker-ce and the docker-compose-plugin package",
    };
}
const checkTilt = createExecCheck("Tilt CLI", "tilt version", "Tilt CLI installed", "Tilt CLI not found", `Install Tilt: brew install tilt (macOS) or see https://docs.tilt.dev/install.html. Setup guide: ${QUICKSTART_DOCS_URL}`);
function checkEnvironmentVariables() {
    const projectRoot = findProjectRoot() ?? process.cwd();
    const validation = validateEnvFile(projectRoot);
    if (validation.missing.length > 0) {
        return {
            name: "Environment Variables",
            didPass: false,
            message: `Missing required env variables: ${validation.missing.join(", ")}`,
            fix: `Edit .env and set these values:\n    ${validation.missing.map((v) => `${v}=<value>`).join("\n    ")}`,
        };
    }
    if (validation.invalid.length > 0) {
        return {
            name: "Environment Variables",
            didPass: false,
            message: `Invalid env variables: ${validation.invalid.join(", ")}`,
            fix: "Edit .env and provide values for empty variables",
        };
    }
    return {
        name: "Environment Variables",
        didPass: true,
        message: "All required environment variables are set",
    };
}
function checkMasterConfigs() {
    // `tdk project` writes generated master configs to .tdk/.tdk-out/, not the
    // project root, so look there (and walk up to find the project root, same
    // as every other command that reads project state).
    const projectRoot = findProjectRoot() ?? process.cwd();
    const outDir = join(projectRoot, ".tdk", ".tdk-out");
    const missing = MASTER_CONFIG_FILES.filter((file) => !existsSync(join(outDir, file)));
    if (missing.length === 0) {
        return {
            name: "Master Configs",
            didPass: true,
            message: `${MASTER_CONFIG_FILES.join(", ")} found`,
        };
    }
    return {
        name: "Master Configs",
        didPass: false,
        message: `Master configs missing: ${missing.join(", ")}`,
        fix: "Run: tdk project",
    };
}
const REQUIRED_DOCKER_TEMPLATE_FILES = [
    "install-deps.sh",
    "bun-hoisted-symlink-fix.sh",
    "prisma-bun-client-link-fix.sh",
    "prisma-normalize-client.sh",
    "prisma-runtime-relink.sh",
    "infisical-entrypoint.sh",
    "migrate.sh",
];
export function checkGeneratedProjectRuntimeAssets() {
    const projectRoot = findProjectRoot() ?? process.cwd();
    const problems = [];
    if (!existsSync(join(projectRoot, "package.json"))) {
        problems.push("package.json (workspace root manifest)");
    }
    const templateDir = join(projectRoot, "shared-platform-engineering", "docker-templates");
    for (const file of REQUIRED_DOCKER_TEMPLATE_FILES) {
        if (!existsSync(join(templateDir, file))) {
            problems.push(`shared-platform-engineering/docker-templates/${file}`);
        }
    }
    if (problems.length === 0) {
        return {
            name: "Generated Runtime Assets",
            didPass: true,
            message: "Generated Docker runtime assets are present",
        };
    }
    return {
        name: "Generated Runtime Assets",
        didPass: false,
        message: `Generated Dockerfiles reference missing project runtime assets:\n    ${problems.join("\n    ")}`,
        fix: "Run `tdk project --yes` (or `tdk config regenerate`) with an updated TDK. `tdk up` also refreshes these assets before starting Tilt.",
    };
}
function findPrivateStarlarkLoadExports(content) {
    const privateExports = new Set();
    const loadCallPattern = /^load\s*\(([\s\S]*?)\)/gm;
    for (const loadMatch of content.matchAll(loadCallPattern)) {
        const args = loadMatch[1] ?? "";
        const quotedValuePattern = /["']([^"']+)["']/g;
        const quotedValues = Array.from(args.matchAll(quotedValuePattern), (match) => match[1]);
        // First quoted arg is the module path. Later quoted args are exported names
        // or alias targets, and Starlark refuses to export names beginning with "_".
        for (const value of quotedValues.slice(1)) {
            if (value.startsWith("_")) {
                privateExports.add(value);
            }
        }
    }
    return Array.from(privateExports).sort();
}
function resolveStarlarkLoadTarget(file, modulePath, projectRoot) {
    if (modulePath === "ext://tdk-cli") {
        return join(projectRoot, ".tdk", ".tdk-out", "tdk-cli-ext", "Tiltfile");
    }
    if (modulePath.startsWith(".") || (!modulePath.includes("://") && !modulePath.startsWith("@"))) {
        return normalize(join(dirname(file), modulePath));
    }
    return null;
}
function findMissingRelativeStarlarkLoads(file, content, projectRoot) {
    const missing = [];
    const loadCallPattern = /^load\s*\(([\s\S]*?)\)/gm;
    for (const loadMatch of content.matchAll(loadCallPattern)) {
        const args = loadMatch[1] ?? "";
        const moduleMatch = args.match(/["']([^"']+)["']/);
        const modulePath = moduleMatch?.[1];
        if (!modulePath) {
            continue;
        }
        const resolved = resolveStarlarkLoadTarget(file, modulePath, projectRoot);
        if (!resolved) {
            continue;
        }
        if (!existsSync(resolved)) {
            missing.push(`${file}: ${modulePath} -> ${resolved}`);
        }
    }
    return missing;
}
function findRelativeStarlarkLoadTargets(file, content, projectRoot) {
    const targets = [];
    const loadCallPattern = /^load\s*\(([\s\S]*?)\)/gm;
    for (const loadMatch of content.matchAll(loadCallPattern)) {
        const args = loadMatch[1] ?? "";
        const moduleMatch = args.match(/["']([^"']+)["']/);
        const modulePath = moduleMatch?.[1];
        if (modulePath) {
            const target = resolveStarlarkLoadTarget(file, modulePath, projectRoot);
            if (target) {
                targets.push(target);
            }
        }
    }
    return targets;
}
function collectReachableStarlarkFiles(entryFile, projectRoot) {
    const visited = new Set();
    const pending = [entryFile];
    while (pending.length > 0) {
        const file = pending.pop();
        if (!file || visited.has(file) || !existsSync(file)) {
            continue;
        }
        visited.add(file);
        const content = readFileSync(file, "utf-8");
        for (const target of findRelativeStarlarkLoadTargets(file, content, projectRoot)) {
            if (!visited.has(target)) {
                pending.push(target);
            }
        }
    }
    return Array.from(visited).sort();
}
export function checkStarlarkLoadExports() {
    const projectRoot = findProjectRoot() ?? process.cwd();
    const entryFile = join(projectRoot, ".tdk", ".tdk-out", "Tiltfile");
    if (!existsSync(entryFile)) {
        return {
            name: "Starlark Load Exports",
            didPass: true,
            isSkipped: true,
            message: "No generated Tiltfile to check",
        };
    }
    const privateExportProblems = [];
    const missingLoadProblems = [];
    const reachableFiles = collectReachableStarlarkFiles(entryFile, projectRoot);
    for (const file of reachableFiles) {
        const content = readFileSync(file, "utf-8");
        const privateExports = findPrivateStarlarkLoadExports(content);
        if (privateExports.length > 0) {
            privateExportProblems.push(`${file}: ${privateExports.join(", ")}`);
        }
        for (const missingLoad of findMissingRelativeStarlarkLoads(file, content, projectRoot)) {
            missingLoadProblems.push(missingLoad);
        }
    }
    if (privateExportProblems.length === 0 && missingLoadProblems.length === 0) {
        const fileCount = formatCount(reachableFiles.length, "reachable Starlark file");
        return {
            name: "Starlark Load Exports",
            didPass: true,
            message: `${fileCount} ${reachableFiles.length === 1 ? "has" : "have"} valid load exports and paths`,
        };
    }
    const sections = [];
    if (privateExportProblems.length > 0) {
        sections.push(`Private exported symbols:\n    ${privateExportProblems.join("\n    ")}`);
    }
    if (missingLoadProblems.length > 0) {
        sections.push(`Missing relative load targets:\n    ${missingLoadProblems.join("\n    ")}`);
    }
    return {
        name: "Starlark Load Exports",
        didPass: false,
        message: `Starlark load() issues will stop Tilt before services start:\n    ${sections.join("\n\n    ")}`,
        fix: "Regenerate with a current TDK (`tdk config regenerate`). If the issue remains, rename loaded symbols without leading underscores and update stale load paths.",
    };
}
function checkStartupScripts() {
    const projectRoot = findProjectRoot() ?? process.cwd();
    const resources = discoverResourcesFromRoot(projectRoot);
    const problems = [];
    for (const resource of resources) {
        const packageJsonPath = join(resource.path, "package.json");
        if (!existsSync(packageJsonPath)) {
            continue;
        }
        const appType = resource.config?.appType ?? "backend";
        const requiredScripts = REQUIRED_PACKAGE_SCRIPTS[appType] ?? REQUIRED_PACKAGE_SCRIPTS.backend;
        let scripts;
        try {
            scripts = JSON.parse(readFileSync(packageJsonPath, "utf-8")).scripts ?? {};
        }
        catch {
            problems.push(`${resource.name} (package.json is invalid JSON)`);
            continue;
        }
        const missing = requiredScripts.filter((script) => !scripts[script]);
        if (missing.length > 0) {
            problems.push(`${resource.name}: missing "${missing.join('", "')}"`);
        }
    }
    if (problems.length === 0) {
        return {
            name: "Startup Scripts",
            didPass: true,
            message: "All services have required package.json scripts",
        };
    }
    return {
        name: "Startup Scripts",
        didPass: false,
        message: `Services missing required package.json scripts:\n    ${problems.join("\n    ")}`,
        fix: 'Add the missing scripts to each service\'s package.json, e.g.:\n    "dev": "bun run src/index.ts",\n    "build": "tsc",\n    "start": "bun run dist/index.js"',
    };
}
/**
 * Backend/frontend tsconfig generators set `"types": ["bun"]` on the
 * assumption that `@types/bun` is a direct devDependency (`tdk resource`
 * adds it for new services). Nothing re-adds it if a service's package.json
 * loses that entry -- e.g. a checkout missing it entirely, or a manual edit
 * -- and the failure only surfaces later as `tsc: TS2688: Cannot find type
 * definition file for 'bun'` inside `bun run build`, mid Docker image build.
 */
export function checkTypeScriptTypeDependencies() {
    const projectRoot = findProjectRoot() ?? process.cwd();
    const resources = discoverResourcesFromRoot(projectRoot);
    const problems = [];
    for (const resource of resources) {
        const packageJsonPath = join(resource.path, "package.json");
        const dockerTsconfigPath = join(resource.path, ".autogenerated", "tsconfig.docker.autogenerated.json");
        if (!existsSync(packageJsonPath) || !existsSync(dockerTsconfigPath)) {
            continue;
        }
        const tsconfig = readJsonFile(dockerTsconfigPath);
        const compilerOptions = tsconfig?.compilerOptions;
        const types = compilerOptions?.types;
        if (!Array.isArray(types) || !types.includes("bun")) {
            continue;
        }
        const pkg = readJsonFile(packageJsonPath);
        const devDependencies = pkg?.devDependencies ?? {};
        if (!devDependencies["@types/bun"]) {
            problems.push(resource.name);
        }
    }
    if (problems.length === 0) {
        return {
            name: "TypeScript Type Dependencies",
            didPass: true,
            message: "All services with a bun-typed tsconfig have @types/bun installed",
        };
    }
    return {
        name: "TypeScript Type Dependencies",
        didPass: false,
        message: `Services set "types": ["bun"] in their Docker tsconfig but are missing the "@types/bun" devDependency, so \`bun run build\` fails with TS2688:\n    ${problems.join("\n    ")}`,
        fix: 'Add to each service\'s package.json devDependencies: "@types/bun": "^1.4.2"',
    };
}
function readJsonFile(path) {
    try {
        return JSON.parse(readFileSync(path, "utf-8"));
    }
    catch {
        return null;
    }
}
function hasSyntheticDefaultImports(tsconfigPath) {
    const config = readJsonFile(tsconfigPath);
    const compilerOptions = config?.compilerOptions;
    return (compilerOptions?.allowSyntheticDefaultImports === true ||
        compilerOptions?.esModuleInterop === true);
}
export function checkFrontendDockerPreflight() {
    const projectRoot = findProjectRoot() ?? process.cwd();
    const resources = discoverResourcesFromRoot(projectRoot).filter((resource) => resource.config?.appType === "frontend");
    if (resources.length === 0) {
        return {
            name: "Frontend Docker Preflight",
            didPass: true,
            isSkipped: true,
            message: "No frontend services to check",
        };
    }
    const problems = [];
    for (const resource of resources) {
        const dockerfilePath = join(resource.path, ".autogenerated", "Dockerfile.app.autogenerated");
        const dockerTsconfigPath = join(resource.path, ".autogenerated", "tsconfig.docker.autogenerated.json");
        if (existsSync(dockerfilePath)) {
            const dockerfile = readFileSync(dockerfilePath, "utf-8");
            const exposesNginxPort = /\bEXPOSE\s+80\b/.test(dockerfile);
            const stack = resource.config?.stack;
            const composePath = stack
                ? join(projectRoot, "services", stack, ".autogenerated", "docker-compose.app.autogenerated.yml")
                : "";
            if (exposesNginxPort && composePath && existsSync(composePath)) {
                const compose = readFileSync(composePath, "utf-8");
                const escapedName = resource.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const portPattern = new RegExp(`traefik\\.http\\.services\\.${escapedName}\\.loadbalancer\\.server\\.port=(\\d+)`);
                const match = compose.match(portPattern);
                const routedPort = match?.[1];
                if (routedPort && routedPort !== "80") {
                    problems.push(`${resource.name}: nginx runtime exposes 80, but generated Traefik routes to ${routedPort}`);
                }
            }
        }
        if (existsSync(dockerTsconfigPath) && !hasSyntheticDefaultImports(dockerTsconfigPath)) {
            const mainPath = join(resource.path, "src", "main.tsx");
            if (existsSync(mainPath)) {
                const main = readFileSync(mainPath, "utf-8");
                const defaultImports = [
                    /import\s+\w+\s+from\s+["']react["']/,
                    /import\s+\w+\s+from\s+["']react-dom\/client["']/,
                ]
                    .filter((pattern) => pattern.test(main))
                    .map((pattern) => (pattern.source.includes("react-dom") ? "react-dom/client" : "react"));
                if (defaultImports.length > 0) {
                    problems.push(`${resource.name}: Docker tsconfig does not allow synthetic default imports, but src/main.tsx default-imports ${defaultImports.join(" and ")}`);
                }
            }
        }
    }
    if (problems.length === 0) {
        const frontendCount = formatCount(resources.length, "frontend");
        return {
            name: "Frontend Docker Preflight",
            didPass: true,
            message: `${frontendCount} ${resources.length === 1 ? "has" : "have"} compatible Docker build/routing metadata`,
        };
    }
    return {
        name: "Frontend Docker Preflight",
        didPass: false,
        message: `Frontend Docker metadata has issues that will make \`tdk up\` fail or route 404:\n    ${problems.join("\n    ")}`,
        fix: 'Regenerate with a current TDK (`tdk config regenerate`) and ensure frontend nginx runtimes route to port 80. For React entrypoints, prefer named imports: `import { StrictMode } from "react"` and `import { createRoot } from "react-dom/client"`.',
    };
}
const MEM_NEAR_LIMIT_PCT = 90;
const CPU_HANGING_PCT = 80;
function parseDockerStats(raw) {
    return raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
        const [name, memPctRaw, cpuPctRaw] = line.split(",");
        return {
            name: name ?? "unknown",
            memPct: Number.parseFloat((memPctRaw ?? "").replace("%", "")),
            cpuPct: Number.parseFloat((cpuPctRaw ?? "").replace("%", "")),
        };
    })
        .filter((stat) => Number.isFinite(stat.memPct) && Number.isFinite(stat.cpuPct));
}
/**
 * Flags containers pinned near their memory limit while also burning CPU --
 * the signature of a boot-time process stuck in a retry/fetch loop, not a
 * genuine crash (which would just exit, not sit at ~100% resource usage).
 *
 * Caught in this workspace: a backend runtime image missing the local Prisma
 * CLI fell back to `bunx prisma`, which re-fetched prisma@latest from npm on
 * every container start. That pinned a 512MB container at ~100% memory and
 * 100%+ CPU indefinitely, and it never became healthy. Neither `docker ps`
 * (just shows "unhealthy") nor the healthcheck's own retry loop surfaces
 * *why* -- only live resource stats catch this pattern before it's mistaken
 * for a slow migration or a flaky healthcheck.
 */
function checkContainerResourceHealth() {
    let raw;
    try {
        raw = execSync('docker stats --no-stream --format "{{.Name}},{{.MemPerc}},{{.CPUPerc}}"', {
            stdio: "pipe",
            encoding: "utf-8",
            timeout: EXEC_TIMEOUT_MS,
        });
    }
    catch (err) {
        return {
            name: "Container Resource Health",
            didPass: true,
            isSkipped: true,
            message: isTimeout(err)
                ? "Docker not responding - skipped container resource check"
                : "Docker not running - skipped container resource check",
        };
    }
    const stats = parseDockerStats(raw);
    if (stats.length === 0) {
        return {
            name: "Container Resource Health",
            didPass: true,
            isSkipped: true,
            message: "No running containers to check",
        };
    }
    const hangers = stats.filter((stat) => stat.memPct >= MEM_NEAR_LIMIT_PCT && stat.cpuPct >= CPU_HANGING_PCT);
    if (hangers.length === 0) {
        return {
            name: "Container Resource Health",
            didPass: true,
            message: `${formatCount(stats.length, "container")} within normal resource usage`,
        };
    }
    const details = hangers
        .map((stat) => `${stat.name} (mem ${stat.memPct.toFixed(0)}%, cpu ${stat.cpuPct.toFixed(0)}%)`)
        .join("\n    ");
    return {
        name: "Container Resource Health",
        didPass: false,
        message: `${formatCount(hangers.length, "container")} pinned near its memory limit while burning CPU -- likely stuck in a boot-time retry/fetch loop, not a normal crash:\n    ${details}`,
        fix: "Check the container's boot logs for a network fetch loop (e.g. `bunx <pkg>` re-downloading a CLI on every start instead of using one already installed): docker logs <container>. If a Prisma auto-migration is the cause, set AUTO_MIGRATE=false in the project's .env as a temporary unblock.",
    };
}
const DEFAULT_PING_TIMEOUT_MS = 5000;
/**
 * Pings every routable service on the same /health URLs `tdk up` advertises.
 *
 * This is a runtime check, not an environment one: before `tdk up` there is
 * nothing to ping, so a stopped stack is reported as skipped and doctor still
 * passes. Once services are up, an unreachable endpoint is a real failure --
 * it catches the case where a container is running but Traefik never routed
 * to it, which `docker ps` alone will not show.
 */
async function checkServiceHealth(timeoutMs) {
    const projectRoot = findProjectRoot() ?? process.cwd();
    const targets = buildHealthTargets(discoverResourcesFromRoot(projectRoot));
    if (targets.length === 0) {
        return {
            name: "Service Health",
            didPass: true,
            isSkipped: true,
            message: "No routable services to ping",
        };
    }
    const probes = await pingHealthTargets(targets, timeoutMs);
    const reachable = probes.filter((probe) => probe.ok);
    const failed = probes.filter((probe) => !probe.ok);
    // Nothing answered at all: either the stack was never started, or ingress
    // never came up (Traefik port conflict). Prefer failing via
    // checkTiltResourceHealth / checkIngressPorts when Tilt is up; here we only
    // skip when there is truly nothing to probe yet.
    if (reachable.length === 0) {
        return {
            name: "Service Health",
            didPass: true,
            isSkipped: true,
            message: `No services responded - skipped ping of ${formatCount(targets.length, "service")} (stack may be down, or Traefik never bound :80)`,
            fix: "If `tdk up` is already running, check Traefik/port 80 in the Tilt UI. Otherwise start with: tdk up",
        };
    }
    if (failed.length === 0) {
        return {
            name: "Service Health",
            didPass: true,
            message: `All ${formatCount(targets.length, "service")} responding on /health`,
        };
    }
    const details = failed
        .map((probe) => {
        const reason = probe.status ? `HTTP ${probe.status}` : (probe.error ?? "no response");
        return `${probe.name} (${reason})\n      ${probe.url}`;
    })
        .join("\n    ");
    return {
        name: "Service Health",
        didPass: false,
        message: `${formatCount(failed.length, "service")} not responding (${reachable.length}/${probes.length} healthy):\n    ${details}`,
        fix: "Check container state and routing: docker ps, then tdk networks to compare the advertised URLs against Traefik's routers",
    };
}
export const doctorCommand = new Command("doctor")
    .description("Check environment readiness for TDK")
    .option("--no-ping", "Skip pinging running services' /health endpoints")
    .option("--ping-timeout <ms>", "Per-service ping timeout in milliseconds", String(DEFAULT_PING_TIMEOUT_MS))
    .action(async (options) => {
    console.log(`\n${chalk.bold("🔍 TDK Doctor")}\n`);
    console.log("Checking environment...\n");
    const pingTimeout = Number.parseInt(options.pingTimeout, 10);
    if (!Number.isFinite(pingTimeout) || pingTimeout <= 0) {
        console.log(`${chalk.red("✗")} --ping-timeout must be a positive number of milliseconds`);
        process.exit(1);
    }
    const checks = [
        checkDockerRuntime,
        checkTilt,
        checkDockerCompose,
        checkDockerVersions,
        checkMasterConfigs,
        checkGeneratedProjectRuntimeAssets,
        checkStarlarkLoadExports,
        checkStartupScripts,
        checkTypeScriptTypeDependencies,
        checkFrontendDockerPreflight,
        checkEnvironmentVariables,
        // Preflight: catch "port 80 already allocated" BEFORE claiming ready.
        checkIngressPorts,
        // Preflight: Verdaccio down causes ImageBuild bun install ConnectionRefused.
        checkPrivateNpmRegistry,
        // Runtime checks: skip gracefully if the stack isn't started yet.
        checkContainerResourceHealth,
        // When Tilt is up, surface red resources (Traefik/apps never started).
        checkTiltResourceHealth,
    ];
    // Runs last: needs routable services (and working Traefik) to mean anything.
    if (options.ping) {
        checks.push(() => checkServiceHealth(pingTimeout));
    }
    let allPassed = true;
    for (const checkFn of checks) {
        const result = await checkFn();
        if (result.isSkipped) {
            console.log(`${chalk.gray("○")} ${chalk.gray(result.message)}`);
            if (result.fix) {
                console.log(`${chalk.blue("ℹ")} ${result.fix}`);
            }
        }
        else if (result.didPass) {
            console.log(`${chalk.green("✓")} ${result.message}`);
        }
        else {
            console.log(`${chalk.red("✗")} ${result.message}`);
            if (result.fix) {
                console.log(`${chalk.blue("ℹ")} Fix: ${result.fix}`);
            }
            allPassed = false;
            break;
        }
    }
    console.log("");
    if (allPassed) {
        console.log(`${chalk.green(chalk.bold("✓"))} Environment ready for TDK`);
        console.log("");
        console.log("Next steps:");
        console.log("  1. Run: tdk up");
        console.log("  2. Open: http://localhost:10350");
    }
    else {
        console.log(`${chalk.red(chalk.bold("✗"))} Environment not ready`);
        console.log("");
        console.log("Fix the issues above, then run: tdk doctor");
        process.exit(1);
    }
});
//# sourceMappingURL=doctor.js.map