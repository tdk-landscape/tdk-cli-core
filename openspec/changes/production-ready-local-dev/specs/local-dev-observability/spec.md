# Spec Delta

## Purpose

Existing doctor, up, status, ui, and logs output stays actionable. No new observability command.

## ADDED Requirements

### Requirement: UI shows the same failure as status
`tdk ui` SHALL show the current service failure that `tdk status` shows. This change SHALL NOT add another interactive command.

#### Scenario: Failed dependency is visible
- **WHEN** api cannot reach postgres
- **THEN** `tdk ui` shows postgres not ready and the api error naming postgres

### Requirement: Existing errors say what, why, and what next
A startup, config, or port failure from `tdk doctor` or `tdk up` SHALL state what failed, the cause TDK could detect, and at least one next action. Normal output SHALL NOT include a stack trace. The existing verbose flag SHALL be the only place stack traces appear.

#### Scenario: Port in use
- **WHEN** a service cannot bind its port because another process holds it
- **THEN** `tdk up` names the service, the port, the occupant when known, and the existing TDK port env var

### Requirement: Logs keep the service error
`tdk logs` SHALL remain a bounded snapshot. `--service` SHALL limit output to those Tilt resource names. An unknown service or invalid flag SHALL exit 2. Tilt connection failure SHALL tell the user to run `tdk up`. TDK SHALL NOT drop the service's own error text. Secret values SHALL be redacted in `--json`.

#### Scenario: API logs
- **WHEN** the user runs `tdk logs --service api`
- **THEN** output is scoped to api and includes the service's error lines

#### Scenario: Unknown service
- **WHEN** the user passes a service name Tilt does not know
- **THEN** `tdk logs` exits 2 and names the unknown service

### Requirement: Secrets stay redacted
Doctor JSON, logs JSON, and error output SHALL redact secret values.

#### Scenario: Database URL is secret
- **WHEN** doctor JSON includes a database URL value
- **THEN** the value is redacted
