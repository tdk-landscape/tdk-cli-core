## ADDED Requirements

### Requirement: Consistent optional write function parameter pattern
All file-writing functions SHALL use the `write_fn=None` pattern for optional write function injection.

#### Scenario: Write function parameter has None default
- **WHEN** a function accepts an optional write function parameter
- **THEN** the parameter SHALL have a default value of `None`

#### Scenario: Write function parameter is optional
- **WHEN** a generator function does not require an external write function
- **THEN** the `write_fn` parameter SHALL be optional with `None` default, allowing the function to use an internal default implementation

#### Scenario: Write function conditional usage
- **WHEN** a function receives `write_fn=None`
- **THEN** the function SHALL use its internal default write implementation
- **AND** **WHEN** a callable is passed to `write_fn`
- **THEN** the function SHALL use the provided callable instead
