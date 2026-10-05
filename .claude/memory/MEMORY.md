# Repo memory

Hard-won, repo-specific facts for anyone (human or agent) working here. Keep entries short, dated, and about things the code cannot tell you. Add one line when a small PR or task teaches you a trap; delete lines that stop being true.

## Verify before you push
- Lint and typecheck from `cli/` by exit code, not by `| tail`: `./node_modules/.bin/biome check . ; echo $?` and `./node_modules/.bin/tsc --noEmit ; echo $?`. `npx biome` runs an unrelated v0.3.3 package that exits 0 without checking.
- Run `npm run build` before vitest when `src/` changed: the e2e tests spawn `cli/bin/tdk.js`, which imports `dist/`.
- On Windows, TypeScript preserves CRLF inside multiline template literals in generated `cli/dist` even with `--newLine lf`; normalize emitted files to LF before staging.
- BSD sed (macOS) has no `\b`; use python `re.sub` or perl for renames and confirm with `grep -c`.
- A red test must be red for the right reason: temporarily remove the fix and read the failure. Common ways a test is red wrongly: a JS template literal evaluating `${...}`, JSON `true`/`null` pasted into Starlark (`True`/`None`), a too-narrow regex.
- Do not leave `.skip` on a failing test; fix the code or the setup.

## PR and CI traps
- `cli/dist/` is gitignored but tracked file by file: after `npm run build`, `git add -f` new dist files. A missing one fails `README quickstart on a clean machine` with `ERR_MODULE_NOT_FOUND`.
- Never commit a `cli/node_modules` symlink (`.gitignore` does not match a symlink). It stalls `bun install` and makes Lint/Test/Typecheck look cancelled.
- Open every PR against `main`; no stacked PRs (a stacked PR merged into a squash-merged base never reaches `main`). After a merge, check the files exist on `origin/main`.
- A PR can be squash-merged before your last commit lands: check `gh pr view N --json state` before pushing a follow-up, and open a new PR from `main` if it merged.
- Test job limit was 1 minute until #407; a job "cancelled" at exactly the limit is a timeout, read the step log before rerunning. `wsl2-smoke` can fail inside `setup-wsl` (wsl.exe 403): rerun.
- Pinned hashes in `resource-backend-languages.test.ts` change when scaffold output changes; re-capture them on purpose and say why in the test comment.

## Engine and generators
- A changed `.star` file reaches a running container only after re-vendoring (`tdk project --yes`), a Tiltfile content change, and an image rebuild. Byte-identical output logs `Skipping ... (no changes)`.
- Check a BYO example through `tdk up` (`scripts/verify-byo-tdk.sh`), not only a standalone `docker run`: TDK adds a `Host: api.<project>.localhost` header, a Postgres `DATABASE_URL`, and its own bind expectations.
- Do not make a service run its own migrations to prove a database path works (2026-10-04, #533): a fixture whose `index.ts` ran `bunx prisma migrate deploy` crashed in CI with `Cannot find module '@prisma/engines'`, then looped until the script timed out. Use a `migrator` resource and check Postgres, migrator, API order through `tdk up`.
- Say only what a run observed; mark everything else "not run" in docs and PRs.
- Resource scaffolds must write current keys (`dependsOn`, `healthCheckPath`); `tdk doctor` warns on deprecated and unknown ones.
- Env and secrets: no JWT in generated files; Compose takes `JWT_SECRET` from the project `.env`; `completeEnvFile` appends missing keys and never rotates.

## Housekeeping
- Verification scripts must remove every tag of `app_<project>` images (Tilt adds a `tilt-<hash>` tag) and the project's containers and networks.
- `PAGES_SYNC_TOKEN` is not set, so the schema publish workflow succeeds but does nothing.
