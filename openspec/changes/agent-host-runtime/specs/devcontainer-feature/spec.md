## ADDED Requirements

### Requirement: Reference Dev Container ships with the repo
The repository SHALL ship `.devcontainer/devcontainer.json` that installs the TDK binary on PATH and reaches a host Docker engine through docker-outside-of-docker. Documentation SHALL state that socket-mounted Docker is privileged and is the only supported engine path.

#### Scenario: Contributor opens the repo in a Dev Container
- **WHEN** the container starts
- **THEN** `tdk --version` and `tdk doctor` succeed with Docker reachable

### Requirement: Consumer template is opt-in
`tdk project` SHALL emit a Dev Container template only when a flag requests it; the default output SHALL be unchanged.

#### Scenario: Default project creation
- **WHEN** `tdk project` runs without the flag
- **THEN** no `.devcontainer` directory is created

### Requirement: Forwarded ports come from status
Documented `forwardPorts` guidance SHALL be derived from `tdk status --json`, not hard-coded to the Tilt UI port.

#### Scenario: Stack with several services
- **WHEN** a stack is running
- **THEN** the documented procedure lists every service host port reported by `status --json`
