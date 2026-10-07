# Design

## Context

Three existing commands are not the same operation:

| Command | Reads | Writes | Does not do |
| --- | --- | --- | --- |
| `tdk config regenerate` | `.tdk/project.json` | generated master files | edit `service.json`, import a repo |
| `tdk config migrate` | `service.json` | `schemaVersion` on those files | rewrite Docker or Tilt files |
| `tdk import` | a directory, via `tdk-import` | whatever `tdk-import` writes | call regenerate or migrate |

`tdk config verify` compares generated files with `.tdk/project.json`. Its fix line is `tdk config regenerate`. Doctor already returns `schemaVersion: 1`, `data.ready`, `data.checks`, and `errors`. Exit codes are 0 ready, 1 blocking, 2 usage or internal.

## Goals / Non-Goals

- Goals: those three commands stay distinct. Repeated regenerate is byte-identical. Migrate does not touch generated files. Import failure is not reported as drift.
- Non-Goals: a new command, merging the three into one, a new doctor JSON shape, native Windows runtime.

## Decisions

- Drift is fixed only by `tdk config regenerate`. Schema lag is fixed only by `tdk config migrate`. Bringing an existing repo in is only `tdk import`.
- Regenerate `--dry-run` writes nothing. Migrate writes `service.json` only when the schema version is missing and the file validates. An unsupported `schemaVersion` fails with no write.
- Import stays a pass-through to `github:tdk-landscape/tdk-import`. Exit code passes through. npx failure stays exit 127.

## Risks / Trade-offs

- Issue #661 says `tdk generate` and `tdk migrate`. Those names are not the CLI. The spec uses the existing command names so the three operations stay distinct.

## Migration Plan

No command renames. No JSON shape change.

## Open Questions

- None that block this change.
