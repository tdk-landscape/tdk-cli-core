## Why

The WSL2 guide and smoke script do not prove that Windows can boot the landscape; the existing quickstart E2E runs only on Ubuntu. A required green WSL2 CI result and a native Windows refusal check provide the missing platform evidence while keeping the rating formula, other score axes, and the 1.x stability caveat unchanged.

## What Changes

- Run `scripts/wsl2-smoke.sh` on a Windows GitHub Actions runner with Ubuntu WSL2 and Docker Desktop WSL integration, and require the job as a merge gate.
- Run native Windows AMD64 checks for `tdk --version`, `tdk doctor`, `tdk up --dry-run`, and verify that `tdk up shop` exits non-zero without starting containers and points users to WSL2 Ubuntu.
- Link the successful WSL2 workflow run from `docs/wsl2.md` so the platform claim points to CI evidence.
- Preserve the current rating formula, Job-fit axes, other score axes, and the 1.x stability caveat.

## Capabilities

### New Capabilities
- `wsl2-landscape-ci`: Required CI evidence for WSL2 landscape boot and native Windows refusal.

### Modified Capabilities
- `windows-wsl-support`: Replace the conditional/report-only WSL CI policy with the required WSL2 landscape gate and documented evidence link.

## Impact

- GitHub Actions workflow configuration and Windows runner setup for WSL2 Ubuntu and Docker Desktop integration.
- `scripts/wsl2-smoke.sh`, native Windows CLI checks, and `docs/wsl2.md` evidence link.
- Platforms evidence only; the rating formula and all other axes remain unchanged.
