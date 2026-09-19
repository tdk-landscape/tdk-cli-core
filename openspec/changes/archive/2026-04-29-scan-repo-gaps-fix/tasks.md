## 1. Codebase Audit

- [x] 1.1 Create audit script to scan for TODO/FIXME/BUG/HACK markers
- [x] 1.2 Run audit against cli/src directory (TypeScript files)
- [x] 1.3 Run audit against discovery/ directory (Python and Starlark files)
- [x] 1.4 Run audit against engine/ directory (Starlark files)
- [x] 1.5 Generate prioritized report with CLI, Core, and Test categories

## 2. CLI TODO Resolution

- [x] 2.1 Implement database check TODO in cli/src/commands/resource.ts
- [x] 2.2 Implement cache check TODO in cli/src/commands/resource.ts
- [x] 2.3 Implement routes TODO (generate route file template) in resource.ts
- [x] 2.4 Implement worker logic TODO (generate worker template) in resource.ts
- [x] 2.5 Implement diff logic TODO in cli/src/commands/config.ts

## 3. Test Coverage Improvements

- [x] 3.1 Add unit tests for resource.ts command (creation, templates, port assignment)
- [x] 3.2 Add unit tests for config.ts command (diff functionality)
- [x] 3.3 Add error handling tests for invalid resource types
- [x] 3.4 Add tests for missing/invalid manifest handling in discovery
- [x] 3.5 Run full test suite and fix any regressions

## 4. Dead Code Cleanup

- [x] 4.1 Identify and remove unused imports in cli/src TypeScript files
- [x] 4.2 Identify and flag unused functions in discovery/ Python files
- [x] 4.3 Identify and flag unused variables/functions in engine/ Starlark files
- [x] 4.4 Consolidate duplicate template patterns in CLI commands
- [x] 4.5 Move duplicated validation logic to shared utilities

## 5. Documentation and Finalization

- [x] 5.1 Document all changes in commit messages
- [x] 5.2 Update AGENTS.md files if implementation patterns changed
- [x] 5.3 Run final linting and type checking
- [x] 5.4 Verify all tests pass
- [x] 5.5 Archive the audit report for future reference
