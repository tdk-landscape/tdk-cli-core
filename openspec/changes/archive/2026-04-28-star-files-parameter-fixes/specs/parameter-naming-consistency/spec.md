## ADDED Requirements

### Requirement: Write function parameter naming consistency
All functions that accept a file-writing callback parameter SHALL use the parameter name `write_fn` exclusively.

#### Scenario: Function uses write_fn parameter
- **WHEN** a generator function accepts a file-writing callback
- **THEN** the parameter SHALL be named `write_fn` and NOT `write_file_fn`, `write_file_if_changed_fn`, or other variations

#### Scenario: Inconsistent parameter names are corrected
- **WHEN** a function uses `write_file_fn` or `write_file_if_changed_fn` as parameter names
- **THEN** the parameter name SHALL be changed to `write_fn`
