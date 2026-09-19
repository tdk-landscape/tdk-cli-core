# resource-terminology-standard Specification

## Purpose
TBD - created by archiving change rename-domain-to-stack-service-to-resource. Update Purpose after archive.
## Requirements
### Requirement: Resource terminology standardization
All references to deployable units SHALL use the term "resource" instead of "service".

#### Scenario: Function parameters use resource terminology
- **WHEN** a function accepts a deployable unit as a parameter
- **THEN** the parameter name SHALL be `resource` or `resource_dict` and NOT `service` or `svc`

#### Scenario: Docstrings use resource terminology
- **WHEN** a function docstring describes a deployable unit
- **THEN** it SHALL use the term "resource" and NOT "service"

#### Scenario: Variable names use resource terminology
- **WHEN** a variable holds a deployable unit
- **THEN** the variable name SHALL be `resource` and NOT `svc` or `service`

#### Scenario: Comments use resource terminology
- **WHEN** code comments describe deployable units
- **THEN** they SHALL use the term "resource" and NOT "service"

