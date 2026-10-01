## Context

The repository already has `scripts/wsl2-smoke.sh`, `docs/wsl2.md`, a native Windows refusal contract, and an Ubuntu-only quickstart E2E. Those assets do not produce evidence that the landscape boots through WSL2 on a Windows host. The CI design must exercise the existing smoke path on an actual Windows runner and keep native Windows CLI behavior separately observable.

## Goals / Non-Goals

**Goals:**
- Produce a required, reproducible WSL2 landscape boot result on Windows with Ubuntu WSL2 and Docker Desktop WSL integration.
- Verify the native Windows CLI inspection and refusal contract in CI.
- Make the passing WSL2 run discoverable from `docs/wsl2.md`.

**Non-Goals:**
- Booting the landscape natively on Windows.
- Changing the score formula, Job-fit axes, Stability or Adoption assessment, or the 1.x stability caveat.
- Replacing the existing Ubuntu quickstart E2E.

## Decisions

- **Use a Windows GitHub Actions runner for the WSL2 smoke.** Set up or enable Ubuntu WSL2 and Docker Desktop WSL integration, then invoke the repository's existing `scripts/wsl2-smoke.sh` inside that distribution. This makes the check represent the supported Windows route and avoids maintaining a second landscape boot implementation. A green required check must be recorded on the default branch before it is treated as platform evidence.
- **Keep native Windows validation as a separate job.** Run the released/built CLI's version, doctor, and dry-run commands on Windows AMD64, then run `tdk up shop` and assert non-zero exit, a WSL2 Ubuntu instruction, and no container startup. Separation distinguishes platform refusal from a successful WSL2 boot.
- **Link the workflow run from `docs/wsl2.md`.** Use a stable workflow or badge link that takes readers to the Actions history; do not hard-code a single transient run URL. The successful default-branch run is the evidence for the platform claim.
- **Preserve the scorecard boundary.** This proposal specifies evidence collection only. It does not edit the rating formula or treat a script, proposal, or unmerged workflow as a score change.

## Risks / Trade-offs

- [WSL2 or Docker Desktop setup may be unavailable or unstable on a hosted Windows image] → Verify the runner prerequisites early; if hosted runner policy prevents this integration, document and provision an eligible Windows runner before marking the required check green.
- [A passing workflow may not be configured as a branch protection requirement] → Name the job consistently and configure the corresponding required status check on the default branch as part of rollout.
- [Smoke failures can leave containers or resources behind] → Preserve the script's cleanup behavior and ensure workflow cleanup runs even when startup or health checks fail.

## Migration Plan

Add the WSL2 job and native Windows refusal job, exercise them on a pull request, then make both checks required on the default branch. After a green default-branch WSL2 run exists, add the stable Actions link to `docs/wsl2.md`. Rollback consists of removing the new required checks and evidence link if the runner cannot reliably provide the specified environment; the WSL2 documentation and smoke script remain useful independently.

## Open Questions

- Which Windows runner image and Docker Desktop provisioning method are permitted and reliable for this repository's GitHub Actions environment?
- Which exact job names will be configured as required branch protection checks?
