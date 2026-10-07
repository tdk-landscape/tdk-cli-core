# Design

## Context
Importer #9 and #10 are merged at d335c0e. npm 0.1.0 predates the safeguards. Core 1.3.104 already contains buildContext.

## Decisions
Bump importer package.json to 0.1.1 and read that version for the CLI --version flag. Build, typecheck, lint, and test before merging the release commit. Tag the merged importer source v0.1.1; the tag must descend from both merged PRs. Use the existing core Publish tdk-import workflow with ref=v0.1.1 and dry_run=false. Its isolated build job packs the tarball, and only the publishing job receives NPM_TOKEN.

Verify the registry tarball from a fresh npm cache, including its integrity against the workflow artifact. Exercise both unsupported types with and without dry-run, mixed Python/Node Procfile, and an all-skipped Procfile. Record stdout, stderr, exit codes, and generated files. Pin both README and runbook commands to 0.1.1 and retain the docs-only core version gate.

## Release handling
Do not overwrite an existing npm version or move an existing tag. Verify an existing 0.1.1 if present. A failed publish leaves the docs gate in place until registry verification succeeds.
