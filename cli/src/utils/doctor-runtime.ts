import { execSync } from "node:child_process";
import type { CheckResult } from "../types/index.js";
import { formatCount } from "./formatting.js";
import { getProjectName } from "./service-urls.js";

const EXEC_TIMEOUT_MS = 10_000;

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
        error: error.replace(/\s+/g, " ").slice(0, 240),
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

function summarizePortBindError(error: string): string {
  const bindMatch = error.match(/Bind for [^ ]+:(\d+) failed: port is already allocated/i);
  if (bindMatch) {
    return `host port ${bindMatch[1]} is already allocated`;
  }
  if (/port is already allocated/i.test(error)) {
    return "a required host port is already allocated";
  }
  return error.slice(0, 180);
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
  const highlighted = critical.length > 0 ? critical : parsed.failures;
  const details = highlighted
    .map((failure) => {
      const why = failure.error ? summarizePortBindError(failure.error) : failure.updateStatus;
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

  return {
    name: "Tilt Resources",
    didPass: false,
    message: `Tilt reports ${formatCount(parsed.failures.length, "failed resource")}:\n    ${details}${pendingNote}`,
    fix: hasPortConflict
      ? "Free the conflicting host port (usually 80/443): `docker ps --filter publish=80` then `docker stop <other-traefik>`. Re-trigger Traefik in the Tilt UI or run `tdk up` again."
      : "Open http://localhost:10350, inspect the red resources, fix the listed errors, then `tilt trigger <resource>` or re-run `tdk up`.",
  };
}
