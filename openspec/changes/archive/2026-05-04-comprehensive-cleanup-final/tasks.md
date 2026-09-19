## 1. Deduplication & DRY Implementation

Research Phase:
- [ ] 1.1 Use jscpd or similar to find code duplication patterns
- [ ] 1.2 Identify duplicate logic across CLI commands
- [ ] 1.3 Find duplicate utility functions
- [ ] 1.4 Document patterns appearing 3+ times
- [ ] 1.5 Write CRITICAL_ASSESSMENT_1.md with findings and recommendations

Implementation Phase:
- [ ] 1.6 Create shared utility modules for common patterns
- [ ] 1.7 Consolidate duplicate validation logic
- [ ] 1.8 Extract shared template generation code
- [ ] 1.9 Merge duplicate error handling patterns
- [ ] 1.10 Verify all deduplication with tests

## 2. Type Definition Consolidation

Research Phase:
- [ ] 2.1 Inventory all type definitions in cli/src
- [ ] 2.2 Find types that should be shared but are duplicated
- [ ] 2.3 Identify domain-specific type groupings
- [ ] 2.4 Map current type file organization
- [ ] 2.5 Write CRITICAL_ASSESSMENT_2.md with consolidation plan

Implementation Phase:
- [ ] 2.6 Create centralized types directory structure
- [ ] 2.7 Move shared types to appropriate modules
- [ ] 2.8 Update all imports to use consolidated types
- [ ] 2.9 Remove duplicate type definitions
- [ ] 2.10 Verify type checking passes

## 3. Dead Code Elimination (knip)

Research Phase:
- [ ] 3.1 Run knip to identify unused exports
- [ ] 3.2 Run knip to identify unused dependencies
- [ ] 3.3 Cross-reference with actual usage in codebase
- [ ] 3.4 Identify false positives (dynamically loaded code)
- [ ] 3.5 Write CRITICAL_ASSESSMENT_3.md with removal candidates

Implementation Phase:
- [ ] 3.6 Remove verified unused exports
- [ ] 3.7 Remove verified unused dependencies from package.json
- [ ] 3.8 Remove unused imports in all files
- [ ] 3.9 Remove unused functions and variables
- [ ] 3.10 Verify no runtime regressions

## 4. Circular Dependency Resolution (madge)

Research Phase:
- [ ] 4.1 Run madge --circular on cli/src
- [ ] 4.2 Map full dependency graph
- [ ] 4.3 Identify root causes of each cycle
- [ ] 4.4 Design minimal fixes for each cycle
- [ ] 4.5 Write CRITICAL_ASSESSMENT_4.md with resolution plan

Implementation Phase:
- [ ] 4.6 Extract shared code to break cycles
- [ ] 4.7 Reorder imports where possible
- [ ] 4.8 Create interface/implementation splits if needed
- [ ] 4.9 Verify madge shows no circular dependencies
- [ ] 4.10 Run full test suite

## 5. Weak Type Replacement (any/unknown)

Research Phase:
- [ ] 5.1 Find all `any` types in codebase
- [ ] 5.2 Find all `unknown` types in codebase
- [ ] 5.3 Research actual runtime values for each
- [ ] 5.4 Check package type definitions for external APIs
- [ ] 5.5 Write CRITICAL_ASSESSMENT_5.md with replacement types

Implementation Phase:
- [ ] 5.6 Replace `any` with specific types
- [ ] 5.7 Replace `unknown` with union types or branded types
- [ ] 5.8 Add runtime type guards where needed
- [ ] 5.9 Update function signatures
- [ ] 5.10 Verify no type errors and tests pass

## 6. Defensive Programming Cleanup

Research Phase:
- [ ] 6.1 Find all try/catch blocks in codebase
- [ ] 6.2 Identify error-swallowing patterns (empty catch)
- [ ] 6.3 Identify unnecessary fallback values
- [ ] 6.4 Determine which catches serve legitimate purposes
- [ ] 6.5 Write CRITICAL_ASSESSMENT_6.md with cleanup plan

Implementation Phase:
- [ ] 6.6 Remove empty catch blocks
- [ ] 6.7 Remove error-hiding patterns
- [ ] 6.8 Replace vague fallbacks with explicit error handling
- [ ] 6.9 Keep only necessary defensive code with clear comments
- [ ] 6.10 Verify error handling tests pass

## 7. Legacy & Deprecated Code Removal

Research Phase:
- [ ] 7.1 Find all TODO/FIXME comments related to legacy code
- [ ] 7.2 Identify deprecated functions and methods
- [ ] 7.3 Find fallback code for removed features
- [ ] 7.4 Identify migration compatibility code
- [ ] 7.5 Write CRITICAL_ASSESSMENT_7.md with removal candidates

Implementation Phase:
- [ ] 7.6 Remove deprecated functions
- [ ] 7.7 Remove legacy fallback code paths
- [ ] 7.8 Clean up migration compatibility shims
- [ ] 7.9 Update any remaining callers
- [ ] 7.10 Verify clean code paths remain

## 8. AI Slop & Comment Cleanup

Research Phase:
- [ ] 8.1 Scan for AI-generated comment patterns
- [ ] 8.2 Find TODO comments describing future work that's done
- [ ] 8.3 Identify stub functions and placeholder code
- [ ] 8.4 Find "LARP" comments (describing aspirational state)
- [ ] 8.5 Write CRITICAL_ASSESSMENT_8.md with cleanup targets

Implementation Phase:
- [ ] 8.6 Remove AI-generated boilerplate comments
- [ ] 8.7 Remove completed TODO comments
- [ ] 8.8 Remove or implement stub functions
- [ ] 8.9 Replace LARP comments with accurate descriptions
- [ ] 8.10 Add helpful comments where genuinely needed

## Final Verification

- [ ] 9.1 Run full test suite (all tests must pass)
- [ ] 9.2 Run type checker (zero errors)
- [ ] 9.3 Run linter (zero warnings)
- [ ] 9.4 Run knip (verify clean)
- [ ] 9.5 Run madge (no circular dependencies)
- [ ] 9.6 Generate final report with metrics
- [ ] 9.7 Archive all critical assessment documents
