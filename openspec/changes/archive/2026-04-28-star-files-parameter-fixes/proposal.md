## Why

The codebase contains 174 .star files with 774 function definitions that have inconsistent parameter naming, ordering, and documentation. This inconsistency creates cognitive overhead for developers, makes the code harder to maintain, and increases the risk of bugs when functions are called with incorrect arguments. Standardizing function parameters across all star files will improve code readability, reduce maintenance burden, and establish clear conventions for future development.

## What Changes

- **Standardize write function parameter naming**: Unify all variations (`write_fn`, `write_file_fn`, `write_file_if_changed_fn`) to a consistent `write_fn` parameter name across all generator functions
- **Fix parameter ordering**: Ensure optional parameters with defaults (especially `write_fn=None`) consistently appear at the end of parameter lists
- **Add missing parameter documentation**: Add docstring-style comments for all function parameters explaining their purpose and types
- **Normalize function naming between duplicate systems**: Align function names between `/discovery/` (primary) and `/engine/topologies/tilt/discovery/` (deprecated) where they diverge (e.g., `register_new_service` vs `register_new_resource`)
- **Standardize optional parameter patterns**: Ensure all file-writing functions use consistent `write_fn=None` pattern for dependency injection
- **Add type hints where missing**: Document expected parameter types (string, dict, bool, function, etc.) in function signatures

## Capabilities

### New Capabilities
- `parameter-naming-consistency`: Standardize all write function parameter names to `write_fn`
- `parameter-ordering-standard`: Ensure consistent parameter ordering with optional params last
- `parameter-documentation`: Add docstring documentation for all function parameters
- `function-naming-alignment`: Align function names between duplicate discovery systems
- `optional-parameter-patterns`: Standardize `write_fn=None` pattern across all generators

### Modified Capabilities
<!-- No existing spec requirements are changing - this is purely refactoring for consistency -->

## Impact

- **Affected Files**: 174 .star files across `/discovery/`, `/engine/topologies/tilt/`, `/engine/topologies/platform/`, and `/specs/` directories
- **Function Count**: 774 function definitions will be reviewed and standardized
- **Dependencies**: No external dependencies affected - this is internal refactoring
- **Breaking Changes**: **BREAKING** - Any external code calling these functions with keyword arguments will need to update parameter names
- **Risk Level**: Medium - extensive changes across many files, but purely refactoring with no behavioral changes
- **Testing Required**: All existing tests must pass; no functional changes expected
