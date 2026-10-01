## 1. Configure Windows WSL2 CI

- [ ] 1.1 Update the existing `.github/workflows/wsl2-smoke.yml` to trigger on pushes to the default branch as well as pull requests, retaining `windows-2022`, Ubuntu 24.04 WSL2, and Docker Engine inside the distro.
- [ ] 1.2 Ensure the existing WSL2 workflow runs `scripts/wsl2-smoke.sh`, always cleans up after failures, and exposes doctor, startup, and routed health-check output in its logs.
- [ ] 1.3 Configure the existing WSL2 workflow as a required check on the default branch while preserving Ubuntu `example-e2e` as a separate required gate.

## 2. Verify native Windows contract

- [ ] 2.1 Extend the existing `.github/workflows/windows-smoke.yml` to run `tdk --version`, `tdk doctor`, and `tdk up --dry-run` on native Windows AMD64.
- [ ] 2.2 In the existing Windows smoke workflow, run `tdk up shop` and assert non-zero exit, WSL2 Ubuntu guidance, and no container startup.
- [ ] 2.3 Configure the native Windows refusal check as a required default-branch check.

## 3. Publish and verify platform evidence

- [ ] 3.1 Run both jobs on a pull request and resolve runner or smoke failures without weakening the specified checks.
- [ ] 3.2 Link the stable WSL2 workflow history from `docs/wsl2.md` after a successful default-branch run, and label that it tests Docker Engine inside WSL2 rather than Docker Desktop integration.
- [ ] 3.3 Confirm skipped, cancelled, and neutral results do not count as success; keep the rating formula, Job-fit axes, other score axes, and 1.x stability caveat unchanged, and rescore Platforms only for the tested backend after both required jobs succeed and are linked.
