# Doctor readiness contract

`tdk doctor` and `tdk doctor --json` use the same readiness decision:

| Exit | Meaning |
| --- | --- |
| 0 | Ready; non-blocking warnings and skipped checks are permitted. |
| 1 | One or more blocking findings, including native Windows boot refusal. |
| 2 | Invalid command arguments or an unexpected check failure. |

`--strict` makes the WSL `/mnt/c` placement check blocking. Native Windows retains the existing WSL2 Ubuntu guidance until real Docker Desktop boot acceptance passes. This change does not establish native Windows boot support.

JSON stdout contains exactly one document: `schemaVersion: 1`, `data: {ready, inProject, checks}`, and `errors`. Each check has `name`, `didPass`, `message`, optional `fix`, `isWarning`, and `isSkipped`. Structured errors contain a `USAGE` or `INTERNAL` code and a message; blocking environment findings belong in checks rather than errors. Diagnostic text goes to stderr. Missing/unknown options exit 2; `--help` exits 0 with normal help text.

`--ping-timeout` accepts a positive safe integer in milliseconds; fractional values, unit suffixes, and zero are rejected before any probes run. Concurrent machine probes always settle before the command exits, including when one check throws.

Migration: invalid timeout previously exited 1, and unexpected errors had no stable doctor contract. CI should now distinguish 1 (fix the environment) from 2 (fix invocation or investigate a check failure). Existing successful and blocking environment exits remain 0 and 1. The new JSON flag is additive; text output remains available.

JSON schema changes are additive within schema version 1. Removing/renaming fields or changing their meaning requires an explicit versioned transition and migration documentation. Consumers should ignore unknown fields and reject unsupported schema versions.
