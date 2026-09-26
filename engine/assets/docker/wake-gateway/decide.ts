/**
 * Pure decision logic for the wake gateway (see openspec/changes/prioritized-cold-start).
 *
 * The gateway sits behind a Traefik static (file-provider) route for every
 * `sablier: {enable: true, deferStart: true}` resource. This module decides
 * what to *do* given a snapshot of container state; the actual Docker/Tilt
 * I/O and the healthcheck-polling loop live in server.ts, which is a thin
 * wrapper around this so the decision itself stays testable without a live
 * Docker daemon or Tilt instance.
 */

export type ContainerState = "absent" | "created" | "running" | "exited";

export interface DependencySnapshot {
  name: string;
  state: ContainerState;
}

export interface WakeRequestSnapshot {
  resourceContainerName: string;
  resourceState: ContainerState;
  dependencies: DependencySnapshot[];
}

export interface WakeAction {
  /** Resources to `tilt trigger` (task 1.5: Tilt never cascades this on its own). */
  tiltTriggerNames: string[];
  /**
   * Whether to also try Sablier's own Docker-level start for the resource.
   * Only meaningful when the resource's container already exists (D2/D3):
   * Sablier has nothing to manage for a container that was never created.
   */
  useSablierStart: boolean;
}

/**
 * Decide which resources need `tilt trigger` and whether Sablier's Docker-level
 * start also applies, given one point-in-time snapshot (D2/D3/D5).
 */
export function decideWakeAction(snapshot: WakeRequestSnapshot): WakeAction {
  const tiltTriggerNames: string[] = [];

  if (snapshot.resourceState !== "running") {
    tiltTriggerNames.push(snapshot.resourceContainerName);
  }
  for (const dep of snapshot.dependencies) {
    if (dep.state !== "running") {
      tiltTriggerNames.push(dep.name);
    }
  }

  const useSablierStart = snapshot.resourceState === "exited" || snapshot.resourceState === "created";

  return { tiltTriggerNames, useSablierStart };
}

export interface WaitOutcome {
  ready: boolean;
  /** Names still not running/healthy when the wait ended (empty when ready). */
  pending: string[];
}

/**
 * Decide whether a set of health polls (resource + dependencies) means the
 * request can be let through yet, or should keep waiting / time out.
 * `healthy` maps each name from a WakeAction's tiltTriggerNames (plus the
 * resource itself) to its latest observed health state.
 */
export function evaluateReadiness(
  requiredNames: string[],
  healthy: Record<string, boolean>,
): WaitOutcome {
  const pending = requiredNames.filter((name) => !healthy[name]);
  return { ready: pending.length === 0, pending };
}
