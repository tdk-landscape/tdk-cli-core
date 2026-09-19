## ADDED Requirements

### Requirement: Function naming alignment between duplicate systems
Functions in the primary `/discovery/` system and deprecated `/engine/topologies/tilt/discovery/` system SHALL use consistent naming where they serve identical purposes.

#### Scenario: Function names match between systems
- **WHEN** two functions in duplicate systems perform the same operation
- **THEN** they SHALL have identical names

#### Scenario: Divergent names are aligned
- **WHEN** a function in the primary system is named `register_new_service` and the equivalent in the deprecated system is named `register_new_resource`
- **THEN** the deprecated system function SHALL be renamed to match the primary system naming convention
