## ADDED Requirements

### Requirement: Generated files match service.json
Before Tilt starts, `tdk up` MUST verify generated files against `service.json`. On drift it MUST exit non-zero, name the files, and print `tdk config regenerate`. `tdk up --ignore-drift` MAY bypass the check and MUST print a warning.

#### Scenario: Hand-edited Dockerfile
- **WHEN** the user runs `tdk up` on a stack whose generated Dockerfile was edited by hand
- **THEN** the command exits 2
- **AND** the output names the drifted file
- **AND** Tilt is not started

#### Scenario: Clean tree
- **WHEN** the user runs `tdk up` and generated files match `service.json`
- **THEN** verify passes and startup continues
