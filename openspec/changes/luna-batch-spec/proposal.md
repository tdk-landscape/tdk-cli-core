## Why

To make TDK honest, pragmatic, and reliable for developers adopting or evaluating it, the CLI must provide exact, actionable fix instructions on failure, support orchestrating existing services without generating boilerplate ("bring-your-own"), provide an off-ramp command (`tdk eject`) to retain generated Docker/Tilt assets without lock-in, clarify platform support (WSL2 first-class, Windows native unsupported), and present transparent comparisons and real-world 12-service reference architecture rather than marketing benchmarks.

## What Changes

1. **Ticket 3 — Doctor exact fix commands**: Update `cli/src/commands/doctor.ts` to output exact, single copy-paste commands for missing prerequisites (Docker, daemon down, Tilt, Bun, ports 80/5432, project init) and exact final outcome lines.
2. **Ticket 6 — First-win output after `tdk up`**: Output honest startup summary (`TDK is up.`, `Tilt UI: http://localhost:10350`, `App URLs: run: tdk networks`, `Stop: tdk down`, and optionally fast URLs).
3. **Ticket 1 — Bring-your-own (`bring-your-own` / `byo`) resource type**: Support `--type bring-your-own` / `byo` without app scaffolding, writing Dockerfile/health.conf stubs or using `--image`, schema extensions, discovery integration, and docs.
4. **Ticket 2 — `tdk eject` command**: Provide `tdk eject [--dry-run] [--yes]` leaving Tiltfile and Docker/compose files with root `EJECTED.md`.
5. **Ticket 4 — WSL2 first-class path**: Document Ubuntu on WSL2 with Docker Desktop integration in `docs/wsl2.md`, detect `process.env.WSL_DISTRO_NAME` in doctor, state that native PowerShell/Command Prompt landscape startup is unsupported, update README Windows line, and annotate `.github/workflows/quickstart-e2e.yml` as Linux-only.
6. **Ticket 7 — Honest compare page**: Add `docs/compare-honest.md` comparing TDK vs Docker Compose vs raw Tilt with known limits, and link from README FAQ.
7. **Ticket 8 — External-user evidence template**: Add `.github/ISSUE_TEMPLATE/i-booted-tdk.yml` for first-run community show-and-tell reports.
8. **Ticket 5 — Honest 12-service reference spec & cold boot script**: Provide `docs/examples/shop-real.md`, `docs/cold-boot-shop-real.md`, and `scripts/cold-boot-notes.sh`.

## Capabilities

### New Capabilities
- `doctor-exact-fixes`: Exact single-command remedies for all standard doctor prerequisite failures and consistent next-step lines.
- `tdk-up-first-win`: Concise post-startup next-steps block highlighting Tilt UI, network URLs, and stop command.
- `bring-your-own-resource`: Orchestration of un-scaffolded services via user Dockerfile or external image without code generation.
- `tdk-eject`: Clean self-ejection to standalone Docker and Tilt orchestration with `EJECTED.md`.
- `wsl2-support-path`: Documented and detected Ubuntu-on-WSL2 environment.
- `honest-evaluations-and-examples`: Honest comparison documentation, realistic shop reference topology spec, and community boot report template.

## Non-goals

- Refactoring unrelated CLI subsystems or changing engine internals unnecessarily.
- Supporting native Windows Command Prompt / PowerShell.
- Adding Go/Python/Rust app generators.
- Generating 100 fake microservice stubs.
- Premium features or paywalls.

## Impact

- CLI commands: `cli/src/commands/doctor.ts`, `cli/src/commands/up.ts`, `cli/src/commands/resource.ts`, `cli/src/commands/eject.ts`, `cli/src/cli.ts`.
- Engine & types: `engine/schemas/service-schema.json`, `cli/src/types/index.ts`, `cli/src/utils/constants.ts`, `cli/src/utils/resource-features.ts`.
- Documentation & Workflows: `README.md`, `cli/README.md`, `docs/wsl2.md`, `docs/byo.md`, `docs/compare-honest.md`, `docs/examples/shop-real.md`, `docs/cold-boot-shop-real.md`, `.github/ISSUE_TEMPLATE/i-booted-tdk.yml`, `.github/workflows/quickstart-e2e.yml`.
