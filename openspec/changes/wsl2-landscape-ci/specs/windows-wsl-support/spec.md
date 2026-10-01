## MODIFIED Requirements

### Requirement: WSL CI does not replace the Ubuntu gate
The WSL2 landscape job SHALL be an additional required gate and SHALL NOT replace the required Ubuntu `example-e2e` gate. The WSL2 job SHALL run on a Windows runner with Ubuntu WSL2 and Docker Desktop WSL integration.

#### Scenario: Both platform gates are required
- **WHEN** CI evaluates changes to the landscape or its platform support
- **THEN** both Ubuntu `example-e2e` and the Windows-hosted WSL2 landscape job are required checks

#### Scenario: WSL2 job is unavailable
- **WHEN** the configured Windows runner cannot provide Ubuntu WSL2 with Docker Desktop integration
- **THEN** the WSL2 job is not treated as passing platform evidence and the Ubuntu `example-e2e` gate remains required
