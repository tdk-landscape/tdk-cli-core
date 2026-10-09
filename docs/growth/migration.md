# Delivery and compatibility plan

Plan for [#990](https://github.com/tdk-landscape/tdk-cli-core/issues/990), based on
source inspection on 9 October 2026. This document supplies follow-up scope and
acceptance criteria. It does not select a name or change runtime behavior.

## Inventory of affected surfaces

| Surface | Current source | Migration consideration |
| --- | --- | --- |
| Public npm package | [Root package.json](../../package.json), [release workflow](../../.github/workflows/release-binaries.yml) | The public package is `@tdk-landscape/tdk-cli-core`; both `tdk` and `tdk-cli` are exported. The private workspace [cli/package.json](../../cli/package.json) is not the public package identity |
| Command identity and assets | [platform.ts](../../cli/src/utils/platform.ts), [release-binaries.sh](../../scripts/release-binaries.sh) | OS-specific `tdk-*` filenames, Windows executable name, bundled `tdk-cli/` directory, engine archive, and checksum entries must agree |
| Self-upgrade | [upgrade.ts](../../cli/src/commands/upgrade.ts) | Installation detection recognizes `tdk`/`tdk.exe`; release repository and engine asset names are hardcoded. Old versions must still find compatible releases |
| Shell completion | [completion.ts](../../cli/src/commands/completion.ts) | Scripts register `tdk` and invoke it to obtain dynamic values. A renamed command must call its own installation, not another `tdk` on the path |
| Project discovery and storage | [paths.ts](../../cli/src/utils/paths.ts), [project.ts](../../cli/src/commands/project.ts) | `.tdk/project.json` and `.tdk/.tdk-out/` locate existing projects and generated assets; these are compatibility contracts |
| Schema and version fields | [project schema](../../engine/schemas/project-schema.json), [upgrade guide](../upgrading.md) | `minTdkVersion` and schema URLs have existing consumers; changing the product name does not require changing the schema format |
| Environment variables | [constants.ts](../../cli/src/utils/constants.ts), [environment guide](../environment.md) | `TDK_*` settings may be present in user scripts, `.env`, and generated outputs. Preserve reads during the identity transition |
| Agent and machine consumers | [MCP command](../../cli/src/commands/mcp.ts), [MCP tools](../../cli/src/mcp/tools.ts), [machine-readable contract](../reference/machine-readable-cli.md) | Server identity is currently `tdk`; changing executable spelling must not silently change tool names or JSON contracts |
| Importer | [import.ts](../../cli/src/commands/import.ts) | Uses the sibling `tdk-import` project and `TDK_IMPORT_PACKAGE`; coordinate its lifecycle separately |
| Website, releases, and ecosystem | Links in [README](../../README.md), [release workflow](../../.github/workflows/release-binaries.yml), and [schema ID](../../engine/schemas/project-schema.json) | Coordinate website, install script, release repository, examples, editor schemas, and integrations across repositories |

Source files describe compatibility requirements; the migration scenarios below
have not been implemented or run. Existing release signatures include repository
and workflow identity. A repository move must account for historical verification
instructions as well as ordinary URL redirects.

## Delivery sequence

Owner roles below are proposed responsibilities. No person is assigned yet. Turn
each accepted row into a linked implementation issue after the name decision.

| Phase | Proposed owner role | Deliverable | Acceptance criteria |
| --- | --- | --- | --- |
| 1. Agree on category and name | Maintainers + growth owner | Accepted category, descriptor, candidate checks, and identity record | Record the decision in #990 or its PR; identify unresolved namespace and language checks |
| 2. Add command compatibility | CLI + packaging owners | New canonical executable and an explicit legacy-compatibility path | New command opens existing projects; old scripts still have a supported route; install never silently replaces another project's `tdk` |
| 3. Coordinate distribution | Release owner + sibling-repo maintainers | npm identity, binaries, archives, checksums, signatures, installer, and upgrade bridge | Fresh and upgrade installs work for each supported installation method; older supported versions can find the documented bridge |
| 4. Publish positioning and migration docs | Documentation + website owners | Matching category language, install examples, migration guide, redirects, and changelog | Every public entry point names the canonical command and explains the legacy path; pinned versions and old verification instructions remain usable |
| 5. Measure adoption and retire aliases | Growth + CLI owners | Real pilot results and a published support/removal schedule | Review actual results; announce any removal in a release with an explicit end date and an upgrade route |

## Canonical command and legacy alias

The renamed package should install the new canonical command. A legacy `tdk`
shim should be an explicit compatibility choice, not an automatically installed
second command that reproduces the existing collision. The current package
exports both `tdk` and `tdk-cli`; simply adding a third name to that package does
not resolve the two old names' overlap.

Before installing a compatibility shim, detect existing target executables and
explain which installation owns them. Do not assume any existing `tdk` belongs
to this project. A user can choose a project-local pinned dependency or explicit
executable path when different CLIs must coexist.

The new command, compatibility shim, and completion script must resolve the
intended installation consistently. Avoid wrappers that call an unqualified
`tdk` and accidentally select a dictionary or data-workflow CLI.

## Preserve project compatibility during the identity transition

Read existing `.tdk/project.json`, `minTdkVersion`, and `TDK_*` settings during
the rename. Keep data and generated-file discovery consistent. If maintainers
later want storage names to follow the new brand, handle that as a separate
format migration with explicit precedence and rollback rules.

Do not recreate a project's `.env`, reset database volumes, rename Docker
resources, or regenerate user-owned files merely to change the brand. A renamed
CLI must discover the same project rather than launch a second local environment.

Publish a bridge before moving release locations or changing filenames that old
`tdk upgrade` versions request. Preserve historical tags, checksums, and signature
verification instructions. A redirect alone does not ensure an old updater can
recognize a newly named binary or archive.

## Required implementation validation

These are acceptance scenarios for later code PRs, not claims of tests run for
this documentation change.

- Install the new package and binary on Linux, macOS, and native Windows;
  verify the existing native-Windows inspection boundary and WSL2 startup path.
- Upgrade supported old npm and standalone installations through the published
  bridge. Check both working and missing-release failure paths.
- Open an existing `.tdk/project.json` with the renamed command and verify
  configuration discovery, `minTdkVersion`, environment settings, and unchanged
  machine-readable output.
- Put a different `tdk` earlier on the path. Verify the new command and its
  completion script use the correct installation; verify the compatibility
  installer detects conflicts rather than overwriting the other executable.
- Verify new and legacy release assets against their declared checksums and
  signatures, including failures for mismatched assets.
- Exercise MCP and importer entry points from existing client configuration.
- Demonstrate rollback to the pinned pre-transition version against the same
  project, without modifying application data or secrets.

For runtime checks, use uniquely named scratch stacks to avoid collisions with
other local projects, following [repository memory](../../.claude/memory/MEMORY.md).
Run the checks required by [the PR guide](../contributing/03-open-a-pr.md) for the
files actually changed.

## Decision and issue status

This package contains a proposal based on repository sources and public internet research.
The ten source comments are documented in [public-feedback.md](public-feedback.md);
they are not ten direct TDK interviews. The accepted category and name, assigned
owners, implementation issues, and migration validation remain open under #990.
