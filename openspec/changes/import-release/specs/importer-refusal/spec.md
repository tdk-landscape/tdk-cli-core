## ADDED Requirements

### Requirement: Helm and Kustomize write nothing
The importer MUST identify `Chart.yaml` as Helm and `kustomization.yaml` as Kustomize. When a directory contains only those unsupported files and no importable Compose service, Dockerfile, `package.json` script, or Procfile process, it MUST exit 2, name the unsupported format, and write no `service.json`. With `--dry-run` on such an unsupported-only directory, it MUST print the refusal, MUST NOT print an import plan, and MUST exit 2 without writing files. A directory containing both an unsupported file and importable supported input MUST still import the supported input.

#### Scenario: Helm-only directory is refused
- **GIVEN** a directory containing `Chart.yaml` and no importable supported input
- **WHEN** the user runs the importer
- **THEN** the command exits 2
- **AND** the message names Helm as not imported
- **AND** no files are written

#### Scenario: Kustomize-only directory is refused
- **GIVEN** a directory containing `kustomization.yaml` and no importable supported input
- **WHEN** the user runs the importer
- **THEN** the command exits 2
- **AND** the message names Kustomize as not imported
- **AND** no files are written

#### Scenario: Dry-run refuses unsupported-only input
- **GIVEN** a directory containing only `Chart.yaml` and/or `kustomization.yaml`
- **WHEN** the user runs the importer with `--dry-run`
- **THEN** the importer prints the refusal, not an import plan
- **AND** the command exits 2
- **AND** no files are written

#### Scenario: Compose service is imported beside Helm
- **GIVEN** a directory containing `Chart.yaml` and a Compose file with an importable service
- **WHEN** the user runs the importer with `--yes`
- **THEN** the Compose service receives a `service.json`
- **AND** the command exits 0 without refusing the directory because of Helm

#### Scenario: Dockerfile service is imported beside Kustomize
- **GIVEN** a directory containing `kustomization.yaml` and an importable `Dockerfile`
- **WHEN** the user runs the importer with `--yes`
- **THEN** the Dockerfile service receives a `service.json`
- **AND** the command exits 0 without refusing the directory because of Kustomize

#### Scenario: package.json script is imported beside Helm
- **GIVEN** a directory containing `Chart.yaml` and `package.json` with an importable `start` or `dev` script
- **WHEN** the user runs the importer with `--yes`
- **THEN** the package service receives a `service.json`
- **AND** the command exits 0 without refusing the directory because of Helm

#### Scenario: Procfile process is imported beside Kustomize
- **GIVEN** a directory containing `kustomization.yaml` and `Procfile` with `web: node app.js`
- **WHEN** the user runs the importer with `--yes`
- **THEN** the `web` process receives a `service.json`
- **AND** the command exits 0 without refusing the directory because of Kustomize
