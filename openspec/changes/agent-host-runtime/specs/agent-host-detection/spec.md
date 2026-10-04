## ADDED Requirements

### Requirement: Doctor reports the host kind
`tdk doctor` SHALL detect Dev Container (`REMOTE_CONTAINERS` or `/.dockerenv` plus a devcontainer marker), Codespaces (`CODESPACES`), WSL2, and WebContainer (`process.versions.webcontainer`), and SHALL report the host kind and whether the Docker socket is usable, in both human and `--json` output.

#### Scenario: Doctor runs in a Dev Container
- **WHEN** doctor runs with `REMOTE_CONTAINERS` set
- **THEN** the report names the host kind `devcontainer` and states whether Docker is reachable

### Requirement: Missing Docker in a Dev Container gets Dev Container remediation
When Docker is unreachable inside a Dev Container or Codespace, `tdk up` SHALL exit non-zero with remediation for mounting the Docker socket or enabling docker-outside-of-docker, not a Docker Desktop installation instruction.

#### Scenario: No Docker socket in a Dev Container
- **WHEN** `tdk up` runs in a Dev Container without a reachable Docker engine
- **THEN** it exits non-zero, prints the Dev Container remediation, and does not start Tilt

### Requirement: WebContainers cannot run the stack
When `process.versions.webcontainer` is set, `tdk doctor --json` SHALL set `canUp: false` and link the docs, and `tdk up` SHALL exit non-zero without starting Tilt.

#### Scenario: Doctor in a WebContainer
- **WHEN** doctor runs in a WebContainer
- **THEN** `canUp` is false and no Tilt process is spawned
