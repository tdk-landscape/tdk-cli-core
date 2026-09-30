## Context

The existing pipeline in `tdk-cli-core` cross-compiles the Windows AMD64 executable and checks its PE header, checksum, and ZIP inclusion. The Windows-specific runtime path and adjacent engine layout are not exercised on a Windows runner. The release README and website materials span repositories, and the installer currently validates the executable but not the engine archive. A separate broader Windows support change already defines platform support and initial installer behavior; this design completes public release readiness without expanding the platform support claim.

## Goals / Non-Goals

**Goals:**
- Prevent promotion of a release to latest unless the required Windows executable and companion assets are verified.
- Exercise the release candidate on Windows with checksum, version, and project-generation checks using the installed layout.
- Verify both downloaded archives in the PowerShell installer.
- Keep public Windows release language tied to passing release evidence.

**Non-Goals:**
- Windows ARM64, Authenticode signing, package-manager distribution, Docker-based end-to-end boot, or changes to Unix asset names.
- Republishing binaries from documentation or consumer repositories.
- Claiming full native Windows `tdk up` support based only on CLI smoke coverage.

## Decisions

- **Smoke the release candidate on Windows before npm and latest promotion.** Build once, make the candidate assets available to the Windows job, and run `--version` plus `project --yes` with the engine extracted beside the executable. This catches runtime/layout failures that Linux PE validation cannot. If publication remains a single workflow, retain the draft state until the Windows gate passes; if workflow constraints require an artifact handoff, use the same built files rather than rebuilding for Windows.
- **Treat release assets as a fixed contract.** Validate the four existing Unix binaries, Windows executable, engine archive, checksum manifest, and versioned ZIP. Check the Windows executable is non-empty and starts with `MZ`; ensure its checksum and ZIP entries exist; after publication, inspect the release asset list. Promote as latest only after gates pass.
- **Verify checksums from the published manifest.** The installer will compare both executable and engine SHA-256 values against `checksums.txt` before extracting/installing. Missing entries and mismatches fail with actionable errors.
- **Make documentation evidence-gated.** Keep pending/caveat wording until the latest release has the asset and the Windows smoke succeeds. Update the release repository README, installation story, website quick start, and framework index in the corresponding repositories once evidence exists. Retain Docker Desktop Linux-container mode and AMD64 limits.
- **Keep manual full-boot acceptance separate from the release blocker.** Document a Windows 11 AMD64 checklist for install, doctor, scaffold, and optional `tdk up`; do not make Docker Desktop a hosted CI prerequisite.

Alternatives considered: testing only the compiled file on Linux is insufficient for runtime behavior; testing `main` instead of the release candidate does not establish that the uploaded assets match; publishing latest before smoke would expose unverified assets. Rebuilding separately on Windows risks artifacts differing from those users download.

## Risks / Trade-offs

- [Draft-release permissions or asset-download behavior may complicate smoke sequencing] → Keep the candidate in a draft until verification, or use a workflow artifact containing the exact release files.
- [Windows runner environment may lack required external tooling] → Keep the smoke limited to CLI version and project scaffold; do not require Docker.
- [Checksum manifest formatting may differ across platforms] → Parse by exact asset filename and fail clearly when an entry is absent or malformed.
- [Manual Windows 11 acceptance cannot run on hosted CI] → Record it as a release-readiness checklist and keep broader support language gated on that evidence.

## Migration Plan

1. Add asset/package checks and a Windows smoke gate to release automation.
2. Add engine checksum verification to `install.ps1`.
3. Run the workflow for a candidate and verify latest-release download access after promotion.
4. Update public docs only when all required evidence is green; otherwise preserve caveats and record the failed gate.
5. Rollback by reverting the workflow/installer/docs changes. If a bad release is already latest, publish a corrected version through the normal immutable versioned release process and repoint latest only after all gates pass.

## Open Questions

- Confirm whether the release workflow can download draft assets using its existing `BINARY_RELEASE_TOKEN`; if not, the smoke job should consume the exact build artifact before promotion.
- Define where the manual Windows 11 acceptance result is recorded so documentation maintainers can verify it before removing the caveat.


## Implementation Finding

The current `tdk project --yes` command unconditionally runs `assertMachineReadyOrExit()`, which requires Docker, Compose, Tilt, Bun, and available host ports before it creates project files. This conflicts with the spec's Windows smoke requirement that `project --yes` pass without Docker Desktop. Resolve this contract before implementing the Windows smoke: either define a narrowly scoped supported smoke mode that skips machine readiness while still exercising engine/template resolution, or revise the smoke to provide the required Windows runtime dependencies. Do not claim a no-Docker project smoke until the command behavior supports it.
