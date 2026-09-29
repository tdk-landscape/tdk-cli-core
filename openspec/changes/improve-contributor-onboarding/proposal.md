## Why

The repository welcomes contributions, but its newcomer guidance only gives a general setup/PR checklist and one detailed recipe for Vite frontend providers. A newcomer adding a different framework, database, or development tool has no clear map of the relevant subsystem, shared contracts, validation path, or what evidence reviewers expect, making the first useful contribution harder than it needs to be.

## What Changes

- Reshape the contributor entry point into a clear first-contribution path: choose a contribution type, find the owning subsystem, prepare the environment, implement and validate, then open a reviewable pull request.
- Add contribution recipes for CLI behavior, frontend framework providers, databases/infrastructure tools, and engine/discovery changes, each identifying the relevant code and configuration surfaces, shared boundaries, tests, and docs to update.
- Explain the proposal/spec workflow for changes that alter architecture, manifests, generated output, or user-visible behavior, with links to representative examples such as the Vue provider change.
- Give contributors a reusable pull request checklist covering scope, compatibility, tests, documentation, CI, and concrete before/after evidence.
- Apply area labels to pull requests from changed paths and make the PR template guide authors to the steps and checks for each affected area.
- Cover the repository's actual source, test, documentation, tooling, and configuration paths, with focused technology labels where a changed path identifies a stack clearly.
- Explain which GitHub workflows run for all pull requests versus selected changed paths.
- Cross-check commands and paths against the current repository and remove or flag stale internal-only instructions that could mislead newcomers.

## Capabilities

### New Capabilities

- `contributor-onboarding`: Newcomers can identify where and how to make common feature contributions and prepare a reviewable pull request.

### Modified Capabilities

None.

## Impact

- Contributor-facing docs: `CONTRIBUTING.md`, `README.md`, and new or revised guides under `docs/`.
- Reference material: CLI, engine, discovery, database/infrastructure generators, tests, CI workflows, and representative OpenSpec changes.
- No runtime code, public API, or dependency changes are expected.
