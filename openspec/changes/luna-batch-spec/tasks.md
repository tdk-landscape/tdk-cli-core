## 1. Ticket 3 — Doctor exact fix commands
- [x] 1.1 Update `cli/src/commands/doctor.ts` and `cli/src/utils/doctor-runtime.ts` fix strings to exact specified commands.
- [x] 1.2 Update pass / fail next-step strings (`Next: tdk project example`, `Next: tdk up`, `Fix the items above, then run: tdk doctor`).
- [x] 1.3 Add/update doctor tests to assert exact strings.

## 2. Ticket 6 — First-win output after `tdk up`
- [x] 2.1 Add exact first-win output block in `cli/src/commands/up.ts` upon successful Tilt launch.
- [x] 2.2 Add unit test verifying the success printer contains `Tilt UI:` and `tdk networks`.

## 3. Ticket 1 — Bring-your-own resource type
- [x] 3.1 Verify and complete `cli/src/commands/resource.ts` BYO behavior (`AGENTS.md`, `health.conf` nginx stub, exact ports and help text).
- [x] 3.2 Ensure `docs/byo.md` and `cli/README.md` are up to date and match spec.
- [x] 3.3 Ensure all tests in `cli/src/commands/__tests__/resource-byo.test.ts` pass cleanly.

## 4. Ticket 2 — `tdk eject`
- [x] 4.1 Create `cli/src/commands/eject.ts` with `--dry-run` and `--yes` support, checking for `.tdk/project.json`.
- [x] 4.2 Register `eject` in `cli/src/cli.ts` and document in `cli/README.md`.
- [x] 4.3 Add unit tests for `tdk eject` covering missing project, dry-run, and write behavior.

## 5. Ticket 4 — WSL2 first-class path
- [x] 5.1 Create `docs/wsl2.md`.
- [x] 5.2 Update README line regarding Windows native / WSL2.
- [x] 5.3 Annotate `.github/workflows/quickstart-e2e.yml`.

## 6. Ticket 7 — Compare page that includes failure cases
- [x] 6.1 Create `docs/compare-honest.md` with exact headings.
- [x] 6.2 Link from README FAQ.

## 7. Ticket 8 — External-user evidence template
- [x] 7.1 Create `.github/ISSUE_TEMPLATE/i-booted-tdk.yml`.

## 8. Ticket 5 — Honest 12-service example spec
- [x] 8.1 Create `docs/examples/shop-real.md`.
- [x] 8.2 Create `docs/cold-boot-shop-real.md`.
- [x] 8.3 Create `scripts/cold-boot-notes.sh`.

## 9. Verification
- [x] 9.1 Run typecheck and linting across the codebase.
- [x] 9.2 Run relevant unit test suites.
