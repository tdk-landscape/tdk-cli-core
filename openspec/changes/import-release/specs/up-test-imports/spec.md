## ADDED Requirements

### Requirement: imports stay at the top
`cli/src/commands/__tests__/up.test.ts` MUST import `parseTiltPort`, `resolveTiltPort`, and `stopTiltForUp` in the top import block. No import statement may appear after a `vi.mock` call.

#### Scenario: file parses
- **GIVEN** the drift-gate suite is closed
- **WHEN** vitest loads `up.test.ts`
- **THEN** it does not report a parse error
