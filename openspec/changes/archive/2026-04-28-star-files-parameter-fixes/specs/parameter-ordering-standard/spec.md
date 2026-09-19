## ADDED Requirements

### Requirement: Parameter ordering with optional parameters last
All function signatures SHALL place optional parameters (those with default values) after required parameters.

#### Scenario: Optional parameter follows required parameters
- **WHEN** a function has both required and optional parameters
- **THEN** all required parameters SHALL appear before any optional parameters in the signature

#### Scenario: Write function parameter is last
- **WHEN** a function accepts a `write_fn` parameter with default value `None`
- **THEN** `write_fn` SHALL be the last parameter in the function signature
