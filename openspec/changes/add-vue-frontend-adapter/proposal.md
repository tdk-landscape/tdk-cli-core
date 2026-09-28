## Why

TDK currently generates React directly inside the generic frontend resource command, so framework-specific assumptions are difficult to extend safely and community contributions lack a documented path. Isolating React first creates a stable adapter boundary, after which Vue can be added as an opt-in provider without changing the React default or shared TDK runtime contract.

## What Changes

- Separate framework-neutral frontend generation from the React starter and preserve React as the default for existing and new frontend resources.
- Document the adapter contract and contributor steps in `CONTRIBUTING.md` and a focused guide, including how to add React-compatible or lightweight Vite-based frameworks.
- Add an opt-in Vue 3 + Vite + TypeScript frontend provider with generated entry files, dependencies, and configuration.
- Add automated checks for adapter registration, generated Vue output, React default/backward compatibility, and the supported CLI quality checks in CI.

## Capabilities

### New Capabilities

- `frontend-framework-adapters`: Framework-specific frontend scaffolding behind a shared TDK frontend contract.
- `frontend-framework-contributions`: Contributor documentation and checks for adding frontend framework adapters.

### Modified Capabilities

None. Framework selection is specified as part of the new `frontend-framework-adapters` capability.

## Impact

- Affected code: `cli/src/commands/resource.ts`, frontend template/generator modules, tests, and `.github/workflows/ci.yml`.
- Affected documentation: `CONTRIBUTING.md`, `docs/`, and CLI frontend resource documentation.
- Generated service metadata and CLI options may gain an optional frontend framework identifier; Docker, nginx, Tilt, ports, and generated API/environment modules remain shared.
- Vue dependencies belong only to generated Vue resources; the TDK CLI runtime does not gain Vue as a dependency.
