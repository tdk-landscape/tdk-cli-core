# 2. Follow the recipe for your change

These recipes are starting points. If you cannot find a file, search for the command, config key, or generated filename in the repository and ask in the issue.

## Change a CLI command

1. Find the command under `cli/src/commands/`.
2. Look for its tests under `cli/src/commands/__tests__/` or beside its source file.
3. Make the smallest change that fixes the issue or adds the option.
4. Update `cli/README.md` if the command or its options are user-visible.
5. From the repo root, run `bun run typecheck`, `bun run lint`, and `bun run test`.

For frontend frameworks, follow the dedicated [frontend provider guide](../frontend-framework-providers.md). It explains the React/Vue provider boundary, engine templates, compatibility checks, and PR checklist.

## Add a database or infrastructure tool

First decide what you are adding:

- A **database used by a service** may affect the service manifest, database URL generation, migration setup, and readiness checks.
- A **shared local tool** (for example Redis or NATS) may affect optional feature configuration, generated Compose files, Tilt resource registration, dependencies, and health checks.

Use the existing code as a map:

1. Start with `engine/topologies/tilt/resources/infra-loader.star` to see how shared infrastructure is loaded and registered.
2. Look at `engine/topologies/tilt/resources/databases.star` for the database lifecycle example and `engine/topologies/platform/docker/compose/` for Compose generation.
3. Find the related feature or manifest setting and follow it to where it is validated and enabled. Search for the setting name with `rg`.
4. Trace the full lifecycle: configuration, generated files, startup order, health/readiness, environment or secrets, shutdown/cleanup, and what happens when the tool is disabled.
5. Add checks for the behavior you changed. CLI and Starlark generator tests live under `cli/src/commands/__tests__/`; the Python engine tests are under `tests/tilt-engine/`.
6. Update the user-facing feature or CLI docs, such as `docs/FEATURES.md` or `cli/README.md`.

Do not assume a new tool needs every file above. Follow the current implementation that is closest to your feature and keep shared service behavior working.

## Change the engine or service discovery

1. For Tilt resource orchestration, begin in `engine/topologies/tilt/resources/`.
2. For Docker, networking, or persisted state, begin in `engine/topologies/platform/`.
3. For manifest scanning and dependency graphs, begin in `discovery/`.
4. Search for the affected output file or manifest field to find its generator and tests. The CLI tests include Starlark generator checks.
5. Check whether existing manifests and generated projects still work. Update schema, examples, or CLI docs when their behavior changes.
6. If the change spans contracts or several modules, write an [OpenSpec proposal](01-first-change.md#when-to-write-a-change-proposal) first.

`engine/AGENTS.md` and other `AGENTS.md` files are agent-specific working notes. They can help explain local code, but check their paths and advice against current source and tests before using them as product documentation.

## Change documentation

1. Find the closest existing page and update it instead of starting another copy.
2. Use short headings, numbered steps, and copyable commands.
3. Check relative links from the file you edited.
4. Run only relevant checks. For a docs-only change, check the links and commands you changed; you do not need to run the CLI test suite.
