## ADDED Requirements

### Requirement: Contributors can follow a documented framework adapter process

The repository SHALL document how contributors add a frontend framework provider, including the shared/provider boundary, provider file layout and registration, default behavior, required tests, and documentation updates. `CONTRIBUTING.md` SHALL link to the detailed guide.

#### Scenario: Contributor finds framework contribution instructions
- **WHEN** a contributor reads `CONTRIBUTING.md`
- **THEN** they can follow a link to the frontend framework contribution guide
- **AND** the guide explains how to add a Vite-based framework provider using the same shared TDK contract

#### Scenario: Contributor can determine provider scope
- **WHEN** a contributor follows the guide to add a framework
- **THEN** the guide identifies framework-owned files and shared files
- **AND** states that shared Docker, nginx, Traefik, Tilt, and API/environment generation remain provider-independent

### Requirement: Framework contributions have a review checklist

The repository SHALL provide a repeatable checklist for framework provider pull requests. The checklist SHALL cover provider registration, React default compatibility, generated output tests, documentation, and required CLI checks.

#### Scenario: Framework pull request is prepared for review
- **WHEN** a contributor prepares a frontend framework pull request
- **THEN** the pull request template or guide prompts them to identify the framework and provider implementation
- **AND** verify default behavior, tests, documentation, typecheck, lint, and CLI test suite
