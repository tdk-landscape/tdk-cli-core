## Context

TDK CLI is a multi-language monorepo (TypeScript CLI, Python Discovery, Starlark Engine) that has grown organically. Previous cleanup efforts have addressed specific issues, but a comprehensive, systematic cleanup across all dimensions is needed.

**Current State:**
- Code duplication exists across CLI commands and utilities
- Type definitions are scattered and sometimes duplicated
- Unused imports and functions remain from refactors
- Circular dependencies exist in the module graph
- Weak types (`any`, `unknown`) are used extensively
- Defensive try/catch patterns hide errors unnecessarily
- Legacy fallback code remains from migrations
- AI-generated comments and stubs litter the codebase

**Previous Cleanup Work:**
- Dead code elimination assessment completed (2026-04-30)
- Circular dependency critical assessment completed (2026-05-01)
- Type assessment report available (2026-05-03)
- AI slop assessment completed (2026-05-03)
- Deduplication assessment completed

## Goals / Non-Goals

**Goals:**
- Achieve 100% DRY compliance for code patterns appearing 3+ times
- Consolidate all shared types into centralized type modules
- Remove 100% of verified unused code (knip + manual verification)
- Resolve all circular dependencies in the module graph
- Replace 95%+ of weak types with strong, researched types
- Remove all unnecessary defensive programming patterns
- Eliminate all deprecated, legacy, and fallback code
- Remove all AI slop, stubs, and unhelpful comments

**Non-Goals:**
- Complete rewrites of working functionality
- Breaking changes to public APIs
- Adding new features during cleanup
- Perfection at the cost of progress (80/20 rule applies)

## Decisions

**Decision 1: Research-First Approach for Types**
- **Rationale**: Weak types must be replaced with correct types, not guesses
- **Implementation**: Research actual runtime values, package types, and usage patterns before replacing `any`/`unknown`

**Decision 2: Verification Before Removal**
- **Rationale**: Dead code removal must not break working systems
- **Implementation**: Use knip for detection, then verify with manual analysis and tests before removal

**Decision 3: Parallel Subagent Execution**
- **Rationale**: 8 independent workstreams can proceed simultaneously
- **Implementation**: Each dimension has a dedicated subagent with clear scope

**Decision 4: Critical Assessment Required**
- **Rationale**: Each subagent must deeply understand current state before changing
- **Implementation**: Every subagent produces a critical assessment document before implementing

**Decision 5: High Confidence Only**
- **Rationale**: Low-confidence changes risk introducing bugs
- **Implementation**: Only implement recommendations with clear evidence and low risk

## Risks / Trade-offs

**Risk: Removing code that appears unused but is dynamically loaded**
- **Mitigation**: Manual verification beyond static analysis; test execution verification

**Risk: Type replacements break runtime behavior**
- **Mitigation**: Research actual values; use runtime checks if needed

**Risk: Circular dependency fixes require architectural changes**
- **Mitigation**: Document current state; propose minimal fixes; avoid major refactors

**Risk: Defensive programming removal exposes hidden bugs**
- **Mitigation**: Replace error-hiding with explicit error handling only where needed

**Risk: Scope creep across 8 dimensions**
- **Mitigation**: Strict boundaries per subagent; time-box each dimension

## Migration Plan

No user-facing migration needed. Internal changes only.

Deployment steps:
1. Execute all 8 subagents in parallel for research phase
2. Review all critical assessments
3. Implement high-confidence changes per dimension
4. Run full test suite after each dimension completes
5. Merge incrementally by dimension to limit blast radius

## Open Questions

1. Should we establish permanent tooling (knip, madge) in CI?
2. What's the policy for `any` types that are truly unavoidable?
3. Should we create a style guide to prevent future AI slop?
