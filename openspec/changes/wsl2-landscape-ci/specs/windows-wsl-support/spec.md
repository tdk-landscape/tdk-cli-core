## MODIFIED Requirements

### Requirement: WSL CI does not replace the Ubuntu gate
The existing `.github/workflows/wsl2-smoke.yml` SHALL be an additional required gate and SHALL NOT replace the required Ubuntu `example-e2e` gate. It SHALL run on pull requests and pushes to the default branch using the GitHub-hosted `windows-2022` runner with Ubuntu 24.04 WSL2 and Docker Engine inside the distro. Its result SHALL NOT be represented as testing Docker Desktop WSL integration.

#### Scenario: Both platform gates are required
- **WHEN** CI evaluates changes to the landscape or its platform support
- **THEN** both Ubuntu `example-e2e` and the existing `windows-2022` WSL2 smoke workflow are required checks

#### Scenario: WSL2 job is unavailable
- **WHEN** the configured `windows-2022` runner cannot provide Ubuntu 24.04 WSL2 with Docker Engine inside the distro
- **THEN** the WSL2 job is not treated as passing platform evidence and the Ubuntu `example-e2e` gate remains required
