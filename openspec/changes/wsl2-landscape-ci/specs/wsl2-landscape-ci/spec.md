## ADDED Requirements

### Requirement: WSL2 landscape boot is a required CI result
A required GitHub Actions job SHALL run `scripts/wsl2-smoke.sh` on the GitHub-hosted `windows-2022` runner using Ubuntu 24.04 WSL2 and Docker Engine installed inside the distro. The smoke SHALL boot the bundled example and verify its routed health URL. Only a job conclusion of `success` on the default branch counts as evidence for the tested WSL2 plus Docker Engine path. This job SHALL NOT be represented as testing Docker Desktop WSL integration, which remains unverified.

#### Scenario: WSL2 landscape job passes
- **WHEN** the required WSL2 job completes on the default branch
- **THEN** its log shows doctor, `tdk up`, and a successful health check against the routed URL
- **AND** `docs/wsl2.md` links to the workflow history and identifies Docker Engine inside WSL2 as the tested backend
- **AND** the link does not claim that Docker Desktop integration was tested

#### Scenario: Only local WSL2 assets exist
- **WHEN** `scripts/wsl2-smoke.sh` and `docs/wsl2.md` exist but no required green WSL2 job exists on the default branch
- **THEN** the Platforms evidence remains at 3

#### Scenario: WSL2 workflow did not succeed
- **WHEN** the WSL2 workflow is skipped, cancelled, neutral, or has any conclusion other than `success`
- **THEN** it does not count as green evidence and Platforms remains at 3

### Requirement: Native Windows CI verifies inspection and refusal behavior
A native Windows AMD64 job SHALL run `tdk --version`, `tdk doctor`, and `tdk up --dry-run`. It SHALL then run `tdk up shop` and verify that the command exits non-zero, prints guidance to use WSL2 Ubuntu, and does not start containers.

#### Scenario: Native Windows landscape startup is refused
- **WHEN** the native Windows CI job runs `tdk up shop`
- **THEN** the command exits non-zero, directs the user to WSL2 Ubuntu, and starts no containers

### Requirement: Platform rescore is gated on main-branch evidence
Platforms SHALL move from 3 to 5 for the tested Ubuntu 24.04 WSL2 plus Docker Engine inside WSL2 path only after both the required WSL2 landscape job and the native Windows refusal job have conclusion `success` on the default branch and the WSL2 workflow history is linked from `docs/wsl2.md` with its backend clearly identified. This result SHALL NOT be used to claim or score Docker Desktop WSL integration as tested. A rescore SHALL leave other axes and the rating formula unchanged. With all other axes unchanged, the expected rescore is Job-fit 8.0, Adoptability 6.5, and headline 7.2.

#### Scenario: Both platform jobs succeed and are linked
- **WHEN** both required jobs conclude `success` on the default branch and the WSL2 workflow history is linked with the tested backend identified
- **THEN** Platforms may be scored 5 for the tested WSL2 plus Docker Engine path only, and the expected unchanged-axis rescore is Job-fit 8.0, Adoptability 6.5, headline 7.2

#### Scenario: Platform jobs are absent or not green
- **WHEN** either required job is missing or not green on the default branch
- **THEN** Platforms remains 3 and the headline remains 6.6 with all other axes unchanged

#### Scenario: Either platform job is skipped, cancelled, or neutral
- **WHEN** either required job concludes `skipped`, `cancelled`, or `neutral`
- **THEN** the jobs are not both successful evidence, Platforms remains 3, and the headline remains 6.6 with all other axes unchanged
