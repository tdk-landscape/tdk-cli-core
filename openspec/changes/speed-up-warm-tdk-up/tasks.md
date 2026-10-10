## 1. Baseline

- [ ] 1.1 Add a small script (or `tdk` debug command) that prints per-resource build durations from Tilt's `uiresources` build history for a running project.
- [ ] 1.2 Record a baseline on `tdk-restaurant-example`: one cold-cache and three warm `tdk up` runs, with machine, Docker CPU/memory and TDK version. Post it on #1023.

## 2. Golden images: skip when unchanged, bake when not

- [ ] 2.1 Compute the golden hash over the golden Dockerfile content and pinned base images.
- [ ] 2.2 Generate a bake file from `GOLDEN_LAYERS` with one target per image, tags, and the `tdk.golden.hash` label.
- [ ] 2.3 Change `build_golden_layers` to skip when every tag exists with the matching label, otherwise run `docker buildx bake --load`, falling back to the serial `docker build` loop with a log line when bake is unavailable.
- [ ] 2.4 Add a way to force a golden rebuild and document it.
- [ ] 2.5 Tests: bake targets and tags match `GOLDEN_LAYERS`; command text contains the skip check, bake call and fallback.
- [ ] 2.6 Measure warm and changed-Dockerfile runs on the restaurant example and post on #1023.

## 3. Tilt build concurrency

- [ ] 3.1 Emit `update_settings(max_parallel_updates=N)` in the generated Tiltfile, computed from `docker info` with the clamp in the design, honoring `TDK_MAX_PARALLEL_BUILDS` and the project setting.
- [ ] 3.2 Log the chosen value and its source at Tiltfile load; keep Tilt's default when `docker info` fails.
- [ ] 3.3 Update golden Tiltfile snapshots in `cli/src/generator/__tests__/golden/` and add a test for the override and failure paths.
- [ ] 3.4 Measure peak Docker memory during a restaurant warm start at the chosen `N` and adjust the per-build budget if needed.
- [ ] 3.5 Measure and post on #1023.

## 4. Frontend builds

- [ ] 4.1 Detect the standard `tsc[ --noEmit][ -b] && vite build[ ...]` build-script form; for it, emit a direct `bunx vite build --config <generated build config>` step in the L3 frontend stage. Leave other script forms unchanged.
- [ ] 4.2 Register a non-blocking `<service>-typecheck` local resource for those frontends.
- [ ] 4.3 Tests for the detection (standard forms, custom scripts, missing script) and the generated Dockerfile step.
- [ ] 4.4 Measure frontend build time and the end-to-end warm start; post on #1023.

## 5. Docs and follow-ups

- [ ] 5.1 Document the golden skip, the force-rebuild option, `TDK_MAX_PARALLEL_BUILDS`, and the type-check resource.
- [ ] 5.2 Open follow-up issues for registry-backed golden images and caches, and for L2 lockfile handling.
