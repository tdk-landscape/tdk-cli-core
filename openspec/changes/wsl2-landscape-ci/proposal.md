## Why

The WSL2 guide and smoke script do not prove that Windows can boot the landscape; the existing quickstart E2E runs only on Ubuntu. A required green WSL2 CI result using the runner path available today, plus a native Windows refusal check, provide evidence for that tested path while keeping the rating formula, other score axes, and the 1.x stability caveat unchanged.

## What Changes

- Run `scripts/wsl2-smoke.sh` on the GitHub-hosted `windows-2022` runner with Ubuntu 24.04 WSL2 and Docker Engine installed inside the distro, and require the job as a merge gate. This validates that CI runtime path only; Docker Desktop WSL integration remains untested and receives no platform evidence from this job.
- Run native Windows AMD64 checks for `tdk --version`, `tdk doctor`, `tdk up --dry-run`, and verify that `tdk up shop` exits non-zero without starting containers and points users to WSL2 Ubuntu.
- Link the successful WSL2 workflow history from `docs/wsl2.md` with a clear note that CI uses Docker Engine inside WSL2 and does not test the guide's Docker Desktop integration path.
- Preserve the current rating formula, Job-fit axes, other score axes, and the 1.x stability caveat.

## Capabilities

### New Capabilities
- `wsl2-landscape-ci`: Required CI evidence for landscape boot using Docker Engine inside Ubuntu WSL2 and native Windows refusal.

### Modified Capabilities
- `windows-wsl-support`: Replace the conditional/report-only WSL CI policy with the required WSL2 landscape gate and documented evidence link.

## Impact

- GitHub Actions workflow configuration for the hosted `windows-2022` runner, Ubuntu 24.04 WSL2, and Docker Engine inside the distro.
- `scripts/wsl2-smoke.sh`, native Windows CLI checks, and `docs/wsl2.md` evidence link.
- Platforms evidence only; the rating formula and all other axes remain unchanged.
