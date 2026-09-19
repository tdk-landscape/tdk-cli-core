## ADDED Requirements

### Requirement: CLI commands have test coverage
The system SHALL add missing test coverage for CLI command implementations.

#### Scenario: Resource command tests
- **WHEN** running the test suite
- **THEN** resource.ts command SHALL have unit tests covering resource creation, template generation, and port assignment

#### Scenario: Config command tests
- **WHEN** running the test suite
- **THEN** config.ts command SHALL have unit tests covering diff functionality and configuration loading

### Requirement: Error handling paths are tested
The system SHALL add tests for error handling and edge cases.

#### Scenario: Invalid resource type handling
- **WHEN** user specifies an invalid resource type
- **THEN** the system SHALL throw an appropriate error and test SHALL verify this behavior

#### Scenario: Missing manifest handling
- **WHEN** discovering services with missing or invalid manifests
- **THEN** the system SHALL handle gracefully and log appropriate warnings (tested)
