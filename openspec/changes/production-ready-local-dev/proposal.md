# Proposal

## Why

`tdk doctor`, `tdk up`, `tdk status`, `tdk ui`, `tdk logs`, `tdk config verify`, and `tdk config regenerate` already exist. Their results are not stable enough to trust: doctor JSON and human output can be read as different contracts, generation can drift, and a second `tdk up` can be unclear. This change locks those commands. It does not add commands. Issue: https://github.com/tdk-landscape/tdk-cli-core/issues/661

## What Changes

- Lock `tdk doctor`: existing exit codes, existing outcome lines, and the existing JSON envelope (`schemaVersion`, `data.ready`, `data.checks`, `errors`).
- Lock generation on `tdk config verify` and `tdk config regenerate`. Same inputs, same bytes. No `tdk generate`.
- Lock `tdk up` so a second run does not create a second environment, and a partial start names the failed dependency.
- Lock `tdk status`, `tdk ui`, and `tdk logs` so they report the same service outcome and do not hide the underlying error.
- Keep native Windows inspection-only. Keep `TDK_HTTP_PORT`, `TDK_HTTPS_PORT`, and `TDK_POSTGRES_PORT`.

## Capabilities

### New Capabilities

- `service-runtime-state`: One ready/not-ready outcome shared by `tdk up`, `tdk status`, and `tdk ui`.
- `local-dev-observability`: Stable errors, port reporting, and redaction on existing doctor, up, status, ui, and logs output.
- `local-dev-reproducibility`: Shared version floors, no silent config rewrite, fixtures that lock current commands.

### Modified Capabilities

- `tdk-environment-doctor`: Doctor's current checks, exit codes, and JSON envelope stay the contract.
- `tdk-up-lifecycle`: Repeated `tdk up` and interrupted `tdk up` leave a recoverable environment.
- `generated-config-safety`: `tdk config verify` stays the drift check, and its result is byte-stable.

## Impact

- CLI: existing doctor, up, down, status, ui, logs, config verify, config regenerate. No new command names.
- Generator: stable ordering, no timestamps or machine paths, existing regenerate header.
- Out of scope: new commands, a lock file, Kubernetes, replacing Docker or Tilt, native Windows runtime.
