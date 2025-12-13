# API Verify - Implementation Verification (Phase 10) v3.0

**Usage:** `/hustle-api-verify [endpoint-name]`

**Purpose:** Manually trigger Phase 10 verification - re-research documentation and compare to implementation to catch memory-based errors.

## When to Use

- After tests pass (TDD Green complete)
- Before proceeding to Refactor phase
- When unsure if implementation matches documentation
- After significant time has passed since initial research

## Verification Process

### Step 1: Re-Read Original Documentation

```
┌────────────────────────────────────────────────────────────┐
│ RE-RESEARCHING DOCUMENTATION                               │
│                                                            │
│ Fetching current documentation for: [endpoint-name]        │
│                                                            │
│ Sources:                                                   │
│ - Context7: [library-name]                                 │
│ - Official docs: [URL]                                     │
│ - Cached research: .claude/research/[api]/CURRENT.md       │
│                                                            │
│ Freshness: [X days old]                                    │
└────────────────────────────────────────────────────────────┘
```

### Step 2: Feature-by-Feature Comparison

```
┌────────────────────────────────────────────────────────────┐
│ IMPLEMENTATION VERIFICATION                                │
│                                                            │
│ Comparing documentation to implementation:                 │
│                                                            │
│ │ Feature         │ In Docs │ Implemented │ Status        │
│ ├─────────────────┼─────────┼─────────────┼───────────────│
│ │ domain param    │ ✓       │ ✓           │ ✅ Match      │
│ │ format param    │ 4 opts  │ 3 opts      │ ⚠️ Missing    │
│ │ quality range   │ 1-100   │ 1-100       │ ✅ Match      │
│ │ size param      │ ✓       │ ✗           │ ⚠️ Missing    │
│ │ webhook support │ ✓       │ ✗           │ ℹ️ Intentional │
│ │ batch mode      │ ✓       │ ✗           │ ℹ️ Intentional │
│                                                            │
│ MATCHES: 2                                                 │
│ MISSING: 2                                                 │
│ INTENTIONAL OMISSIONS: 2                                   │
└────────────────────────────────────────────────────────────┘
```

### Step 3: Gap Analysis

For each discrepancy:

```
┌────────────────────────────────────────────────────────────┐
│ GAP #1: format parameter                                   │
│                                                            │
│ Documentation says: ["json", "svg", "png", "raw"]          │
│ Implementation has:  ["json", "svg", "png"]                │
│                                                            │
│ Missing: "raw" format                                      │
│                                                            │
│ Action?                                                    │
│ [x] Fix - Add "raw" format support                         │
│ [ ] Skip - Mark as intentional omission                    │
│ [ ] Defer - Add to backlog for later                       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ GAP #2: size parameter                                     │
│                                                            │
│ Documentation says: size parameter exists (16-4096)        │
│ Implementation has:  not implemented                       │
│                                                            │
│ Action?                                                    │
│ [x] Fix - Add size parameter                               │
│ [ ] Skip - Mark as intentional omission                    │
│ [ ] Defer - Add to backlog for later                       │
└────────────────────────────────────────────────────────────┘
```

### Step 4: Loop Back or Proceed

```
┌────────────────────────────────────────────────────────────┐
│ VERIFICATION SUMMARY                                       │
│                                                            │
│ Gaps to fix: 2                                             │
│ Intentional omissions: 2                                   │
│                                                            │
│ DECISION:                                                  │
│                                                            │
│ [x] Fix gaps → Return to TDD Red (write tests for gaps)    │
│ [ ] Skip all → Document as omissions, proceed to Refactor  │
└────────────────────────────────────────────────────────────┘
```

## State File Updates

```json
{
  "phases": {
    "verify": {
      "status": "complete",
      "gaps_found": 2,
      "gaps_fixed": 2,
      "intentional_omissions": [
        {
          "feature": "webhook support",
          "reason": "User declined in interview",
          "documented_at": "..."
        },
        {
          "feature": "batch mode",
          "reason": "Out of scope for v1",
          "documented_at": "..."
        }
      ],
      "re_research_done": true,
      "completed_at": "..."
    }
  }
}
```

## Verification Report

Creates: `.claude/research/[api-name]/verification.md`

```markdown
# Verification Report: [API Name]

**Date:** [current-date]
**Implementation File:** src/app/api/v2/[endpoint]/route.ts
**Test File:** src/app/api/v2/[endpoint]/__tests__/[endpoint].api.test.ts

## Documentation Sources Re-Checked

| Source | URL | Checked |
|--------|-----|---------|
| Official docs | [URL] | ✓ |
| Context7 | [library] | ✓ |
| Cached research | .claude/research/[api]/CURRENT.md | ✓ |

## Feature Comparison

| Feature | In Docs | Implemented | Status |
|---------|---------|-------------|--------|
| domain param | ✓ | ✓ | ✅ Match |
| format param | 4 options | 3 options | ⚠️ Fixed |
| size param | ✓ | ✓ | ⚠️ Fixed |
| webhook | ✓ | ✗ | ℹ️ Intentional |

## Gaps Fixed

1. **format parameter** - Added "raw" format support
   - Test added: test/format-raw.test.ts:15
   - Implementation: route.ts:45

2. **size parameter** - Added size validation
   - Test added: test/size-param.test.ts:10
   - Implementation: route.ts:52

## Intentional Omissions

1. **webhook support**
   - Reason: User declined in interview (Phase 4)
   - Decision recorded: api-dev-state.json
   - May add in v2

2. **batch mode**
   - Reason: Out of scope for initial release
   - Documented for future consideration

## Verification Result

- **Status:** PASSED
- **All documented features accounted for**
- **Ready for Refactor phase**
```

## Hook Integration

This command is normally triggered automatically by `verify-after-green.py` hook after tests pass.

Manual invocation is useful when:
- Hook was skipped or didn't trigger
- Want to re-verify after changes
- Research is stale and needs refresh

## Workflow Position

```
Phase 8: TDD Red (write tests)
    │
    ▼
Phase 9: TDD Green (implementation)
    │
    ▼
Phase 10: VERIFY ← /hustle-api-verify triggers this
    │
    ├─► Gaps found? → Loop back to Phase 8
    │
    └─► All verified → Proceed to Phase 11 (Refactor)
```

<claude-commands-template>
## Verification Guidelines

1. **Re-read, don't remember** - Fresh fetch of docs every time
2. **Feature-by-feature** - Systematic comparison
3. **Document omissions** - Intentional != forgotten
4. **Loop back for gaps** - Return to TDD Red if fixes needed
5. **Update state file** - Track everything
6. **Create verification report** - Audit trail

## Common Gaps to Check

- Parameter counts match?
- Enum options complete?
- Range boundaries correct?
- Error codes handled?
- Optional features accounted for?
- Default values match docs?
</claude-commands-template>
