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
- **AND** it uses port 10350 unless that port is unavailable, in which case it reports the selected Tilt UI port without a trailing slash

### Requirement: Bring-Your-Own resource type
The CLI and engine MUST support `bring-your-own` (and `byo`) resources without generating application code.

#### Scenario: Scaffold bring-your-own service
- **WHEN** running `tdk resource <name> --type bring-your-own --stack <stack>`
- **THEN** it creates `services/<stack>/<name>/service.json` with `appType: "bring-your-own"`
- **AND** when `--image` is absent, it creates a port-matched `Dockerfile` and `health.conf` at the selected Dockerfile path only if that file does not exist
- **AND** it creates `AGENTS.md`
- **AND** it does NOT create `src/`, `package.json`, or test files
- **AND** port defaults to next free in 4000-5999 range unless `--port` is specified
- **AND** `--image <image>` records the exact image and does not create a Dockerfile
- **AND** `--dockerfile <path>` is relative to the resource directory and remains inside it
- **AND** custom stack names are accepted as free-form strings
- **AND** `--no-proxy` disables the Traefik route using the schema-supported `exposeViaProxy: false` field

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

### Requirement: WSL2 is the documented Windows development path
TDK MUST document Ubuntu on WSL2 with Docker Desktop WSL integration as the Windows landscape path and MUST state that native PowerShell/Command Prompt landscape startup is unsupported.

#### Scenario: Windows user follows platform guidance
- **WHEN** a user reads the README or runs `tdk doctor` in WSL2
- **THEN** they are directed to `docs/wsl2.md` and Docker Desktop WSL integration
- **AND** Linux-only quickstart E2E coverage is identified as Linux coverage, not Windows acceptance

### Requirement: Honest product comparison
The comparison page MUST explain when TDK is useful, its tradeoffs, and where Compose, Tilt, or Kubernetes-oriented tools may fit better.

#### Scenario: Reader compares tools
- **WHEN** a reader opens `docs/compare-honest.md`
- **THEN** the page has the headings `TDK and Docker Compose`, `TDK and Tilt`, `TDK and Kubernetes tools`, and `When TDK may not fit`
- **AND** README FAQ links to the page

### Requirement: First-boot evidence template
The repository MUST provide `.github/ISSUE_TEMPLATE/i-booted-tdk.yml` for external users to report first-run evidence.

#### Scenario: User reports a first boot
- **WHEN** a user selects the template
- **THEN** it asks for OS, TDK version, command, result, and friction
- **AND** it reminds users to remove credentials and secrets

### Requirement: Realistic twelve-service shop reference
The repository MUST describe a twelve-application commerce landscape with real responsibilities, dependencies, readiness conditions, and measurement limits; it MUST distinguish the application count from shared infrastructure and generated health-only benchmark fixtures.

#### Scenario: Reader evaluates the reference architecture
- **WHEN** a reader opens `docs/examples/shop-real.md`
- **THEN** they can identify twelve distinct service responsibilities and their stateful/external dependencies
- **AND** the page makes no claim that the described services are already implemented or benchmarked

### Requirement: Cold-boot measurement notes
The repository MUST include a repeatable cold-boot procedure and script that records actual environment versions, Tilt startup time, service health-ready time, and failures without clearing or misrepresenting caches.

#### Scenario: Maintainer records a cold boot
- **WHEN** a maintainer runs `scripts/cold-boot-notes.sh` against a prepared project
- **THEN** it records the environment and measured outcomes in `cold-boot-results/`
- **AND** it preserves failure output and documents that caches are not cleared automatically
