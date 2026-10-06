# Tasks

## 1. Engine: Name Resolution

- [ ] 1.1 In `apply_compose_resource_registration.star`, treat `postgres` and `database-management` in a selected resource's `dependsOn` as aliases for the shared platform Postgres Tilt resource `postgres`.
- [ ] 1.2 Do not fall through to `postgres-yaml` (or any other name) for these two aliases.
- [ ] 1.3 Keep unknown names (e.g. `postgress`, `Postgres`, `postgresql`, `my-db`) on the existing missing/unknown-dependency error path.
- [ ] 1.4 Add Starlark unit tests for alias resolution to `postgres`, non-alias fall-through, and typo/near-miss errors.
- [ ] 1.5 Add tests: mixed `dependsOn: ["postgres", "database-management"]` resolves both to one `postgres` edge; unknown names do not resolve to platform Postgres.

## 2. Engine: Start Path (Feature Off + Selected dependsOn)

- [ ] 2.1 When `database-management` is off but any **selected** resource depends on `postgres` or `database-management`, start Postgres for that run.
- [ ] 2.2 Materialize platform files under `services/platform/database-management` using the existing Compose generation/path from `_load_database_management` / `_ensure_database_management_compose` — not a second image or port.
- [ ] 2.3 Register the existing `postgres` Tilt resource through the same infra loader path the feature uses.
- [ ] 2.4 Feature-on start path stays: one `postgres` resource, same compose, same port (when the feature is on). Do **not** claim feature-on is fully unchanged — resolution and verify/doctor still change when either name is present.
- [ ] 2.5 Leave the feature-off + no such `dependsOn` path unchanged: Postgres does not start; no `postgres` resource registered solely because of `dependsOn`.
- [ ] 2.6 Add tests: feature off + `dependsOn: ["postgres"]` starts Postgres with platform files present; feature off + `dependsOn: ["database-management"]` same; feature off + no dependency does not start Postgres.
- [ ] 2.7 Add tests: empty `dependsOn: []` does not start Postgres; two selected dependents start Postgres once; feature on + either name does not create a second DB/image/port.
- [ ] 2.8 Add tests: materialized compose uses existing image/host-port/network conventions; no second host port; no per-service compose project for shared Postgres.
- [ ] 2.9 Add tests: with feature **on**, `dependsOn: ["postgres"]` / `["database-management"]` resolve to Tilt `postgres`, not `postgres-yaml` (resolution changes in both feature states).

## 3. Engine: Dependency Edge

- [ ] 3.1 Keep `postgres` in the selected resource's Tilt `resource_deps` when Postgres starts because of that `dependsOn`.
- [ ] 3.2 Do not add a second `postgres` edge when `_build_infra_dependencies` already added it because `database-management` is on.
- [ ] 3.3 Do not drop the edge when it is the reason Postgres should exist.
- [ ] 3.4 Express the edge as Tilt `resource_deps` on `postgres` (start order), not a Tilt resource named `database-management`. Do not invent a health contract beyond the existing `database-management` path.
- [ ] 3.5 Add tests: single edge with feature on + dependsOn; edge present with feature off + dependsOn (`postgres` and `database-management` names); no edge when neither feature nor selected dependency starts Postgres; no duplicate when feature + alias both present; other non-DB edges unchanged.

## 4. Engine: Selection Bound (start path only)

- [ ] 4.1 Evaluate `dependsOn` for the **engine start path** only against resources in the current `tdk up` selection.
- [ ] 4.2 A dependency on an unselected resource MUST NOT start Postgres when no selected resource depends on either name.
- [ ] 4.3 Unselected dependents MUST NOT receive a `postgres` edge solely because another selected resource listed it.
- [ ] 4.4 Add tests: unselected `dependsOn: ["postgres"]` does not start Postgres; selected one does; partial selection starts Postgres for selected dependents only and does not edge S1 because of S2.

## 5. Engine: Prisma Non-Start Regression

- [ ] 5.1 Ensure starting shared Postgres via `dependsOn` does not enable, launch, or scaffold Prisma, migrators, or other `featuresEnabled` entries.
- [ ] 5.2 Assert `featuresEnabled` is not rewritten to include `prisma` when a resource only lists `dependsOn: ["postgres"]`.
- [ ] 5.3 Assert no Prisma Tilt resource/job starts when `prisma` is not in `featuresEnabled`, even if shared Postgres starts.
- [ ] 5.4 Assert unselected Prisma resources do not start solely because a selected resource depends on `postgres`.
- [ ] 5.5 Add Starlark/unit tests for 5.1–5.4 (resource registration + feature predicates).

## 6. CLI: Verify and Doctor Reporting (project resource set)

- [ ] 6.1 Predicate shape matches the engine: Postgres will start when the feature is on **or** an inspected project resource depends on `postgres` / `database-management`. Resource set is what verify/doctor already inspect — **not** a `tdk up` filter.
- [ ] 6.2 `tdk config verify`: when Postgres will start because of a project resource's `dependsOn`, report that it will start because of that dependency.
- [ ] 6.3 `tdk doctor`: same reporting for `dependsOn: ["postgres"]` and `["database-management"]`.
- [ ] 6.4 Do not report `postgres` or `database-management` as missing services when that dependency is present.
- [ ] 6.5 Keep unknown names (e.g. `postgress`, `Postgres`, `postgresql`) as errors; they must not report Postgres-will-start.
- [ ] 6.6 Verify and doctor MUST agree on the will-start predicate for the same project state.
- [ ] 6.7 When no inspected project resource depends on either name and the feature is off, verify/doctor MUST NOT report Postgres-will-start because of a dependency.
- [ ] 6.8 Add CLI tests for verify/doctor messages, missing-service suppression, typo/near-miss errors, agreement, and negative will-start cases.
- [ ] 6.9 Add CLI tests that doctor/verify do **not** claim Prisma will start when `prisma` is not enabled, even when Postgres will start because of `dependsOn`.
- [ ] 6.10 Add CLI tests that verify/doctor report will-start from a project resource even when that resource would not be selected by a hypothetical `tdk up` filter (project scope, not run scope).
- [ ] 6.11 Do not change `tdk resource` scaffold output (`dependsOn: []` remains; Prisma stays under #531).

## 7. Verification and Evidence

- [ ] 7.1 Manual/e2e: `database-management` off, one resource with `dependsOn: ["postgres"]` — `tdk up` starts shared Postgres (platform files materialized) and the service's `resource_deps` includes `postgres`.
- [ ] 7.2 Manual/e2e: same with `dependsOn: ["database-management"]` — same shared Postgres, same edge.
- [ ] 7.3 Manual: feature on + either name — one `postgres` resource, no duplicate edge, no second database/image/port; resolution is Tilt `postgres`, not `postgres-yaml`.
- [ ] 7.4 Manual: no such `dependsOn` + feature off — Postgres does not start.
- [ ] 7.5 Manual: `dependsOn: ["postgress"]` — still an error in verify/doctor/resolution; Postgres does not start.
- [ ] 7.6 Manual/e2e: `dependsOn: ["postgres"]` **without** Prisma in `featuresEnabled` — Postgres starts; no Prisma migrator/service/job starts; `featuresEnabled` unchanged.
- [ ] 7.7 Manual: `tdk up` filtered to a resource without the dependency, with only an unselected resource listing `dependsOn: ["postgres"]` — Postgres does not start for that run; verify/doctor still report will-start (project scope).
- [ ] 7.8 Run `tests/tilt-engine/` unit tests, `bun test` for CLI, typecheck and Biome for touched packages; record evidence against this change.
