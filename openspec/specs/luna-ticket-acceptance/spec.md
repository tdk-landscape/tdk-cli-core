# Luna ticket acceptance contracts

This spec records the user-visible contracts for the CLI experience tickets in the Luna batch. Ticket 5 (`shop-real`) is intentionally deferred.

## Requirement: Bring-your-own resources validate and run without generated application code

The CLI and service schema MUST accept bring-your-own resources with project-defined stack names. `stack` MUST be a free-form string. `exposeViaProxy` MUST be a schema-declared boolean and MUST be honored only for bring-your-own resources.

### Scenario: Create a Dockerfile-backed resource

- **WHEN** a user runs `tdk resource <name> --type byo --stack shop --yes`
- **THEN** the CLI creates `services/shop/<name>/service.json`
- **AND** writes `appType: "bring-your-own"`, `stack: "shop"`, and an assigned port in the 4000–5999 range
- **AND** creates a Dockerfile and health configuration using that assigned port only when the selected Dockerfile does not already exist
- **AND** does not generate `src/`, `package.json`, or tests

### Scenario: Use an existing image

- **WHEN** `--image <image>` is supplied
- **THEN** the manifest records that exact image and omits `dockerfile`
- **AND** the command does not create a Dockerfile

### Scenario: Disable proxy routing

- **WHEN** `--no-proxy` is supplied
- **THEN** Commander sets `options.proxy` to `false`
- **AND** the manifest contains the schema-declared `exposeViaProxy: false`
- **AND** `featuresEnabled` is preserved

### Scenario: List and preview the resource

- **WHEN** the resource has been created
- **THEN** `tdk resources` lists it
- **AND** `tdk up --dry-run <stack>` includes it without starting services

## Requirement: Doctor uses exact remediation copy

Doctor MUST preserve these exact fix strings:

- Port 80: `Stop the process bound to port 80, or stop local nginx/caddy. Then: tdk doctor`
- Port 5432: `Stop local Postgres or change the host port. Then: tdk doctor`

Doctor MUST preserve the exact completion and WSL2 guidance strings in its CLI tests.

## Requirement: Eject documents retained files and exact recovery

`tdk eject` MUST fail outside a project with `tdk eject: no .tdk/project.json in this directory or parents`. Its dry-run MUST list generated project outputs only and MUST NOT write `EJECTED.md`.

On confirmation, it MUST create an `EJECTED.md` with the sections `Keep`, `Optional to delete`, and `To go back`; the recovery instruction MUST use `tdk config regenerate`. It MUST retain the existing success output contract.

## Requirement: WSL2 guide and README state platform support accurately

The guide MUST use the title `# WSL2`, include the repository's `install.sh` command, and explain the IIS port conflict. README MUST point Windows users to this guide and describe WSL2/Linux support accurately.

## Requirement: Honest tool comparison uses the agreed headings

The comparison page MUST use these headings:

- `# TDK vs Compose vs raw Tilt`
- `## Use TDK`
- `## Do not use TDK`
- `## vs Compose`
- `## vs raw Tilt`
- `## Known limits`

It MUST say that the 100-service benchmark uses generated stubs.

## Requirement: First-boot issue template uses the agreed fields

The issue template MUST use `title: "boot: "`, `labels: ["show-and-tell"]`, and exactly these field IDs: `os`, `version`, `minutes`, `broke`, and `cmd`.

## Requirement: Quickstart continues to run doctor

The Quickstart E2E MUST run `tdk doctor` after initializing a project with `tdk project --yes`, so doctor output remains covered without treating the expected pre-project state as a doctor regression.

## Requirement: Up success message remains covered

The CLI MUST test that the successful `tdk up` output includes `Tilt UI:` and `tdk networks`, plus the selected Tilt port without a trailing slash.
