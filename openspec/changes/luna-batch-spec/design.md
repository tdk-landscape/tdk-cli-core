## Context

The user provided an engineering spec ("Rules for Luna") outlining 8 concrete tickets to improve the developer experience and honesty of TDK:
1. Exact fix commands in `tdk doctor`.
2. First-win startup summary block once the Tilt UI port is reachable after `tdk up` begins.
3. Support for `bring-your-own` (`byo`) resources in CLI, schemas, and templates without app code scaffolding.
4. `tdk eject` command with `EJECTED.md` to prevent lock-in.
5. WSL2 first-class path docs & doctor notification; native Windows shell landscape startup is unsupported.
6. Honest comparison doc (`docs/compare-honest.md`).
7. First-boot issue template (`.github/ISSUE_TEMPLATE/i-booted-tdk.yml`).
8. Honest 12-service reference architecture and cold-boot note script.

Strict execution guidelines require touching only designated files, using exact user-facing strings, avoiding unnecessary refactors, and stopping after tickets for review.

## Architecture & Implementation Strategy

### 1. Exact Doctor Fix Strings (`doctor.ts`)
- Audit all CheckResult mappings in `cli/src/commands/doctor.ts` and `cli/src/utils/doctor-runtime.ts`.
- Map exact fix commands:
  - Docker missing -> `See https://docs.docker.com/get-docker/`
  - Docker daemon down -> `Start Docker Desktop, OrbStack, or Colima, then retry: tdk doctor`
  - Tilt missing -> `curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash`
  - Bun missing (only if JS services generated) -> `curl -fsSL https://bun.sh/install | bash`
  - Port 80 busy -> `Stop the process bound to port 80, or stop local nginx/caddy. Then: tdk doctor`
  - Port 5432 busy -> `Stop local Postgres or change the host port. Then: tdk doctor`
  - Not a TDK project -> `tdk project --yes`
- Outcome lines:
  - Fail: `Doctor failed. Fix the items above, then run: tdk doctor`
  - Pass outside project: `Doctor passed. Next: tdk project example`
  - Pass in project: `Doctor passed. Next: tdk up`
- WSL2: If `process.env.WSL_DISTRO_NAME` is set, print `WSL2 detected. Use Docker Desktop WSL integration. Guide: docs/wsl2.md`.

### 2. First-Win Output in `tdk up` (`up.ts`)
- In `cli/src/commands/up.ts`, after Tilt starts successfully, print:
  ```text
  TDK is up.
  Tilt UI: http://localhost:10350
  App URLs:
    run: tdk networks
  Stop: tdk down
  ```
- If networks can be inspected quickly without blocking, include the first 5 URLs; otherwise keep it lightweight without hanging.

### 3. Bring-Your-Own Resource Type (`resource.ts`, schemas, docs)
- Ensure all switches and types handle `"bring-your-own"` cleanly without generating JS/Vite/Hono/package.json.
- Create `services/<stack>/<name>/service.json` with `port` (4000–5999 default or `--port`), `healthCheckPath`, `dockerfile` or `image`.
- Write stub `Dockerfile` (nginx:1.27-alpine) and `health.conf` when `--image` is not supplied and no Dockerfile exists.
- Add `AGENTS.md` note.
- Verify schema in `engine/schemas/service-schema.json`.

### 4. `tdk eject` Command (`eject.ts`)
- Implement `tdk eject [--dry-run] [--yes]` inside project root.
- Verify the generated Tilt output exists; inventory files the user will keep without regenerating or overwriting them during eject.
- Write root `EJECTED.md` with the required exact content.
- Print exact message:
  ```text
  Ejected. Tilt and Docker files are yours.
  Next: tilt up
  Read EJECTED.md
  ```

### 5. Platform, Docs & Comparison
- `docs/wsl2.md` and workflow comment in `.github/workflows/quickstart-e2e.yml`.
- `docs/compare-honest.md` and README link.
- `.github/ISSUE_TEMPLATE/i-booted-tdk.yml`.
- `docs/examples/shop-real.md` describes twelve distinct application responsibilities, dependencies, and meaningful readiness checks without claiming those applications are implemented.
- `docs/cold-boot-shop-real.md` and `scripts/cold-boot-notes.sh` record environment versions, Tilt startup, service health readiness, failures, and cache state without clearing caches or inventing timings.

## Risks & Mitigations
- Divergence of test expectations: tests must strictly verify exact string matches.
- Performance in `up.ts`: running `networks` should be guarded with a fast timeout or non-blocking call so `tdk up` never hangs.
