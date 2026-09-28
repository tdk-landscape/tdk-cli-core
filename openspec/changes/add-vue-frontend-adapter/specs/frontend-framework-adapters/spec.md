## ADDED Requirements

### Requirement: Frontend resource generation resolves a registered framework provider

The CLI SHALL resolve frontend scaffolding through a registered provider selected by an optional framework identifier. When the identifier is omitted, the CLI SHALL select React. The CLI SHALL reject an unknown identifier before writing generated files.

#### Scenario: Omitted framework preserves React default
- **WHEN** a user creates a frontend resource without specifying a framework
- **THEN** the CLI records or resolves the framework as `react`
- **AND** generates the React starter files and dependencies

#### Scenario: Explicit registered framework is selected
- **WHEN** a user creates a frontend resource with a registered framework identifier
- **THEN** the CLI generates that provider's entry files, dependencies, and framework configuration
- **AND** records the selected identifier in the frontend service metadata

#### Scenario: Unknown framework is rejected before generation
- **WHEN** a user requests an unregistered frontend framework identifier
- **THEN** the CLI returns an actionable error listing how to find supported identifiers
- **AND** does not create a partial resource

### Requirement: Framework providers preserve the shared TDK frontend contract

Every frontend provider SHALL use the shared service metadata and existing TDK frontend runtime contract. Provider selection SHALL NOT require framework-specific Docker, nginx, Traefik, Tilt, port allocation, or generated API/environment module behavior.

#### Scenario: Provider-generated frontend runs through shared TDK integration
- **WHEN** a frontend resource is generated with any registered provider
- **THEN** it uses the same frontend port and service metadata conventions
- **AND** it remains compatible with shared proxy, Docker, nginx, Tilt, and generated API/environment integration

#### Scenario: Vue provider produces a Vue Vite starter
- **WHEN** a user creates a frontend resource with framework `vue`
- **THEN** the generated project includes Vue 3, the Vue Vite plugin, and a Vue SFC starter entry/component
- **AND** the TDK CLI runtime does not acquire Vue as a dependency

### Requirement: Provider registry and generated output are checked automatically

The CLI SHALL have automated checks for registered provider resolution, the React default, each provider's generated output, and fail-closed handling of unknown identifiers. The checks SHALL run in the existing CLI CI workflow.

#### Scenario: CLI CI validates frontend providers
- **WHEN** the CLI CI workflow runs
- **THEN** provider tests verify React default output and Vue scaffold output
- **AND** the workflow verifies unknown framework identifiers fail without partial output
