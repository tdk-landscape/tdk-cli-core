# Critical Assessment: Deduplication and DRY Implementation

**Subagent:** 1 - Deduplication and DRY Implementation  
**Date:** 2026-05-04  
**Scope:** TDK CLI (`cli/src/`)  
**Tool Used:** jscpd v4.0.5  

---

## Executive Summary

jscpd analysis reveals **10 code clones** across 38 TypeScript files (5,589 total lines), with **1.25% duplication rate** (70 duplicated lines, 592 tokens). While this is relatively low, several high-impact duplication patterns exist that significantly impact maintainability.

---

## Current State: Identified Duplication Patterns

### 1. Error Display Logic Duplication ⚠️ HIGH IMPACT
**Location:** `cli/src/utils/errors.ts`

**Duplication:**
- `TdkError.display()` method (lines 31-41)
- `showError()` function (lines 124-141)

**Identical Pattern:**
```typescript
// Both functions implement the same error display pattern:
console.error(chalk.red(`❌ ${message}`));

if (suggestions?.length > 0) {
  console.error(chalk.yellow('\n💡 Suggestions:'));
  suggestions.forEach(s => {
    console.error(chalk.cyan(`   → ${s}`));
  });
}
```

**Impact:** Changes to error display formatting must be made in two places. Risk of inconsistency.

---

### 2. Tilt Args Building Duplication ⚠️ HIGH IMPACT
**Location:** `cli/src/utils/tilt.ts`

**Duplication:**
- `buildTiltUpArgs()` (lines 100-123)
- `buildTiltDownArgs()` (lines 125-138)

**Identical Pattern:**
```typescript
// Both functions duplicate:
const tiltfilePath = getTiltfilePath();  // Line 110 and 131
args.push('-f', tiltfilePath);          // Line 111 and 132
```

**Impact:** Changes to Tiltfile path resolution must be updated in both functions.

---

### 3. Stack Name Extraction Duplication ⚠️ HIGH IMPACT
**Location:** Multiple files

**Duplication A:**
- `extractStackNames()` in `cli/src/utils/command-helpers.ts` (lines 37-45)
- `getAllStacks()` in `cli/src/utils/services.ts` (lines 95-106)

**Identical Implementation:**
```typescript
const stacks = new Set<string>();
for (const resource of resources) {
  if (resource.stack) {
    stacks.add(resource.stack);
  }
}
return Array.from(stacks).sort();
```

**Duplication B:**
- `groupResourcesByStack()` in `command-helpers.ts` (lines 51-65)
- Logic in `createDiscoveryContext()` in `discovery-context.ts` (lines 33-40)
- Logic in `discoverStacks()` in `services.ts` (lines 108-134)

---

### 4. Resource Filtering Duplication ⚠️ MEDIUM IMPACT
**Location:** Multiple files

**Duplication:**
- `filterResourcesByStack()` in `command-helpers.ts` (lines 30-35)
- `getResourcesForStack()` in `services.ts` (lines 136-139)
- `getUnassignedResources()` in `command-helpers.ts` (lines 47-49)

**Identical Pattern:**
```typescript
return resources.filter(r => r.stack === stackName);  // Used 3+ times
```

---

### 5. Command Execution Pattern Duplication
**Location:** `cli/src/commands/networks.ts` vs `cli/src/utils/tilt.ts`

**Duplication:**
- `execSafe()` in `networks.ts` (lines 14-43) - Promise wrapper for spawn
- `runTilt()` in `tilt.ts` (lines 30-84) - Promise wrapper for spawn

**Similar Pattern:** Both handle:
- stdout/stderr accumulation
- close/error event handling
- Exit code processing

---

### 6. Test Setup Duplication (Low Priority)
**Location:** `cli/src/commands/__tests__/resource.test.ts`

jscpd detected 5 internal duplications in test file - mostly repeated assertion patterns for similar test cases (service.json validation for backend/frontend/worker).

---

## Impact Analysis

### Maintainability Impact

| Pattern | Impact Level | Files Affected | Risk if Not Consolidated |
|---------|--------------|----------------|-------------------------|
| Error Display | HIGH | 1 (internal) | Inconsistent UX, formatting drift |
| Tilt Args | MEDIUM | 1 (internal) | Path resolution bugs in one place only |
| Stack Extraction | HIGH | 3 files | Logic divergence, sorting inconsistencies |
| Resource Filter | MEDIUM | 3 functions | Behavior differences, bugs in filtering |
| Command Execution | LOW | 2 files | Feature parity issues |

### Code Complexity Impact

- **Cognitive Load:** Developers must remember multiple implementations of the same logic
- **Testing Burden:** Same logic tested multiple times across different functions
- **Documentation:** Multiple places to document the same behavior

---

## High-Confidence Recommendations

### Recommendation 1: Consolidate Error Display (CONFIDENCE: 95%)
**Action:** Make `TdkError.display()` use `showError()` internally or vice versa

**Implementation:**
```typescript
// Option A: TdkError.display() delegates to showError
display(): void {
  showError(this.message, undefined, this.suggestions);
}
```

**Risk:** LOW - Both functions have identical output behavior
**Files to Change:** `cli/src/utils/errors.ts` only
**Lines Reduced:** ~15 lines

---

### Recommendation 2: Extract Tiltfile Path Helper (CONFIDENCE: 95%)
**Action:** Extract common tiltfile path retrieval into helper

**Implementation:**
```typescript
// Add to tilt.ts
function addTiltfilePath(args: string[]): void {
  const tiltfilePath = getTiltfilePath();
  args.push('-f', tiltfilePath);
}
```

**Risk:** LOW - Pure extraction, no behavior change
**Files to Change:** `cli/src/utils/tilt.ts` only
**Lines Reduced:** ~5 lines

---

### Recommendation 3: Remove Duplicate from command-helpers.ts (CONFIDENCE: 90%)
**Action:** `command-helpers.ts` duplicates exist in `services.ts` - remove from command-helpers

**Functions to Remove/Delegate:**
1. `extractStackNames()` → use `getAllStacks()` from services.ts
2. `filterResourcesByStack()` → use `getResourcesForStack()` from services.ts
3. `groupResourcesByStack()` → already exists in `createDiscoveryContext()`
4. `getUnassignedResources()` → inline the one-liner where used

**Risk:** MEDIUM-LOW - Need to update imports in consuming files
**Files to Change:** 
- `cli/src/utils/command-helpers.ts` (remove functions)
- Any files importing these functions (update imports)
**Lines Reduced:** ~40 lines

---

### Recommendation 4: Consolidate Discovery Context Building (CONFIDENCE: 85%)
**Action:** `createDiscoveryContext()` duplicates logic from `discoverStacks()` and `getAllStacks()`

**Implementation:**
```typescript
export function createDiscoveryContext(forceRefresh = false): DiscoveryContext {
  if (!forceRefresh && isCacheValid() && cachedContext) {
    return cachedContext;
  }

  const resources = discoverResources();
  const stacks = discoverStacks();  // Already builds resourcesByStack
  const stackNames = getAllStacks(resources);  // Use shared function
  
  // Derive unassigned from existing data
  const unassignedResources = resources.filter(r => !r.stack);
  
  // Derive resourcesByStack from stacks data
  const resourcesByStack = new Map<string, DiscoveredResource[]>();
  for (const stack of stacks) {
    resourcesByStack.set(stack.name, stack.resources);
  }

  // ... rest unchanged
}
```

**Risk:** MEDIUM - Logic consolidation, need to verify stack.resources contains all needed data
**Files to Change:** `cli/src/utils/discovery-context.ts`
**Lines Reduced:** ~10 lines

---

## Risk Assessment

### Low Risk (Safe to Implement)
1. **Error display consolidation** - Pure delegation, no external API change
2. **Tiltfile path extraction** - Internal helper only

### Medium Risk (Requires Verification)
3. **Removing command-helpers duplicates** - Need to check all imports
   - Files that may import these: `projects.ts`, `stacks.ts`, `stack.ts`, `resources.ts`

### Requires Testing
4. **Discovery context consolidation** - Verify behavior parity
   - Test: Ensure `resourcesByStack` mapping is identical before/after

---

## Implementation Priority

1. **P0 (Implement First):** Error display consolidation - safest win
2. **P1:** Tiltfile path extraction - simple extraction
3. **P2:** Remove command-helpers duplicates - clean up API surface
4. **P3:** Discovery context consolidation - requires testing

---

## Files Requiring Changes

| File | Changes | Risk Level |
|------|---------|------------|
| `cli/src/utils/errors.ts` | Consolidate display logic | LOW |
| `cli/src/utils/tilt.ts` | Extract helper function | LOW |
| `cli/src/utils/command-helpers.ts` | Remove duplicate functions | MEDIUM |
| `cli/src/utils/discovery-context.ts` | Refactor to use shared logic | MEDIUM |
| `cli/src/commands/projects.ts` | Update imports if needed | LOW |
| `cli/src/commands/stacks.ts` | Update imports if needed | LOW |

---

## Verification Checklist

After implementation:
- [ ] All tests pass (`bun test`)
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] Error display looks identical to before
- [ ] Tilt commands work correctly
- [ ] Stack listing shows same output
- [ ] Resource filtering returns same results

---

## Metrics

| Metric | Before | After (Projected) |
|--------|--------|-------------------|
| Duplicated Lines | 70 (1.25%) | ~35 (0.6%) |
| Duplicate Clones | 10 | ~5 |
| Utils API Surface | 15 functions | ~11 functions |
| Lines in command-helpers.ts | 80 | ~40 |

---

*Assessment generated by Subagent 1 (Deduplication)*  
*Next step: Implement high-confidence recommendations (P0-P2)*
