# Spec Delta

## Purpose

The existing commands behave the same on the supported platforms, and upgrades do not silently change a working project.

## ADDED Requirements

### Requirement: Compatibility floors are shared
`tdk doctor` and `tdk up` SHALL use the same Docker, Compose, Tilt, and Bun floors. An unsupported combination SHALL be reported before startup with the required floor, the detected version, and a fix. Both commands SHALL agree.

#### Scenario: Docker is too old
- **WHEN** Docker Engine is below the floor
- **THEN** `tdk doctor` and `tdk up` both refuse with the required and detected versions and exit non-zero

### Requirement: Upgrades do not rewrite config silently
A breaking schema change SHALL warn with the current schema, the target schema, and the existing `tdk config migrate` command or a documented guide. TDK SHALL NOT modify `service.json` unless the user runs migrate. Deprecated fields SHALL warn and keep working for that compatible release.

#### Scenario: Schema is behind
- **WHEN** the project schema is older than the CLI target and migration is required
- **THEN** TDK prints the migration warning and leaves `service.json` byte-identical

### Requirement: Native Windows stays inspection-only
Native Windows SHALL remain documented as inspection-only. This change SHALL NOT start Docker or Tilt on native Windows except the existing unsupported `TDK_ALLOW_NATIVE_WINDOWS=1` escape hatch.

#### Scenario: Native Windows doctor
- **WHEN** `tdk doctor` runs on native Windows
- **THEN** it does not claim the landscape can start and points at WSL2

### Requirement: Fixtures lock current commands
CI SHALL run fixtures for a basic stack, invalid config, and a port conflict through the existing `tdk doctor`, `tdk doctor --json`, `tdk config verify`, `tdk logs` usage, and `tdk up --dry-run`. Each representative fixture SHALL have golden generated output. An unexpected generated diff SHALL fail CI.

#### Scenario: Generated golden drift
- **WHEN** a pull request changes generated output for a fixture without updating the golden file
- **THEN** CI fails

### Requirement: Config validation names the field
Invalid `service.json` SHALL be rejected by the existing doctor and up path. The error SHALL report the file, field, value, problem, and a fix. Circular dependencies, duplicate names, and invalid ports SHALL be rejected before startup.

#### Scenario: Circular dependency
- **WHEN** api depends on worker and worker depends on api
- **THEN** validation names both services and `tdk up` does not start the environment
