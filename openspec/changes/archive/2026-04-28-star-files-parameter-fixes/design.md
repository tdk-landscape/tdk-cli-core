## Context

The codebase currently has 174 .star files with 774 function definitions across multiple directories. Through analysis, we've identified several parameter inconsistency issues:

1. **Write Function Parameter Naming**: Functions use `write_fn`, `write_file_fn`, and `write_file_if_changed_fn` interchangeably for the same concept
2. **Parameter Ordering**: Some functions have `write_fn` at the end, others have it earlier in the parameter list
3. **Missing Documentation**: Most functions lack parameter documentation explaining expected types and purposes
4. **Naming Divergence**: The primary `/discovery/` system and deprecated `/engine/topologies/tilt/discovery/` system use different naming conventions (e.g., `register_new_service` vs `register_new_resource`)
5. **Optional Parameter Patterns**: Inconsistent use of `write_fn=None` pattern for dependency injection

These inconsistencies make the codebase harder to navigate, maintain, and extend. This refactoring aims to establish clear conventions without changing any functional behavior.

## Goals / Non-Goals

**Goals:**
- Standardize all write function parameter names to `write_fn`
- Ensure optional parameters consistently appear at the end of parameter lists
- Add parameter documentation (docstring-style comments) to all functions
- Align function names between duplicate discovery systems where they diverge
- Maintain 100% backward compatibility in behavior (no functional changes)
- Enable parallel execution of all 100 subtasks

**Non-Goals:**
- Changing function logic or behavior
- Adding new features or capabilities
- Removing deprecated files (they are kept for backward compatibility)
- Renaming functions unless they have divergent names between duplicate systems
- Adding runtime type checking (only documentation)

## Decisions

### Decision 1: Standardize on `write_fn` Parameter Name
**Rationale**: The name `write_fn` is concise, clear, and already used in the majority of functions. It's shorter than `write_file_if_changed_fn` without losing clarity.

**Alternatives considered**:
- `write_file_fn` - More explicit but redundant since context makes it clear
- `write_file_if_changed_fn` - Too verbose for frequent use
- Keep all variations - Rejected as it perpetuates inconsistency

### Decision 2: Optional Parameters at End of Signature
**Rationale**: Following Python/Starlark conventions, parameters with default values should come after required parameters. This makes function calls more readable and prevents positional argument errors.

**Pattern to enforce**:
```starlark
def function_name(required1, required2, optional1=None, optional2=True):
```

### Decision 3: Docstring Format for Starlark
**Rationale**: Starlark doesn't have a formal docstring standard like Python. We'll use a consistent comment-based format:

```starlark
def function_name(param1, param2, write_fn=None):
    """
    Brief description of function.
    
    Args:
        param1: Description of param1 (type)
        param2: Description of param2 (type)
        write_fn: Optional write function for dependency injection (callable)
    
    Returns:
        Description of return value (type)
    """
```

### Decision 4: Parallel Task Execution
**Rationale**: Since these are independent refactoring tasks across different files, they can be executed in parallel. Each task focuses on a specific file or small group of related files.

**Task organization**:
- Group 1-40: `/discovery/` directory (primary system)
- Group 41-80: `/engine/topologies/tilt/` directory (deprecated system)
- Group 81-95: `/engine/topologies/platform/` directory
- Group 96-100: `/specs/` directory and cross-cutting concerns

## Risks / Trade-offs

**Risk**: Breaking changes for external callers using keyword arguments
- **Mitigation**: This is a **BREAKING** change as noted in proposal. External code will need to update parameter names. We'll document all changed parameter names in the tasks.

**Risk**: Inadvertent functional changes during refactoring
- **Mitigation**: Each task includes verification step to confirm no behavior changes. All existing tests must pass.

**Risk**: Merge conflicts with ongoing development
- **Mitigation**: Short timeline for completion. Tasks are small and focused, minimizing conflict window.

**Risk**: Deprecated system modifications may seem wasteful
- **Mitigation**: Keeping deprecated system consistent reduces cognitive load when comparing or potentially migrating between systems.

## Migration Plan

1. **Phase 1: Analysis** (completed)
   - Catalog all 174 .star files and 774 functions
   - Identify specific parameter inconsistencies

2. **Phase 2: Implementation** (current)
   - Execute 100 parallel subtasks to fix parameter issues
   - Each task updates specific files with standardized patterns

3. **Phase 3: Verification**
   - Run full test suite
   - Verify no functional changes
   - Check for any missed inconsistencies

4. **Phase 4: Documentation**
   - Update any developer documentation with new conventions
   - Add parameter naming conventions to coding standards

## Open Questions

- Should we add a linting rule to prevent future parameter naming inconsistencies?
- Should we create a style guide document for Starlark conventions?
