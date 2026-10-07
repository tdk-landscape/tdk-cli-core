## 1. Prepare release

- [x] 1.1 Bump package to 0.1.1 and add --version; verify build, lint, typecheck, tests, and packaged version.
- [x] 1.2 Pin importer README and import guide to 0.1.1 while retaining the core 1.3.104 gate; review commands.
- [x] 1.3 Merge importer release PR and tag v0.1.1; verify ancestry includes #9 and #10.

## 2. Publish and verify

- [x] 2.1 Run Publish tdk-import with dry_run=false and ref=v0.1.1; verify workflow success and npm latest=0.1.1.
- [x] 2.2 Verify registry tarball integrity and fresh-cache --version, Helm/Kustomize refusal with and without dry-run, mixed Procfile, and all-skipped Procfile; record evidence.

## 3. Pin core documentation

- [x] 3.1 Pin runbook commands to 0.1.1, remove unpublished-package warning, and retain the core 1.3.104 gate; verify documentation and OpenSpec validation.
- [x] 3.2 Open core PR containing the proposal, artifacts, runbook, and published-package evidence.
