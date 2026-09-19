## Why

The TDK CLI codebase has accumulated significant technical debt through code duplication, scattered type definitions, unused code, circular dependencies, weak typing, defensive programming patterns, legacy fallbacks, and AI-generated artifacts. These issues compound daily, slowing development, increasing bug risk, and making the codebase harder to maintain and navigate. Now is the critical time to execute a comprehensive cleanup before the technical debt becomes unmanageable.

## What Changes

This change executes a **comprehensive 8-dimensional codebase cleanup**:

1. **DRY & Deduplication**: Consolidate duplicate code patterns and implement DRY principles where they reduce complexity
2. **Type Consolidation**: Find all type definitions and consolidate shared types into centralized locations
3. **Dead Code Elimination**: Use knip to identify and remove all unused code with verification
4. **Circular Dependency Resolution**: Untangle circular dependencies using madge analysis
5. **Strong Typing**: Remove all weak types (any, unknown) with proper research-based replacements
6. **Defensive Programming Cleanup**: Remove unnecessary try/catch blocks that hide errors without purpose
7. **Legacy Code Removal**: Eliminate deprecated, fallback, and legacy code paths
8. **AI Slop Cleanup**: Remove stubs, LARP artifacts, unnecessary comments, and non-helpful documentation

## Capabilities

### New Capabilities
- `code-quality-guardian`: Automated enforcement of code quality standards post-cleanup
- `type-registry`: Centralized type definition management system
- `dependency-graph-monitor`: Continuous monitoring for circular dependencies

### Modified Capabilities
- All CLI commands benefit from cleaner, deduplicated code
- Type safety improved across all modules
- Error handling becomes explicit and purposeful
- Code navigation and comprehension improved

## Impact

- **CLI**: TypeScript source files in `cli/src/` - comprehensive cleanup of all 8 dimensions
- **Discovery**: Python modules in `discovery/` - cleanup where applicable
- **Engine**: Starlark files in `engine/` - cleanup of dead code and comments
- **Tests**: All test files - improved type safety and removed dead test code
- **Breaking changes**: Minimal - only removal of truly unused code

## Success Metrics

- Zero `any` or `unknown` types remaining (except truly unavoidable cases)
- All circular dependencies resolved
- 20%+ reduction in code volume through deduplication and dead code removal
- All knip-reported unused code verified and removed
- No unnecessary try/catch blocks remaining
- No AI-generated stubs or placeholder comments
