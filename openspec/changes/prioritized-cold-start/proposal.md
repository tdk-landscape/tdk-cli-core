# Proposal

## Why

On a large landscape (`tdk-erp-system`: 107 resources, 110 containers), a request to a specific backend — e.g. `http://api.tdk-erp-system.localhost/api/data-governance/health` — can go unanswered for minutes not because that backend is broken, but because Tilt hasn't reached it yet in its own bring-up order. `data-governance-api` has no `sablier` block today, so it is started the same way as every other resource: as part of the full `tdk up` sequence, behind however many of the other ~106 resources Tilt's dependency graph and build concurrency put ahead of it. The existing premium Sablier integration (`engine/topologies/platform/docker/networking/sablier_container_cycle.star`, real implementation in `tdk-cli-extensions/premium/networking/`) already wakes a resource on its next request — but only if Tilt already created and then stopped that resource's container this session. It has nothing to wake when the container was never created in the first place, which is exactly the case here. Developers working against one corner of a large landscape (one API, one flow) shouldn't pay the full-landscape startup cost, or sit wondering whether the resource they actually want is stuck or just queued.

## What Changes

- Extend the existing `sablier: {enable: true}` manifest block (opt-in, premium, unchanged licensing boundary) so an opted-in resource can be marked deferred for the *current* `tdk up` run, not only for scale-to-zero after it has run once. A deferred resource's image still builds during `tdk up` (so there's something to start on first request), but Tilt does not create or start its container at all, removing it from the sequential dependency-bring-up path entirely (confirmed empirically: an `auto_init=False` resource has no Docker container object until triggered — there is nothing for Traefik's normal Docker-label discovery to find).
- Because a never-created resource has no container and thus no Docker labels, give Traefik a static route for it via its file provider (a mechanism this codebase already references by name — `maintenance@file` — but doesn't yet enable for standalone projects), pointed at a small always-on wake endpoint. A resource that has previously run and is merely stopped keeps using today's Docker-label discovery (`traefik.docker.allownonrunning=true` plus Sablier's labels) unchanged.
- On the first request that hits a deferred resource's route, the wake endpoint runs `tilt trigger <resource>` (Tilt's own supported CLI, proven to create-and-start a never-touched resource in one call) for that resource and its `resource_deps` chain, so it's prioritized immediately instead of waiting for Tilt's normal resource order. For a previously-run-then-stopped resource, Sablier's existing Docker-level start stays the primary (faster) path, with the same trigger call fired alongside it so Tilt's own state (e.g. a migrator) catches up too.
- Extend Sablier's existing `group` field so a resource's own dependency chain (`dependsOn` / `resource_deps`, e.g. its database and NATS) is included in the wake automatically when not already explicitly grouped, so a request doesn't wake the leaf resource only to have it fail health checks waiting on a still-cold dependency.
- `tdk up` and `tdk doctor` report deferred resources as intentionally cold (not stalled/pending), so their absence from the early startup log isn't read as a hang.

**BREAKING (none):** this only changes behavior for resources that opt in via the existing `sablier` manifest block; a resource without that block behaves exactly as it does today.

## Capabilities

### New Capabilities
- `on-demand-resource-startup`: Requirements for how a Sablier-opted-in resource that Tilt has not yet started this session is discovered by Traefik while stopped, triggered and prioritized on its first request (including its dependency chain), and reported by `tdk up`/`tdk doctor` as deferred rather than stalled.

### Modified Capabilities
- (none — no existing `openspec/specs/` capability documents today's Sablier behavior or Tilt's startup sequencing, so there is nothing to amend; this proposal documents the extended behavior as new.)

## Non-goals

- Changing the free/premium licensing boundary. This stays inside the existing `sablier` opt-in and its license gate (per product decision); it does not become default behavior for unlicensed or non-opted-in resources.
- Reducing per-container CPU/memory footprint — already addressed by `optimize-runtime-docker-layers`, whose non-goals explicitly deferred "putting backends under Sablier scale-to-zero" to this change.
- Building a general-purpose priority queue inside Tilt itself. This relies on Tilt's existing `TILT_AUTO_INIT_APPS`/manual trigger mode and its trigger API rather than patching Tilt's own scheduler.
- Changing behavior for resources already running and healthy, or for landscapes with no `sablier`-opted-in resources.

## Impact

- **Engine (Starlark), premium (`tdk-cli-extensions/premium/networking/`):** `sablier_container_cycle.star` gains the "created but not started" labels/config and the dependency-group defaulting.
- **Engine (Starlark), free stub (`tdk-cli-core`):** `engine/topologies/platform/docker/networking/sablier_container_cycle.star` stub signatures may need new no-op parameters to stay in sync with the premium module's signature.
- **Engine (Starlark):** `engine/topologies/tilt/resources/orchestrator/apply_runtime_flags.star` (today's landscape-wide `TILT_AUTO_INIT_APPS`) needs a per-resource variant driven by each manifest's `sablier` block rather than one global flag; `engine/lifecycle/orchestrator.star`'s `STARTUP_PHASES`/`should_wait_for_dependencies` need to recognize deferred resources so they don't block other resources' phase sequencing.
- **Engine (Starlark):** `engine/topologies/platform/docker/compose/traefik_standalone.star` — adds `--providers.file` support (new command flag, mounted dynamic-config directory) plus generated static route entries for deferred resources, and a wake endpoint (sidecar, or an addition to the existing `sablier` container) that runs `tilt trigger` and proxies the held request through.
- **CLI:** `cli/src/utils/resource-features.ts` (`sablier` feature description), `cli/src/commands/up.ts` and `doctor-runtime.ts` reporting for deferred resources; `cli/src/types/index.ts`'s `sablier` manifest type gains the new field(s).
- **Manifest schema:** `engine/topologies/tilt/manifest/schema.star`'s `sablier` block gains a new optional key (name TBD in design, e.g. `deferStart`).
- **Generated projects:** every project with an opted-in `sablier` resource needs `tdk project --yes` (re-vendor) plus a golden image rebuild to pick up the change; existing non-opted-in resources are unaffected.
- **Tests:** `tests/tilt-engine/` snapshot tests for the extended Sablier labels and the per-resource trigger-mode resolution.
