## ADDED Requirements

### Requirement: Newcomers can find an end-to-end contribution path
The repository SHALL provide a contributor entry point that explains the steps from choosing a contribution type through preparing a branch, validating the change, and opening a pull request. It SHALL link to focused subsystem guidance and use commands and paths verified against the repository.

#### Scenario: Newcomer chooses where to start
- **WHEN** a newcomer reads `CONTRIBUTING.md`
- **THEN** they can identify the main contribution areas and follow a link to the relevant detailed instructions

#### Scenario: Newcomer prepares a first contribution
- **WHEN** a newcomer follows the contribution entry point
- **THEN** they can find development prerequisites, setup commands, applicable validation commands, and PR submission guidance

### Requirement: Common feature contribution recipes describe ownership and validation
The repository SHALL document how to approach CLI changes, frontend framework providers, database or infrastructure tool integrations, and engine/discovery/generator changes. Each recipe SHALL identify relevant source or configuration areas, shared boundaries or compatibility concerns, validation expectations, and user-facing documentation to review. Integration recipes SHALL guide contributors to trace the existing implementation rather than assume every tool follows an identical architecture.

#### Scenario: Contributor adds a frontend framework
- **WHEN** a contributor chooses to add a frontend framework provider
- **THEN** the onboarding material links to the detailed Vite provider guide
- **AND** the guide identifies implementation boundaries, tests, compatibility expectations, and PR documentation updates

#### Scenario: Contributor adds a database or development tool
- **WHEN** a contributor chooses to add a database or infrastructure tool
- **THEN** the recipe directs them to locate the owning manifest/configuration, resource or generator registration, dependency/startup behavior, health/readiness behavior, cleanup behavior, tests, and user-facing docs in the current implementation
- **AND** it asks them to preserve shared contracts and cover the integration's relevant lifecycle

#### Scenario: Contributor changes engine or discovery behavior
- **WHEN** a contributor changes engine, discovery, or generated configuration behavior
- **THEN** the recipe points them to the relevant subsystem guidance and explains how to validate affected generated output and existing compatibility

### Requirement: Contributors can determine when to use OpenSpec
The repository SHALL explain how to use OpenSpec for changes that affect user-visible contracts, manifests, generated output, or multiple subsystems, and SHALL link to a representative completed feature change. It SHALL distinguish those changes from straightforward documentation fixes or isolated changes that do not need a proposal unless another repository rule requires one.

#### Scenario: Cross-subsystem change is planned
- **WHEN** a contributor's proposed feature changes a contract or spans multiple subsystems
- **THEN** they can find instructions to inspect existing specs/examples and prepare a proposal before implementation

#### Scenario: Contributor studies the Vue feature example
- **WHEN** a contributor follows the example link
- **THEN** they can inspect the archived Vue provider change's proposal, design, and tasks as a complete feature workflow example

### Requirement: Pull request instructions make work reviewable
The repository SHALL provide a reusable PR checklist covering the change's purpose and scope, compatibility, relevant tests/checks, documentation updates, and reproducible evidence. The checklist SHALL ask contributors to distinguish checks they ran from checks they did not run and include before/after evidence when it helps demonstrate changed behavior. Contributor guidance SHALL explain which GitHub workflows run for every PR, which workflows use changed-file path filters, and whether folder-based PR labels are configured.

#### Scenario: Contributor prepares a feature pull request
- **WHEN** a contributor prepares a pull request for a new tool, database, framework, or other feature
- **THEN** they can determine what context, implementation summary, checks, generated output evidence, docs, and known gaps to include

#### Scenario: Contributor submits an isolated docs fix
- **WHEN** a contributor submits a documentation-only change
- **THEN** the checklist requests relevant link, command, or rendering checks without requiring unrelated runtime validation

#### Scenario: Contributor checks which automation runs
- **WHEN** a contributor opens or updates a pull request
- **THEN** they can determine which checks run for every PR and which workflows are triggered by files changed in the PR
- **AND** they can tell whether GitHub automatically applies area labels based on changed folders
