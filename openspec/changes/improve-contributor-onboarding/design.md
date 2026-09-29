## Context

`CONTRIBUTING.md` currently covers basic setup, a narrow pointer to the frontend provider guide, generic PR steps, and extensive test-evidence advice. The frontend guide is a useful, concrete recipe for Vite-based providers, but the repo also spans a TypeScript CLI, Starlark/Tilt engine, service discovery, generated configs, and database/infrastructure integrations. The root README and contributor docs do not show a newcomer how those pieces relate or which validation path applies to a feature.

The proposal is documentation-only. Paths and commands must be verified from the current repository during implementation; agent guidance such as the existing `engine/AGENTS.md` is not automatically suitable as public contributor instructions.

## Goals / Non-Goals

**Goals:**

- Give a newcomer a short end-to-end path from choosing a contribution to opening a useful PR.
- Provide a subsystem map and focused recipes for CLI, frontend providers, databases/infrastructure tools, and engine/discovery work.
- Explain when and how to use OpenSpec for changes affecting contracts, generated output, or multiple subsystems.
- Make validation and PR evidence concrete, truthful, and easy to follow.

**Non-Goals:**

- Changing runtime behavior, architecture, dependencies, or CI policy.
- Replacing the precise Vue/frontend provider guide with generic guidance.
- Documenting every database or external tool individually; recipes should show how to find the owning generator/resource and identify the questions a specific integration needs to answer.
- Requiring heavyweight Docker/Tilt checks for every documentation-only or isolated CLI contribution.

## Decisions

### Keep `CONTRIBUTING.md` as the quick-start index

Make the root guide answer: where to begin, which contribution type to choose, the minimum development setup, how to run the relevant checks, and how to prepare/open a PR. Link out to focused guides for detail. This keeps the first read approachable while retaining existing test-evidence guidance.

Alternative: put every recipe and subsystem detail in `CONTRIBUTING.md`. That makes the entry point long and harder to scan.

### Organize recipes by change type and shared boundary

Provide a compact map and recipes that identify likely ownership, source/configuration areas, what remains shared, compatibility concerns, required tests, and docs to update. Cover CLI commands/scaffolding, Vite frontend providers (linking the existing guide), databases and infrastructure integrations, and engine/discovery/generator changes. For a new database or tool, prompt contributors to trace its manifest/config, generator/resource registration, startup/dependency behavior, health/readiness, cleanup, tests, and user-facing documentation instead of implying every integration has identical files.

Alternative: provide a large list of individual implementations. That is likely to become stale and still would not teach contributors how to trace the next integration.

### Make OpenSpec guidance proportional to change scope

Add a short workflow for cross-cutting or contract-changing work: inspect nearby specs and archived changes, propose the change, implement against specs/tasks, and keep the proposal linked in the PR. Point to the archived Vue provider change as a worked example. State that straightforward docs fixes and isolated changes do not need ceremony unless repository policy requires it.

Alternative: mandate OpenSpec for every pull request. This adds overhead to small fixes and does not match the task of improving newcomer access.

### Tie PR readiness to reproducible evidence

Use a reusable checklist that asks for intent/scope, affected user behavior, tests/checks actually run, generated output or before/after evidence where relevant, documentation, and known gaps. Keep detailed before/after evidence instructions in the current guide and cross-link them from each recipe.

Alternative: duplicate full command lists in every guide. Duplicated checklists drift; a central checklist with per-area additions is easier to maintain.

## Risks / Trade-offs

- **Risk:** New guides repeat each other or the existing Vue guide. → Keep `CONTRIBUTING.md` as an index, link to the existing framework recipe, and centralize shared PR evidence guidance.
- **Risk:** Paths, commands, or test expectations become stale. → Verify every documented command and path against package scripts and CI, then add a maintainer review task for future structural changes.
- **Risk:** A generic database/tool recipe overstates one integration's architecture. → Describe an investigation checklist and cite current examples rather than asserting all integrations use the same implementation path.
- **Risk:** Detailed guidance discourages smaller contributions. → Clearly label minimum steps and mark broader integration/architecture checks as conditional on affected areas.

## Migration Plan

Update docs in place with no runtime migration. Add or revise linked guides, verify all links and commands, and review the rendered Markdown. Rollback is a revert of the documentation change.

## Open Questions

None. During implementation, select representative existing database/tool paths by inspecting the current engine and CI rather than assuming a single canonical integration.
