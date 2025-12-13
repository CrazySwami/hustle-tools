# API Status - Track Implementation Progress

**Usage:** `/hustle-api-status [endpoint-name]` or `/hustle-api-status --all`

**Purpose:** View and update API implementation status, track progress, and manage V2 migration.

## State File Integration

This command reads from `.claude/api-dev-state.json` which is automatically updated by the enforcement hooks.

### Reading Current State

**FIRST: Read the state file to understand current progress:**

```
Tool: Read
Path: .claude/api-dev-state.json
```

Parse the JSON and display a formatted status report showing:
- Current endpoint being worked on
- Phase completion status (scope, research, interview, TDD, docs)
- Sources consulted during research
- Timestamps for each phase
- Verification status

### Example State Display

```
📊 API Development Progress

Endpoint: stream-text
Library: vercel-ai-sdk
Started: 2025-12-06T20:00:00Z

PHASES:
  ✅ Scope defined (20:00:30)
  ✅ Initial research - 4 sources consulted (20:02:00)
  🔄 Interview - in progress
  ⬜ Deep research
  ⬜ Schema creation
  ⬜ Environment check
  ⬜ TDD Red
  ⬜ TDD Green
  ⬜ TDD Refactor
  ⬜ Documentation

RESEARCH SOURCES:
  • context7: @ai-sdk/core (20:01:00)
  • websearch: "Vercel AI SDK streamText 2025" (20:01:30)
  • webfetch: https://sdk.vercel.ai/docs (20:01:45)

VERIFICATION:
  ❌ All sources fetched: false
  ❌ Schema matches docs: false
  ❌ Tests cover params: false
  ❌ All tests passing: false
```

## What This Shows

### For Specific Endpoint
```
📊 Status: /api/v2/generate-css

Phase: ✅ Complete
Tests: 33/33 passing (100% coverage)
Documentation: ✅ Complete

Timeline:
✅ Interview completed (2025-12-06)
✅ Research completed (2025-12-06)
✅ Environment verified (2025-12-06)
✅ Tests written (Red phase)
✅ Implementation complete (Green phase)
✅ Refactored (Refactor phase)
✅ Documentation updated
✅ Committed to git

Files:
- Route: src/app/api/v2/generate-css/route.ts
- Tests: src/app/api/v2/generate-css/__tests__/generate-css.api.test.ts
- Docs: src/v2/docs/endpoints/generate-css.md
- Research: src/v2/docs/research/gemini-flash.md

Next Steps: None - endpoint complete
```

### For All Endpoints
```
📊 V2 API Implementation Status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ COMPLETE (2)
  • /api/v2/health (15 tests)
  • /api/v2/monitor (23 tests)

🚧 IN PROGRESS (1)
  • /api/v2/generate-css (interview complete, implementing)

📋 PLANNED (3)
  • /api/v2/generate-html
  • /api/v2/chat
  • /api/v2/scrape

❌ NOT STARTED (0)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary:
  Total endpoints: 6
  Complete: 2 (33%)
  In progress: 1 (17%)
  Planned: 3 (50%)
  Total tests: 38
  Coverage: 100%

Last updated: 2025-12-06
```

## Commands

### View Status
```bash
/hustle-api-status generate-css    # Specific endpoint
/hustle-api-status --all           # All endpoints
```

### Update Status
```bash
/hustle-api-status generate-css --phase=testing
/hustle-api-status generate-css --complete
```

## Status Tracking File

Updates: `/src/v2/docs/v2-api-implementation-status.md`

**Format:**
```markdown
# V2 API Implementation Status

**Last Updated:** 2025-12-06
**Total Endpoints:** 6
**Completed:** 2 (33%)

## Endpoints

### ✅ /api/v2/health
- **Status:** Complete
- **Tests:** 15/15 passing
- **Coverage:** 100%
- **Interview:** [Link to docs]
- **Implemented:** 2025-12-06
- **Purpose:** System health check with dependency validation

### 🚧 /api/v2/generate-css
- **Status:** In Progress (Testing)
- **Tests:** 20/33 passing
- **Coverage:** 85%
- **Interview:** [Link to docs]
- **Started:** 2025-12-06
- **Blocked by:** None
- **Next:** Complete remaining tests

### 📋 /api/v2/generate-html
- **Status:** Planned
- **Priority:** High
- **Dependencies:** None
- **Interview:** Not started
- **Estimated effort:** Medium
```

## Integration with Workflow

### After Interview
```bash
/hustle-api-interview generate-css
/hustle-api-status generate-css --phase=interview-complete
```

### After Research
```bash
/hustle-api-research gemini-flash
/hustle-api-status generate-css --phase=research-complete
```

### After TDD Cycle
```bash
/cycle generate CSS with Gemini
/hustle-api-status generate-css --complete
```

### Before Commit
```bash
pnpm test:run
/hustle-api-status --all  # Verify all green
/commit
```

## Automatic Updates

The `/hustle-api-create` command automatically updates status:
- Interview phase → "Interview Complete"
- Red phase → "Tests Written"
- Green phase → "Implementation Complete"
- Refactor phase → "Refactored"
- Documentation → "Documentation Updated"
- Commit → "Complete"

## Status Phases

1. **Not Started** - No work begun
2. **Interview Complete** - Understanding documented
3. **Research Complete** - External docs reviewed
4. **Environment Ready** - API keys verified
5. **Tests Written** - Red phase complete
6. **Implementation Complete** - Green phase complete
7. **Refactored** - Code cleaned up
8. **Documentation Updated** - Manifests updated
9. **Complete** - All tests passing, committed

## Reports

### Coverage Report
```bash
/hustle-api-status --coverage
```
Shows test coverage for all V2 endpoints.

### Migration Report
```bash
/hustle-api-status --migration
```
Shows progress from legacy to V2.

### Blockers Report
```bash
/hustle-api-status --blocked
```
Shows endpoints blocked by missing keys, dependencies, etc.

<claude-commands-template>
## Status Management

- Update status after each phase completion
- Keep v2-api-implementation-status.md current
- Use status to plan next work
- Reference in standup/progress reports
- Track blockers and dependencies

## Integration Points

- Used by /hustle-api-create to track progress
- Used by /commit to verify readiness
- Used by team to see what's done
- Used for planning future work
</claude-commands-template>
