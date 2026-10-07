# Proposal

## Why

`tdk doctor`, `tdk up`, `tdk status`, `tdk ui`, `tdk logs`, `tdk config verify`, `tdk config regenerate`, `tdk config migrate`, and `tdk import` already exist. Their results are not stable enough to trust, and regenerate, migrate, and import are easy to confuse. This change locks those commands. It does not add commands. Issue: https://github.com/tdk-landscape/tdk-cli-core/issues/661

## What Changes

- Lock the three config commands as separate operations:
  - `tdk config regenerate` rewrites generated files from `.tdk/project.json`. It does not edit `service.json`.
  - `tdk config migrate` writes `schemaVersion` on `service.json`. It does not rewrite Docker or Tilt files.
  - `tdk import` runs `tdk-import`. It does not regenerate or migrate.
- Lock `tdk config verify` as the drift check for generated files. The fix hint stays `tdk config regenerate`.
- Lock `tdk doctor` exit codes, outcome lines, and the JSON envelope `{ schemaVersion, data.ready, data.checks, errors }`.
- Lock `tdk up` so a second run does not create a second environment.
- Lock `tdk status`, `tdk ui`, and `tdk logs` so they agree on a failed service.

## Capabilities

### New Capabilities

- `config-command-boundaries`: Regenerate, migrate, and import do not call each other.
- `service-runtime-state`: One ready/not-ready outcome shared by `tdk up`, `tdk status`, and `tdk ui`.
- `local-dev-observability`: Stable errors, port reporting, and redaction on existing commands.
- `local-dev-reproducibility`: Shared version floors and fixtures that lock current commands.

### Modified Capabilities

- `tdk-environment-doctor`: Doctor's current checks, exit codes, and JSON envelope stay the contract.
- `tdk-up-lifecycle`: Repeated `tdk up` and interrupted `tdk up` leave a recoverable environment.
- `generated-config-safety`: `tdk config verify` stays the drift check, and regenerate output is byte-stable.

## Impact

- CLI: existing doctor, up, status, ui, logs, config verify, config regenerate, config migrate, import. No new command names.
- Out of scope: new commands, a lock file, Kubernetes, replacing Docker or Tilt, native Windows runtime.
