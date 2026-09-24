import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { CheckResult } from "../types/index.js";
import { formatCount } from "./formatting.js";
import { findProjectRoot } from "./paths.js";
import { getProjectName } from "./service-urls.js";

const EXEC_TIMEOUT_MS = 10_000;
const REGISTRY_PROBE_TIMEOUT_MS = 3_000;
const DEFAULT_VERDACCIO_URL = "http://localhost:4873";

/** Host ports Traefik publishes for local ingress. Without these, app routes never come up. */
export const INGRESS_PORTS = [80, 443] as const;

export function toComposeProjectPrefix(projectName: string): string {
  return projectName.replace(/-/g, "_");
}

export interface PublishedPortHolder {
  name: string;
  ports: string;
  publishedPorts: number[];
}

/**
 * Parse `docker ps --format '{{.Names}}\t{{.Ports}}'` lines into containers that
 * publish specific host ports (e.g. 0.0.0.0:80->80/tcp).
 */
export function parsePublishedPortHolders(
  dockerPsOutput: string,
  ports: readonly number[],
): PublishedPortHolder[] {
  const wanted = new Set(ports);
  const holders: PublishedPortHolder[] = [];

  for (const line of dockerPsOutput.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tab = trimmed.indexOf("\t");
    const name = tab >= 0 ? trimmed.slice(0, tab) : trimmed;
    const portsField = tab >= 0 ? trimmed.slice(tab + 1) : "";
    const publishedPorts: number[] = [];

    for (const port of wanted) {
      // Matches 0.0.0.0:80->, :::80->, 127.0.0.1:80->
      const pattern = new RegExp(`(?:^|[\\s,])(?:\\d[\\d.]*:|\\[::\\]:|::)?${port}->`);
      if (pattern.test(portsField) || portsField.includes(`:${port}->`)) {
        publishedPorts.push(port);
      }
    }

    if (publishedPorts.length > 0) {
      holders.push({ name, ports: portsField, publishedPorts });
    }
  }

  return holders;
}

export function isOwnIngressContainer(containerName: string, projectPrefix: string): boolean {
  const name = containerName.toLowerCase();
  const prefix = projectPrefix.toLowerCase();
  // beauty_crm_traefik, beauty_crm-traefik-1, etc.
  return name === `${prefix}_traefik` || name.startsWith(`${prefix}_traefik`);
}

export function findForeignIngressHolders(
  holders: PublishedPortHolder[],
  projectPrefix: string,
): PublishedPortHolder[] {
  return holders.filter((holder) => !isOwnIngressContainer(holder.name, projectPrefix));
}

export interface TiltResourceFailure {
  name: string;
  updateStatus: string;
  runtimeStatus: string;
  error: string;
}

interface TiltUiResourceItem {
  metadata?: { name?: string };
  status?: {
    updateStatus?: string;
    runtimeStatus?: string;
    buildHistory?: Array<{ error?: string }>;
  };
}

/**
 * Extract failing UIResources from `tilt get uiresources -o json`.
 */
export function parseTiltResourceFailures(jsonText: string): {
  failures: TiltResourceFailure[];
  pendingCount: number;
  okCount: number;
  total: number;
} {
  const parsed = JSON.parse(jsonText) as { items?: TiltUiResourceItem[] };
  const items = parsed.items ?? [];
  const failures: TiltResourceFailure[] = [];
  let pendingCount = 0;
  let okCount = 0;

  for (const item of items) {
    const name = item.metadata?.name ?? "unknown";
    const updateStatus = item.status?.updateStatus ?? "";
    const runtimeStatus = item.status?.runtimeStatus ?? "";
    const error = (item.status?.buildHistory?.[0]?.error ?? "").trim();

    if (updateStatus === "error" || runtimeStatus === "error") {
      failures.push({
        name,
        updateStatus,
        runtimeStatus,
        // Keep enough of the raw Tilt error for summarizers; display uses
        // summarizeTiltBuildError() which extracts the actionable root cause.
        error: error.replace(/\s+/g, " ").slice(0, 800),
      });
      continue;
    }

    if (updateStatus === "ok" && (runtimeStatus === "ok" || runtimeStatus === "not_applicable")) {
      okCount += 1;
      continue;
    }

    if (
      name !== "(Tiltfile)" &&
      (updateStatus === "pending" ||
        runtimeStatus === "pending" ||
        updateStatus === "none" ||
        runtimeStatus === "none")
    ) {
      pendingCount += 1;
    }
  }

  return { failures, pendingCount, okCount, total: items.length };
}

/**
 * Turn noisy Tilt/Docker build errors into an actionable one-liner.
 * Prefer registry/network root causes over truncated ImageBuild exit lines.
 */
export function summarizeTiltBuildError(error: string): string {
  const normalized = error.replace(/\s+/g, " ").trim();

  const bindMatch = normalized.match(/Bind for [^ ]+:(\d+) failed: port is already allocated/i);
  if (bindMatch) {
    return `host port ${bindMatch[1]} is already allocated`;
  }
  if (/port is already allocated/i.test(normalized)) {
    return "a required host port is already allocated";
  }

  const refusedPackages = [
    ...normalized.matchAll(
      /ConnectionRefused downloading package manifest (@[A-Za-z0-9._/-]+)/gi,
    ),
  ].map((match) => match[1]);
  if (refusedPackages.length > 0) {
    const unique = [...new Set(refusedPackages)];
    const shown = unique.slice(0, 4).join(", ");
    const more = unique.length > 4 ? ` (+${unique.length - 4} more)` : "";
    return `private registry ConnectionRefused for ${shown}${more} — Verdaccio (:4873) is down or unreachable from the build`;
  }

  if (/failed to resolve source metadata for docker\.io\/library\/(beauty-crm-[^:\s]+)/i.test(normalized)) {
    const image = normalized.match(
      /failed to resolve source metadata for docker\.io\/library\/(beauty-crm-[^:\s]+)/i,
    )?.[1];
    return `base image ${image ?? "beauty-crm-*"} missing locally (golden-layer build not finished or failed)`;
  }

  if (
    /install-deps\.sh/i.test(normalized) ||
    /bun install(?: --production)?/i.test(normalized) ||
    /npm (?:ci|install)/i.test(normalized)
  ) {
    return "dependency install failed during ImageBuild — usually Verdaccio (:4873) unreachable or missing @scoped packages (ConnectionRefused downloading package manifest)";
  }

  const missingImage =
    normalized.match(/No such image:\s*([^:\s]+(?::[^\s]+)?)/i)?.[1] ||
    normalized.match(/pull access denied for ([^,:\s]+)/i)?.[1];
  if (missingImage || /docker compose .*\bup -d --no-build\b/i.test(normalized)) {
    return `compose run failed because image is missing (${missingImage ?? "dev image not built yet"}) — wait for the matching ImageBuild resource, then re-trigger the *-run-only resource`;
  }

  if (/bun run build/i.test(normalized)) {
    return "ImageBuild failed during `bun run build` (compile/typecheck) — open the resource logs in Tilt for the TypeScript/build error";
  }

  if (/ImageBuild:/i.test(normalized) || /^Command "/i.test(normalized)) {
    return normalized.slice(0, 220);
  }

  return normalized.slice(0, 220);
}

export function isRegistryRelatedBuildError(error: string): boolean {
  return /ConnectionRefused downloading package manifest|Verdaccio|private registry|dependency install failed during ImageBuild|install-deps\.sh|bun install/i.test(
    error,
  );
}

export function projectExpectsVerdaccio(projectRoot: string = findProjectRoot() ?? process.cwd()): boolean {
  const projectJsonPath = join(projectRoot, ".tdk", "project.json");
  if (existsSync(projectJsonPath)) {
    try {
      const parsed = JSON.parse(readFileSync(projectJsonPath, "utf-8")) as {
        optional_infra?: { verdaccio?: boolean };
        phases?: Record<string, { enabledStacks?: string[] }>;
      };
      if (parsed.optional_infra?.verdaccio === true) {
        return true;
      }
      if (
        Object.values(parsed.phases ?? {}).some((phase) =>
          (phase.enabledStacks ?? []).includes("verdaccio"),
        )
      ) {
        return true;
      }
    } catch {
      // Fall through to npmrc heuristics.
    }
  }

  // Heuristic: scoped private registry pointed at :4873
  for (const candidate of [
    join(projectRoot, ".npmrc"),
    join(projectRoot, "package.json"),
  ]) {
    if (!existsSync(candidate)) continue;
    try {
      const text = readFileSync(candidate, "utf-8");
      if (/:4873\b/.test(text) || /verdaccio/i.test(text)) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}

/**
 * When the project uses a local Verdaccio registry, fail early with a clear
 * fix instead of only showing truncated ImageBuild exit codes later.
 */
export function checkPrivateNpmRegistry(
  exec: typeof execSync = execSync,
  projectRoot: string = findProjectRoot() ?? process.cwd(),
  registryUrl: string = process.env.VERDACCIO_URL ??
    process.env.NPM_REGISTRY_URL ??
    DEFAULT_VERDACCIO_URL,
): CheckResult {
  if (!projectExpectsVerdaccio(projectRoot)) {
    return {
      name: "Private npm registry",
      didPass: true,
      isSkipped: true,
      message: "Private npm registry (Verdaccio) not enabled for this project - skipped",
    };
  }

  let containerRunning = false;
  try {
    const names = exec("docker ps --format '{{.Names}}'", {
      stdio: "pipe",
      encoding: "utf-8",
      timeout: EXEC_TIMEOUT_MS,
    });
    containerRunning = /verdaccio/i.test(names);
  } catch {
    // Docker may be down; other doctor checks cover that.
  }

  let httpOk = false;
  let httpDetail = "";
  try {
    // curl is more reliable than fetch in the compiled CLI binary environments.
    const probe = exec(
      `curl -fsS -o /dev/null -w '%{http_code}' --max-time 2 ${JSON.stringify(registryUrl)}`,
      {
        stdio: "pipe",
        encoding: "utf-8",
        timeout: REGISTRY_PROBE_TIMEOUT_MS + 1_000,
      },
    ).trim();
    httpOk = /^[23]\d\d$/.test(probe);
    httpDetail = `HTTP ${probe}`;
  } catch (error) {
    httpDetail = error instanceof Error ? error.message.slice(0, 120) : "request failed";
  }

  if (httpOk) {
    return {
      name: "Private npm registry",
      didPass: true,
      message: `Private npm registry reachable at ${registryUrl}${
        containerRunning ? " (verdaccio container running)" : ""
      }`,
    };
  }

  if (containerRunning) {
    return {
      name: "Private npm registry",
      didPass: false,
      message: `Verdaccio container is running but ${registryUrl} is not responding (${httpDetail}). ImageBuilds that install @scoped packages will fail with ConnectionRefused downloading package manifest.`,
      fix: "Check `docker logs` for the verdaccio container, confirm port 4873 is published, then re-run `tdk doctor`.",
    };
  }

  return {
    name: "Private npm registry",
    didPass: false,
    message: `Private npm registry (Verdaccio) is not reachable at ${registryUrl}. Docker ImageBuilds will fail with ConnectionRefused downloading package manifests for @beauty-crm/* and @tdk-landscape/* packages.`,
    fix: "Start the registry with `bun run verdaccio:start` (or `docker compose -f docker-compose.verdaccio.yml up -d`), publish packages with `bun run publish:all` / `scripts/build/publish-to-verdaccio.sh`, then `tilt trigger` failed resources or re-run `tdk up`.",
  };
}

/**
 * Fail when another container already owns Traefik's host ports (80/443).
 * This is the exact failure mode that leaves apps never scheduled while doctor
 * previously reported "Environment ready".
 */
export function checkIngressPorts(
  exec: typeof execSync = execSync,
  projectName: string = getProjectName(),
): CheckResult {
  const projectPrefix = toComposeProjectPrefix(projectName);
  let dockerPs = "";

  try {
    dockerPs = exec("docker ps --format '{{.Names}}\\t{{.Ports}}'", {
      stdio: "pipe",
      encoding: "utf-8",
      timeout: EXEC_TIMEOUT_MS,
    });
  } catch {
    return {
      name: "Ingress Ports",
      didPass: true,
      isSkipped: true,
      message: "Docker not available - skipped ingress port check",
    };
  }

  const holders = parsePublishedPortHolders(dockerPs, INGRESS_PORTS);
  const foreign = findForeignIngressHolders(holders, projectPrefix);

  if (foreign.length === 0) {
    const own = holders.filter((holder) => isOwnIngressContainer(holder.name, projectPrefix));
    if (own.length > 0) {
      return {
        name: "Ingress Ports",
        didPass: true,
        message: `Ingress ports ${INGRESS_PORTS.join("/")} held by this project's Traefik (${own
          .map((h) => h.name)
          .join(", ")})`,
      };
    }
    return {
      name: "Ingress Ports",
      didPass: true,
      message: `Ingress ports ${INGRESS_PORTS.join("/")} are free for Traefik`,
    };
  }

  const details = foreign
    .map((holder) => {
      const ports = holder.publishedPorts.join(", ");
      return `${holder.name} (host ports ${ports})`;
    })
    .join("\n    ");

  return {
    name: "Ingress Ports",
    didPass: false,
    message: `Traefik cannot bind ingress ports because another container already owns them:\n    ${details}`,
    fix: `Stop the foreign container(s), e.g. \`docker stop ${foreign[0]?.name}\`, or shut down the other TDK/Tilt project using that Traefik. Then re-run \`tdk up\`.`,
  };
}

/**
 * When a Tilt session is active, surface resource update errors (Traefik port
 * binds, image builds, etc.) instead of claiming the environment is ready
 * while apps sit forever in pending/none.
 */
export function checkTiltResourceHealth(exec: typeof execSync = execSync): CheckResult {
  let jsonText = "";
  try {
    jsonText = exec("tilt get uiresources -o json", {
      stdio: "pipe",
      encoding: "utf-8",
      timeout: EXEC_TIMEOUT_MS,
    });
  } catch {
    return {
      name: "Tilt Resources",
      didPass: true,
      isSkipped: true,
      message: "Tilt is not running - skipped resource status check",
      fix: "Start them with: tdk up",
    };
  }

  let parsed: ReturnType<typeof parseTiltResourceFailures>;
  try {
    parsed = parseTiltResourceFailures(jsonText);
  } catch {
    return {
      name: "Tilt Resources",
      didPass: true,
      isSkipped: true,
      message: "Could not parse Tilt resource status - skipped",
    };
  }

  if (parsed.total === 0) {
    return {
      name: "Tilt Resources",
      didPass: true,
      isSkipped: true,
      message: "No Tilt UIResources found",
    };
  }

  if (parsed.failures.length === 0) {
    return {
      name: "Tilt Resources",
      didPass: true,
      message: `Tilt resources healthy (${parsed.okCount} ok, ${parsed.pendingCount} pending)`,
    };
  }

  const critical = parsed.failures.filter((failure) =>
    /^(traefik|postgres|nats|infisical|verdaccio|proxy)/i.test(failure.name),
  );
  // Prefer infra failures; otherwise show every failure with a summarized cause
  // (truncated ImageBuild exit lines previously hid ConnectionRefused root causes).
  const highlighted = critical.length > 0 ? critical : parsed.failures;
  const details = highlighted
    .map((failure) => {
      const why = failure.error
        ? summarizeTiltBuildError(failure.error)
        : failure.runtimeStatus === "error"
          ? "runtime error (container crashed or unhealthy — check Tilt logs)"
          : failure.updateStatus || failure.runtimeStatus || "unknown error";
      return `${failure.name}: ${why}`;
    })
    .join("\n    ");

  const pendingNote =
    parsed.pendingCount > 0
      ? `\n    ${formatCount(parsed.pendingCount, "resource")} still pending/not started — often blocked by the failures above.`
      : "";

  const hasPortConflict = highlighted.some((failure) =>
    /port is already allocated/i.test(failure.error),
  );
  const hasRegistryFailure = highlighted.some((failure) =>
    isRegistryRelatedBuildError(failure.error) ||
      isRegistryRelatedBuildError(summarizeTiltBuildError(failure.error)),
  );

  let fix =
    "Open http://localhost:10350, inspect the red resources, fix the listed errors, then `tilt trigger <resource>` or re-run `tdk up`.";
  if (hasPortConflict) {
    fix =
      "Free the conflicting host port (usually 80/443): `docker ps --filter publish=80` then `docker stop <other-traefik>`. Re-trigger Traefik in the Tilt UI or run `tdk up` again.";
  } else if (hasRegistryFailure) {
    fix =
      "Start Verdaccio (`bun run verdaccio:start`), ensure packages are published (`bun run publish:all` or `bash scripts/build/publish-to-verdaccio.sh`), confirm `curl http://localhost:4873` works, then `tilt trigger` the failed resources.";
  }

  return {
    name: "Tilt Resources",
    didPass: false,
    message: `Tilt reports ${formatCount(parsed.failures.length, "failed resource")}:\n    ${details}${pendingNote}`,
    fix,
  };
}
