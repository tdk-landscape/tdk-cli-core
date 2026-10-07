## Purpose

Verify the released importer package and documentation meet the published contract for published-importer-refusal.

## ADDED Requirements

### Requirement: unsupported-only directories exit 2
`Chart.yaml` is Helm. `kustomization.yaml` is Kustomize. A directory that has
only those files MUST exit 2, name the unsupported type, and write nothing.
`--dry-run` on that directory MUST print the refusal, exit 2, and write nothing.
It MUST NOT print an import plan.

#### Scenario: Helm only
- GIVEN a directory with `Chart.yaml` and no Compose, Dockerfile, package.json script, or Procfile
- WHEN the user runs the published 0.1.1 package
- THEN the command exits 2
- AND no files are written

#### Scenario: dry-run does not plan
- GIVEN a directory with only `kustomization.yaml`
- WHEN the user runs the published 0.1.1 package with `--dry-run`
- THEN the command exits 2
- AND the output names Kustomize
- AND no files are written
