# API Create - Comprehensive API Development Workflow v3.0

**Usage:** `/hustle-api-create [endpoint-name]`

**Purpose:** Orchestrates the complete API development workflow using interview-driven, research-first, test-first methodology with continuous verification loops.

## ⚠️ CRITICAL: MANDATORY USER INTERACTION

**YOU MUST USE THE `AskUserQuestion` TOOL AT EVERY CHECKPOINT.**

This workflow requires REAL user input at each phase. You are **FORBIDDEN** from:
- Self-answering questions
- Assuming user responses
- Proceeding without explicit user confirmation
- Making decisions on behalf of the user

### How to Ask Questions Correctly

At every `[Y/n]` or multiple-choice prompt in this workflow, you MUST call the `AskUserQuestion` tool with this EXACT schema:

```json
{
  "questions": [
    {
      "question": "Your question here? (must end with ?)",
      "header": "Phase",
      "multiSelect": false,
      "options": [
        {"label": "Option A", "description": "What this option means"},
        {"label": "Option B", "description": "What this option means"},
        {"label": "Other", "description": "I'll type my own answer"}
      ]
    }
  ]
}
```

**CRITICAL REQUIREMENTS:**
- `header`: Max 12 characters (e.g., "Scope", "Research", "Format")
- `options`: 2-4 options, each with `label` (1-5 words) and `description`
- `multiSelect`: Required boolean (true for checkboxes, false for radio)
- `question`: Must end with a question mark
- Users can always select "Other" to provide custom input

**WAIT for the user's response before proceeding.** The tool will show a UI dialog and pause execution until the user answers. Do NOT continue until you receive the response.

### Violation Detection

The enforcement hooks will BLOCK your progress if:
- `user_question_asked` is false for any phase
- `user_confirmed`/`user_approved`/`user_completed` is false
- `phase_exit_confirmed` is false (user must explicitly approve proceeding to next phase)
- Questions were not asked via the AskUserQuestion tool

If you see "BLOCKED" messages, it means you skipped user interaction.

### Phase Exit Confirmation (NEW in v3.5.0)

**Every phase requires an EXIT CONFIRMATION question** before proceeding to the next phase. This prevents Claude from self-answering and moving on without explicit user approval.

The exit confirmation question MUST:
1. Summarize what was accomplished in the current phase
2. Ask if user is ready to proceed to the next phase
3. Include options like "Yes, proceed", "No, I have changes", "Add more"

Example exit confirmation:
```json
{
  "questions": [{
    "question": "Phase complete. Research found 5 sources. Ready to proceed to Interview phase?",
    "header": "Proceed",
    "multiSelect": false,
    "options": [
      {"label": "Yes, proceed", "description": "Move to next phase"},
      {"label": "No, more research", "description": "I need additional research on [topic]"},
      {"label": "Review sources", "description": "Show me what was found"}
    ]
  }]
}
```

The `phase_exit_confirmed` flag is automatically set when:
1. An `AskUserQuestion` is called with a question containing words like "proceed", "continue", "ready", "confirm", "approve"
2. The user responds with an affirmative answer (yes, proceed, confirm, approve, etc.)

Both conditions must be true for the flag to be set.

---

## Key Principles

1. **Loop Until Green** - Every verification phase loops back if not successful
2. **Continuous Interviews** - Checkpoints at EVERY phase transition (USE AskUserQuestion!)
3. **Adaptive Research** - Propose searches based on context, not shotgun approach
4. **Self-Documenting** - State file captures everything for re-grounding
5. **Verify After Green** - Re-research docs to catch memory-based implementation errors

## Complete Phase Flow

```
/hustle-api-create [endpoint]
        │
        ▼
┌─ PHASE 1: DISAMBIGUATION ─────────────────────────────────┐
│ Search 3-5 variations of the term:                        │
│   • "[term]"                                              │
│   • "[term] API"                                          │
│   • "[term] SDK"                                          │
│   • "[term] npm package"                                  │
│                                                           │
│ ⚠️ REQUIRED: Use AskUserQuestion tool with EXACT schema:  │
│                                                           │
│   {                                                       │
│     "questions": [{                                       │
│       "question": "Which interpretation of [term]?",      │
│       "header": "Disambig",                               │
│       "multiSelect": false,                               │
│       "options": [                                        │
│         {"label": "REST API", "description": "Official API"},│
│         {"label": "SDK/Package", "description": "NPM wrapper"},│
│         {"label": "Both", "description": "API + SDK"}     │
│       ]                                                   │
│     }]                                                    │
│   }                                                      │
│                                                           │
│ WAIT for user response. Do NOT proceed without it.        │
│ ──── Loop back if user selects "Something else" ────      │
└───────────────────────────────────────────────────────────┘
        │ Clear
        ▼
┌─ PHASE 2: SCOPE ──────────────────────────────────────────┐
│                                                           │
│ Present your understanding, then:                         │
│                                                           │
│ ⚠️ REQUIRED: Use AskUserQuestion tool:                    │
│                                                           │
│   AskUserQuestion({                                       │
│     questions: [{                                         │
│       question: "I understand you want /api/v2/[endpoint] │
│                  to [purpose]. Using [external API].      │
│                  Is this correct?",                       │
│       header: "Scope",                                    │
│       options: [                                          │
│         "Yes, proceed",                                   │
│         "I have modifications to add",                    │
│         "No, let me clarify the purpose"                  │
│       ]                                                   │
│     }]                                                    │
│   })                                                      │
│                                                           │
│ WAIT for user response. Do NOT assume "yes".              │
│ ──── Loop back if user has modifications ────             │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ PHASE 3: INITIAL RESEARCH ───────────────────────────────┐
│                                                           │
│ Execute 2-3 initial searches:                             │
│   • Context7: "[library/api name]"                        │
│   • WebSearch: "[name] official documentation"            │
│   • WebSearch: "site:[domain] api reference"              │
│                                                           │
│ Present summary table, then:                              │
│                                                           │
│ ⚠️ REQUIRED: Use AskUserQuestion tool:                    │
│                                                           │
│   AskUserQuestion({                                       │
│     questions: [{                                         │
│       question: "Research summary above. Found [N]        │
│                  sources. Should I proceed or search      │
│                  for more?",                              │
│       header: "Research",                                 │
│       options: [                                          │
│         "Proceed to interview",                           │
│         "Search more - I need [specific topic]",          │
│         "Search for something specific (I'll describe)"   │
│       ]                                                   │
│     }]                                                    │
│   })                                                      │
│                                                           │
│ WAIT for user response. Do NOT auto-proceed.              │
│ ──── Loop back if user wants more research ────           │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ PHASE 4: INTERVIEW (Generated FROM Research) ────────────┐
│                                                           │
│ For EACH parameter discovered in research, ask ONE        │
│ question at a time using AskUserQuestion:                 │
│                                                           │
│ ⚠️ REQUIRED: Use AskUserQuestion for EACH question:       │
│                                                           │
│   // Question 1: Format preference                        │
│   AskUserQuestion({                                       │
│     questions: [{                                         │
│       question: "Which response formats do you need?",    │
│       header: "Format",                                   │
│       multiSelect: true,                                  │
│       options: ["JSON", "SVG", "PNG", "All formats"]      │
│     }]                                                    │
│   })                                                      │
│   // WAIT for response, record in state, then next Q      │
│                                                           │
│   // Question 2: Error handling                           │
│   AskUserQuestion({                                       │
│     questions: [{                                         │
│       question: "How should errors be handled?",          │
│       header: "Errors",                                   │
│       options: [                                          │
│         "Throw exceptions",                               │
│         "Return error objects",                           │
│         "Both (configurable)"                             │
│       ]                                                   │
│     }]                                                    │
│   })                                                      │
│   // Continue for ALL parameters...                       │
│                                                           │
│ After ALL questions answered:                             │
│                                                           │
│   AskUserQuestion({                                       │
│     questions: [{                                         │
│       question: "Interview complete. Your decisions:      │
│                  [summary]. All correct?",                │
│       header: "Confirm",                                  │
│       options: [                                          │
│         "Yes, proceed to schema",                         │
│         "Change an answer",                               │
│         "Add another question"                            │
│       ]                                                   │
│     }]                                                    │
│   })                                                      │
│                                                           │
│ Decisions saved to state file for consistency.            │
│ ──── Loop back if user wants to change answers ────       │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ PHASE 5: DEEP RESEARCH (Adaptive) ───────────────────────┐
│                                                           │
│ Based on interview answers, PROPOSE additional research.  │
│                                                           │
│ ⚠️ REQUIRED: Use AskUserQuestion tool:                    │
│                                                           │
│   AskUserQuestion({                                       │
│     questions: [{                                         │
│       question: "Based on your interview answers, I       │
│                  want to research: [list]. Approve?",     │
│       header: "Deep Research",                            │
│       options: [                                          │
│         "Yes, run these searches",                        │
│         "Add more - I also need [topic]",                 │
│         "Skip deep research, proceed to schema"           │
│       ]                                                   │
│     }]                                                    │
│   })                                                      │
│                                                           │
│ WAIT for user response. Do NOT auto-approve.              │
│ KEY: Research is PROPOSED, not automatic shotgun.         │
│ ──── Loop back if user wants to add topics ────           │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ PHASE 6: SCHEMA ─────────────────────────────────────────┐
│                                                           │
│ Create Zod schema from research + interview, then:        │
│                                                           │
│ ⚠️ REQUIRED: Use AskUserQuestion tool:                    │
│                                                           │
│   AskUserQuestion({                                       │
│     questions: [{                                         │
│       question: "Schema created based on your interview.  │
│                  [show schema]. Does this match your      │
│                  requirements?",                          │
│       header: "Schema",                                   │
│       options: [                                          │
│         "Yes, schema looks correct",                      │
│         "No, I need changes (I'll describe)",             │
│         "Let's redo the interview"                        │
│       ]                                                   │
│     }]                                                    │
│   })                                                      │
│                                                           │
│ WAIT for user response. Do NOT assume approval.           │
│ ──── Loop back if schema needs changes ────               │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ PHASE 7: ENVIRONMENT ────────────────────────────────────┐
│                                                           │
│ Check required API keys, show status table, then:         │
│                                                           │
│ ⚠️ REQUIRED: Use AskUserQuestion tool:                    │
│                                                           │
│   AskUserQuestion({                                       │
│     questions: [{                                         │
│       question: "Environment check: [N] keys found,       │
│                  [M] missing. Ready to start TDD?",       │
│       header: "Environment",                              │
│       options: [                                          │
│         "Yes, ready to write tests",                      │
│         "No, need to set up API keys first",              │
│         "No, need to fix something else"                  │
│       ]                                                   │
│     }]                                                    │
│   })                                                      │
│                                                           │
│ WAIT for user response. Do NOT auto-proceed.              │
│ ──── Loop back if keys missing ────                       │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ PHASE 8: TDD RED (Write Failing Tests) ──────────────────┐
│                                                           │
│ Generate test matrix from schema + interview, then:       │
│                                                           │
│ ⚠️ REQUIRED: Use AskUserQuestion tool:                    │
│                                                           │
│   AskUserQuestion({                                       │
│     questions: [{                                         │
│       question: "Test matrix: [N] test scenarios based    │
│                  on your interview. Covers: [list].       │
│                  Approve this test plan?",                │
│       header: "Tests",                                    │
│       options: [                                          │
│         "Yes, write these tests",                         │
│         "Add more scenarios (I'll describe)",             │
│         "Change a scenario (I'll describe)"               │
│       ]                                                   │
│     }]                                                    │
│   })                                                      │
│                                                           │
│ WAIT for user response. Do NOT auto-approve.              │
│ HOOK: PreToolUse blocks Write if no research/interview    │
│ ──── Loop back if user wants changes ────                 │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ PHASE 9: TDD GREEN (Minimal Implementation) ─────────────┐
│                                                           │
│ Write minimal code to pass ALL tests.                     │
│ Tests derived from schema.                                │
│ Implementation validates with schema.                     │
│                                                           │
│ Run tests → All must pass before proceeding.              │
│                                                           │
│ HOOK: PreToolUse blocks Write if test file doesn't exist  │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ PHASE 10: VERIFY (Re-Research After Green) ──────────────┐
│                                                           │
│ MANDATORY: Re-read original documentation.                │
│ Compare implementation to docs, then:                     │
│                                                           │
│ ⚠️ REQUIRED: Use AskUserQuestion tool:                    │
│                                                           │
│   AskUserQuestion({                                       │
│     questions: [{                                         │
│       question: "Verification found [N] gap(s) between    │
│                  docs and implementation: [list].         │
│                  How should I proceed?",                  │
│       header: "Verify",                                   │
│       options: [                                          │
│         "Fix gaps - loop back to Red phase",              │
│         "Skip - these are intentional omissions",         │
│         "Fix some, skip others (I'll specify)"            │
│       ]                                                   │
│     }]                                                    │
│   })                                                      │
│                                                           │
│ WAIT for user response. Do NOT auto-decide.               │
│ HOOK: PostToolUse triggers after test pass                │
│ ──── Loop back to Phase 8 if user wants fixes ────        │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ PHASE 11: TDD REFACTOR ──────────────────────────────────┐
│                                                           │
│ Clean up code while tests stay green:                     │
│   • Extract reusable patterns                             │
│   • Improve error messages                                │
│   • Add JSDoc comments                                    │
│   • Optimize performance                                  │
│                                                           │
│ Run tests after EVERY change → Must still pass.           │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ PHASE 12: DOCUMENTATION ─────────────────────────────────┐
│                                                           │
│ Update documentation files, then:                         │
│                                                           │
│ ⚠️ REQUIRED: Use AskUserQuestion tool:                    │
│                                                           │
│   AskUserQuestion({                                       │
│     questions: [{                                         │
│       question: "Documentation checklist: [list files].   │
│                  All documentation complete?",            │
│       header: "Docs",                                     │
│       options: [                                          │
│         "Yes, all documentation is done",                 │
│         "No, I need to add something (I'll describe)",    │
│         "Skip docs for now (not recommended)"             │
│       ]                                                   │
│     }]                                                    │
│   })                                                      │
│                                                           │
│ WAIT for user response. Do NOT auto-complete.             │
│ HOOK: Stop hook blocks if docs incomplete                 │
│ ──── Loop back if user needs to add docs ────             │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ PHASE 13: COMPLETION ────────────────────────────────────┐
│                                                           │
│ Final verification:                                       │
│   • All tests passing                                     │
│   • 100% coverage                                         │
│   • TypeScript compiles                                   │
│   • Docs updated                                          │
│   • State file shows all phases complete                  │
│                                                           │
│ Run /commit to create semantic commit.                    │
│                                                           │
│ API Showcase: http://localhost:3000/api-showcase          │
│ Your API is now available for interactive testing!       │
└───────────────────────────────────────────────────────────┘
```

### Showcase Redirect

After successful API creation, output:

```
Your API has been added to the showcase!

View it at: http://localhost:3000/api-showcase

Or run `pnpm dev` and navigate to /api-showcase to:
  - Test your API interactively
  - View auto-generated curl examples
  - See request/response schemas
```

Registry is automatically updated with the new API entry.

## State File Tracking

All phases are tracked in `.claude/api-dev-state.json`:

```json
{
  "endpoint": "brandfetch",
  "turn_count": 23,
  "phases": {
    "disambiguation": { "status": "complete" },
    "scope": { "status": "complete" },
    "research_initial": { "status": "complete", "sources": [...] },
    "interview": { "status": "complete", "decisions": {...} },
    "research_deep": { "status": "complete" },
    "schema_creation": { "status": "complete" },
    "environment_check": { "status": "complete" },
    "tdd_red": { "status": "complete", "test_count": 23 },
    "tdd_green": { "status": "complete" },
    "verify": { "status": "complete", "gaps_found": 2, "gaps_fixed": 2 },
    "tdd_refactor": { "status": "complete" },
    "documentation": { "status": "complete" }
  }
}
```

## Output Artifacts

This command creates:

1. **State File**: `.claude/api-dev-state.json` (tracks all progress)
2. **Research Cache**: `.claude/research/[api-name]/CURRENT.md`
3. **Route Handler**: `/src/app/api/v2/[endpoint-name]/route.ts`
4. **Test Suite**: `/src/app/api/v2/[endpoint-name]/__tests__/[endpoint-name].api.test.ts`
5. **OpenAPI Spec**: `/src/lib/openapi/endpoints/[endpoint-name].ts`
6. **Updated Manifests**:
   - `/src/app/api-test/api-tests-manifest.json`
   - `/src/v2/docs/v2-api-implementation-status.md`

## Hooks That Enforce This Workflow

| Phase | Hook | Purpose |
|-------|------|---------|
| 0 | `enforce-external-research.py` | Detects API terms, requires disambiguation |
| 2-4 | `track-tool-use.py` | Logs all research, tracks turns |
| 7-8 | `enforce-research.py` | Blocks Write if no research done |
| 7-8 | `enforce-interview.py` | Injects interview decisions |
| 8 | `verify-implementation.py` | Blocks route if no test file |
| 9 | `verify-after-green.py` | Triggers verification after tests pass |
| All | `periodic-reground.py` | Re-grounds every 7 turns |
| 11 | `api-workflow-check.py` | Blocks completion if docs incomplete |

<claude-commands-template>
## Project-Specific Rules

1. **API Location**: All V2 APIs go in `/src/app/api/v2/[endpoint-name]/`
2. **Testing**: Use Vitest, require 100% coverage
3. **Validation**: All requests/responses use Zod schemas
4. **AI SDK**: Use Vercel AI SDK 5.0.11 patterns from `/src/v2/docs/ai-sdk-catalog.json`
5. **Package Manager**: Use `pnpm` for all operations
6. **Documentation**: Follow patterns in `/src/v2/docs/Main Doc – V2 Development Patterns.md`
7. **API Keys**: Support three methods (env, NEXT_PUBLIC_, custom headers)
8. **Test Command**: `pnpm test:run` before commits

## Never Skip

- Phase 1 (Disambiguation) - Clarify before research
- Phase 3 (Initial Research) - Find ALL parameters
- Phase 4 (Interview) - Questions FROM research, not templates
- Phase 8 (TDD Red) - Failing tests FIRST
- Phase 10 (Verify) - Re-research after Green
- Phase 12 (Documentation) - Keep docs in sync
- Coverage verification - 100% required
</claude-commands-template>
