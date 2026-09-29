## ADDED Requirements

### Requirement: Doctor exact failure and completion messages
The doctor command MUST provide exact, copy-paste single commands for common prerequisite remediation and exact next-step guidance based on project status.

#### Scenario: Docker is not installed
- **WHEN** doctor detects Docker is missing
- **THEN** it reports fix: `See https://docs.docker.com/get-docker/`

#### Scenario: Docker daemon is down
- **WHEN** Docker CLI is present but daemon is unreachable
- **THEN** it reports fix: `Start Docker Desktop, OrbStack, or Colima, then retry: tdk doctor`

#### Scenario: Tilt is missing
- **WHEN** Tilt is not detected on PATH
- **THEN** it reports fix: `curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash`

#### Scenario: Port conflicts
- **WHEN** port 80 is busy
- **THEN** it reports fix: `Stop the process bound to port 80, or stop local nginx/caddy. Then: tdk doctor`
- **WHEN** port 5432 is busy
- **THEN** it reports fix: `Stop local Postgres or change the host port. Then: tdk doctor`

#### Scenario: Project status and outcomes
- **WHEN** outside a project and not a project check fails
- **THEN** it reports fix: `tdk project --yes`
- **WHEN** any check fails
- **THEN** it prints: `Doctor failed. Fix the items above, then run: tdk doctor`
- **WHEN** all checks pass outside a project
- **THEN** it prints: `Doctor passed. Next: tdk project example`
- **WHEN** all checks pass inside a project
- **THEN** it prints: `Doctor passed. Next: tdk up`
- **WHEN** WSL2 is detected (`process.env.WSL_DISTRO_NAME`)
- **THEN** it prints: `WSL2 detected. Use Docker Desktop WSL integration. Guide: docs/wsl2.md`

### Requirement: First-win output after `tdk up`
When `tdk up` successfully launches Tilt, it MUST print a first-win next-steps block.

#### Scenario: `tdk up` launch success
- **WHEN** `tdk up` or `tdk up <stack>` starts Tilt
- **THEN** it prints:
  ```
  TDK is up.
  Tilt UI: http://localhost:10350
  App URLs:
    run: tdk networks
  Stop: tdk down
  ```

### Requirement: Bring-Your-Own resource type
The CLI and engine MUST support `bring-your-own` (and `byo`) resources without generating application code.

#### Scenario: Scaffold bring-your-own service
- **WHEN** running `tdk resource <name> --type bring-your-own --stack <stack>`
- **THEN** it creates `services/<stack>/<name>/service.json` with `appType: "bring-your-own"`
- **AND** it creates `Dockerfile` and `health.conf` stubs only if `--dockerfile` is omitted and none exists
- **AND** it creates `AGENTS.md`
- **AND** it does NOT create `src/`, `package.json`, or test files
- **AND** port defaults to next free in 4000-5999 range unless `--port` is specified

### Requirement: `tdk eject` command
The CLI MUST support an `eject` command to retain Tilt and Docker files while stopping CLI dependency.

#### Scenario: Run eject inside project
- **WHEN** running `tdk eject --yes` inside a valid project
- **THEN** it verifies generated Docker/Tilt outputs and writes `EJECTED.md` at repo root
- **AND** prints exact message:
  ```
  Ejected. Tilt and Docker files are yours.
  Next: tilt up
  Read EJECTED.md
  ```

#### Scenario: Run eject with dry-run
- **WHEN** running `tdk eject --dry-run`
- **THEN** it lists files kept/created without writing `EJECTED.md`
