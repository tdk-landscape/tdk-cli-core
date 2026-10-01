## 1. Configure Windows WSL2 CI

- [ ] 1.1 Update the WSL2 GitHub Actions job to use the hosted `windows-2022` runner, Ubuntu 24.04 WSL2, and Docker Engine inside the distro, then run `scripts/wsl2-smoke.sh` inside Ubuntu.
- [ ] 1.2 Ensure the WSL2 workflow always cleans up the landscape after failures and exposes doctor, startup, and routed health-check output in its logs.
- [ ] 1.3 Configure the WSL2 job as a required default-branch check while preserving Ubuntu `example-e2e` as a separate required gate.

## 2. Verify native Windows contract

- [ ] 2.1 Add a native Windows AMD64 job that runs `tdk --version`, `tdk doctor`, and `tdk up --dry-run`.
- [ ] 2.2 In the native job, run `tdk up shop` and assert non-zero exit, WSL2 Ubuntu guidance, and no container startup.
- [ ] 2.3 Configure the native Windows refusal job as a required default-branch check.

## 3. Publish and verify platform evidence

- [ ] 3.1 Run both jobs on a pull request and resolve runner or smoke failures without weakening the specified checks.
- [ ] 3.2 Link the stable WSL2 workflow history from `docs/wsl2.md` after a successful default-branch run, and label that it tests Docker Engine inside WSL2 rather than Docker Desktop integration.
- [ ] 3.3 Confirm skipped, cancelled, and neutral results do not count as success; keep the rating formula, Job-fit axes, other score axes, and 1.x stability caveat unchanged, and rescore Platforms only for the tested backend after both required jobs succeed and are linked.
