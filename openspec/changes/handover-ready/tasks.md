## 1. Drift gate

- [x] 1.1 Reuse `tdk config verify` logic as a pre-Tilt step in `tdk up`; exit 2 naming drifted files and printing `tdk config regenerate`.
- [x] 1.2 Add `--ignore-drift` with a warning.
- [x] 1.3 Tests: hand-edited Dockerfile (exit 2, Tilt not started) and clean tree.

## 2. Import or refuse

- [x] 2.1 Restrict `tdk import` detection to Compose, Dockerfile, `package.json` scripts, Procfile; list everything else as skipped.
- [x] 2.2 Exit 2 with a named message when nothing importable is found (e.g. Helm only); write nothing.
- [x] 2.3 Ensure `--dry-run` prints the plan and writes no files.
- [x] 2.4 Tests: two-service Compose dry-run; Helm-only refusal.

## 3. Operator runbook

- [x] 3.1 Write one runbook page: install matrix, pinned Docker/Tilt versions from `tdk doctor`, release + `checksums.txt` steps, license-key behavior.
- [x] 3.2 Verify unset/expired `TDK_LICENSE_KEY` still runs `tdk up` and premium commands print a key-needed message.

## 4. Adopters

- [x] 4.1 Add `ADOPTERS.md` stating there are no external adopters; list no example repos or authors.

## 5. Acceptance

- [ ] 5.1 `openspec validate handover-ready --strict` passes.
