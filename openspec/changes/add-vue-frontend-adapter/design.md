## Context

`tdk resource` currently builds frontend files inline in `cli/src/commands/resource.ts`. The shared package scripts include Vite, but the entry file, HTML script path, app source, dependencies, and TSX choices are React-specific. Frontend services also use shared service metadata and shared engine behavior for ports, proxying, Docker, nginx, Tilt, and generated API/environment files.

The work is intentionally staged: establish the provider seam while preserving the existing React output, make that seam usable by outside contributors, then use Vue as the first additional provider and exercise both paths in CI.

## Goals / Non-Goals

**Goals:**

- Keep framework templates and dependencies out of the generic resource command.
- Keep React as the default and preserve existing generated React resource behavior.
- Make framework selection explicit and reject unsupported framework identifiers before writing files.
- Let a provider contribute generated files and framework dependencies while the shared TDK runtime contract remains framework-neutral.
- Provide contributor instructions and repeatable CI coverage for new providers.

**Non-Goals:**

- Changing the default framework or converting existing React resources to Vue.
- Adding framework-specific Docker, nginx, Traefik, Tilt, or API client implementations.
- Adding frameworks beyond React and Vue in this change.
- Adding Vue dependencies to the TDK CLI runtime itself.

## Decisions

### Use in-repository providers

Add a small frontend framework module area within `cli/src` (with provider-owned templates under the CLI template tree). Keep the registry, shared frontend generation, and React provider in the same shipped package. This avoids a separately versioned template package and keeps resource generation available in installed CLI distributions.

Alternative considered: a separate framework repository/package. That introduces release and version coordination for files that must match the CLI generator, with no benefit for two small providers.

### Define a narrow provider contract

The shared generator owns common package scripts, base TypeScript settings, `service.json`, and shared TDK conventions. A provider supplies its stable id and label, runtime and development dependencies, frontend-specific compiler/Vite configuration where required, and its entry/application files. Keep the contract minimal and based on values plus file definitions rather than provider callbacks that can mutate arbitrary shared output.

Alternative considered: duplicating the full frontend generator per framework. That makes shared behavior drift and undermines the single generated service contract.

### Resolve framework explicitly with a React fallback

Add an optional framework identifier to frontend resource creation and persist it in generated `service.json`. Omission resolves to `react`, preserving existing callers and manifests. An unrecognized identifier returns an actionable CLI error before any output directory or files are created. The registry is the source of supported framework ids.

Alternative considered: infer a framework from files or dependencies. Inference is ambiguous for new resources and can make regeneration behave differently from initial scaffolding.

### Keep Vue as a Vite-based provider

Vue provider output uses Vue 3, TypeScript, Vite, and the official Vue Vite plugin, with a Vue SFC entry and starter component. It consumes the same generated service metadata and shared runtime contract. No changes to engine-side runtime behavior are needed for scaffolding support.

Alternative considered: introduce Vue CLI or a framework-specific production pipeline. This would add another build system and require changes to shared Docker and engine behavior.

### CI checks the contributor contract

Extend the existing CLI CI workflow with provider-focused automated tests for registry resolution, default React output compatibility, Vue output/dependencies, and fail-closed behavior for unknown ids. Continue running the repo's existing typecheck, lint, and test jobs; do not add heavyweight browser or Docker integration checks unless the existing workflow already supports them.

## Risks / Trade-offs

- **Risk:** Extracting the current inline React templates can alter generated files accidentally. → Capture representative React output in tests before extraction and compare output after migration.
- **Risk:** Provider metadata and Vite/TypeScript details can become overly generic. → Keep common output in the shared generator and require providers to contribute only framework-specific needs.
- **Risk:** Vue starter files may not build under generated project settings. → Add fixture-level checks that inspect the generated file set and run existing CLI checks; document any check that requires a separate fixture environment.
- **Risk:** Documentation can become stale as provider APIs evolve. → Tie the documented steps to the same provider contract and validate registered providers in CI.

## Migration Plan

1. Extract React into the provider contract/registry and preserve omitted-framework behavior.
2. Document the provider authoring flow and add contributor-facing PR checklist guidance.
3. Add and register Vue, its scaffold tests, and CI checks for provider behavior.

Rollback is a normal revert of the change. Existing generated services remain independent and need no migration.

## Open Questions

- Whether framework selection should be exposed only as a `tdk resource --framework` option or also through interactive prompts. Initial scope can use the explicit option and retain React as the prompt/default selection.
- Whether the Vue provider needs a dedicated test runner dependency in generated projects. Prefer to keep existing generated test behavior until a concrete Vue component test is part of scope.
