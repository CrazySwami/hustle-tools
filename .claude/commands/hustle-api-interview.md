# API Interview - Research-Driven Dynamic Discovery v3.0

**Usage:** `/hustle-api-interview [endpoint-name]`

**Purpose:** Conduct structured interview where questions are GENERATED FROM research findings, not generic templates. Every question is specific to the discovered API capabilities.

## Key Principle: Questions FROM Research

**OLD WAY (Generic Templates):**
```
"Which AI provider should this endpoint support?"
- OpenAI
- Anthropic
- Google
```

**NEW WAY (From Research):**
```
Based on research, Brandfetch API has 7 parameters:

1. DOMAIN (required) - string
   → No question needed (always required)

2. FORMAT: ["json", "svg", "png", "raw"]
   Q: Which formats do you need?
   [x] json  [x] svg  [x] png  [ ] raw

3. QUALITY: 1-100 (continuous range)
   Q: How should we TEST this continuous parameter?
   [ ] All values (100 tests)
   [x] Boundary (1, 50, 100)
   [ ] Sample (1, 25, 50, 75, 100)
   [ ] Custom: ____
```

## Interview Flow

### PREREQUISITE - Research Must Be Complete (Phase 3)

**Interview is BLOCKED until research is done.**

The interview READS from the research findings:
```
State file shows:
  research_initial.status = "complete"
  research_initial.sources = [...]

Discovered parameters:
  - 5 required parameters
  - 12 optional parameters
  - 3 enum types
  - 2 continuous ranges
```

### Parameter-Based Questions

For each discovered parameter, generate an appropriate question:

#### Required Parameters (Confirmation Only)
```
┌────────────────────────────────────────────────────────────┐
│ REQUIRED PARAMETERS                                        │
│                                                            │
│ These parameters are required by the API:                  │
│                                                            │
│ 1. domain (string) - The domain to fetch brand data for   │
│ 2. apiKey (string) - Your Brandfetch API key              │
│                                                            │
│ Confirm these are understood? [Y/n]                        │
└────────────────────────────────────────────────────────────┘
```

#### Enum Parameters (Multi-Select)
```
┌────────────────────────────────────────────────────────────┐
│ FORMAT PARAMETER                                           │
│                                                            │
│ Research found these format options:                       │
│                                                            │
│ [x] json   - Structured JSON response                      │
│ [x] svg    - Vector logo format                            │
│ [x] png    - Raster logo format                            │
│ [ ] raw    - Raw API response (advanced)                   │
│                                                            │
│ Which formats should we support?                           │
└────────────────────────────────────────────────────────────┘
```

#### Continuous Parameters (Test Strategy)
```
┌────────────────────────────────────────────────────────────┐
│ QUALITY PARAMETER                                          │
│                                                            │
│ Research found: quality is a continuous range 1-100        │
│                                                            │
│ How should we TEST this parameter?                         │
│                                                            │
│ [ ] All values (100 tests - comprehensive but slow)        │
│ [x] Boundary (1, 50, 100 - 3 tests)                        │
│ [ ] Sample (1, 25, 50, 75, 100 - 5 tests)                  │
│ [ ] Custom values: ____                                    │
│                                                            │
│ Your testing strategy affects test count.                  │
└────────────────────────────────────────────────────────────┘
```

#### Boolean Parameters (Enable/Disable)
```
┌────────────────────────────────────────────────────────────┐
│ INCLUDE_COLORS PARAMETER                                   │
│                                                            │
│ Research found: includeColors (boolean, default: true)     │
│                                                            │
│ Should we expose this parameter?                           │
│                                                            │
│ [x] Yes - Let users toggle it                              │
│ [ ] No - Use default (true) always                         │
│ [ ] Hardcode to: ____                                      │
└────────────────────────────────────────────────────────────┘
```

### Feature Questions

Based on discovered features, ask about priorities:

```
┌────────────────────────────────────────────────────────────┐
│ DISCOVERED FEATURES                                        │
│                                                            │
│ Research found these features. Mark priorities:            │
│                                                            │
│ [x] Basic brand fetch - Get logo, colors, fonts            │
│ [x] Multiple formats - Support json, svg, png              │
│ [ ] Webhook callbacks - Async notification (skip for now)  │
│ [ ] Batch processing - Multiple domains at once            │
│ [x] Error handling - Graceful degradation                  │
│                                                            │
│ Confirm feature scope?                                     │
└────────────────────────────────────────────────────────────┘
```

### Error Handling Questions

```
┌────────────────────────────────────────────────────────────┐
│ ERROR HANDLING                                             │
│                                                            │
│ Research found these error cases in the API:               │
│                                                            │
│ - 400: Invalid domain format                               │
│ - 401: Invalid API key                                     │
│ - 404: Brand not found                                     │
│ - 429: Rate limit exceeded                                 │
│ - 500: Server error                                        │
│                                                            │
│ How should we handle rate limits (429)?                    │
│                                                            │
│ [x] Retry with exponential backoff                         │
│ [ ] Return error immediately                               │
│ [ ] Queue and retry later                                  │
│ [ ] Custom: ____                                           │
└────────────────────────────────────────────────────────────┘
```

### Deep Research Proposal (Phase 5)

After interview, propose additional research:

```
┌────────────────────────────────────────────────────────────┐
│ PROPOSED DEEP RESEARCH                                     │
│                                                            │
│ Based on your selections, I recommend researching:         │
│                                                            │
│ [x] Rate limiting behavior                                 │
│     Reason: You selected "retry with backoff"              │
│                                                            │
│ [x] SVG optimization                                       │
│     Reason: You selected SVG format                        │
│                                                            │
│ [ ] Webhook format                                         │
│     Reason: You skipped webhook feature                    │
│                                                            │
│ Approve these searches? [Y]                                │
│ Add more: ____                                             │
│ Skip and proceed: [n]                                      │
└────────────────────────────────────────────────────────────┘
```

## Question Types Summary

| Discovered Type | Question Type | Example |
|----------------|---------------|---------|
| Required param | Confirmation | "Confirm these are understood?" |
| Enum param | Multi-select | "Which formats to support?" |
| Continuous range | Test strategy | "How to test 1-100 range?" |
| Boolean param | Enable/disable | "Expose this parameter?" |
| Optional feature | Priority | "Include this feature?" |
| Error case | Handling strategy | "How to handle rate limits?" |

## State Tracking

All decisions are saved to `.claude/api-dev-state.json`:

```json
{
  "phases": {
    "interview": {
      "status": "complete",
      "questions": [
        {
          "parameter": "format",
          "type": "enum",
          "options": ["json", "svg", "png", "raw"],
          "selected": ["json", "svg", "png"],
          "timestamp": "..."
        },
        {
          "parameter": "quality",
          "type": "continuous",
          "range": [1, 100],
          "test_strategy": "boundary",
          "test_values": [1, 50, 100],
          "timestamp": "..."
        }
      ],
      "decisions": {
        "format": ["json", "svg", "png"],
        "quality_testing": "boundary",
        "quality_values": [1, 50, 100],
        "rate_limit_handling": "exponential_backoff"
      }
    }
  }
}
```

## Output

Creates: `.claude/research/[api-name]/interview.md`

```markdown
# Interview: [API Name]

**Date:** [current-date]
**Research Sources:** [list from research phase]
**Status:** Interview Complete

## Discovered Parameters

| Parameter | Type | Required | Decision |
|-----------|------|----------|----------|
| domain | string | Yes | Always required |
| format | enum | No | json, svg, png |
| quality | 1-100 | No | Boundary testing: 1, 50, 100 |

## Feature Scope

| Feature | Included | Reason |
|---------|----------|--------|
| Basic fetch | Yes | Core functionality |
| Multiple formats | Yes | User selected |
| Webhooks | No | Deferred to v2 |

## Test Strategy

- Enum parameters: Test all selected values
- Continuous parameters: Boundary testing (3 values)
- Error cases: 400, 401, 404, 429, 500

## Decisions Summary

```json
{
  "format": ["json", "svg", "png"],
  "quality_testing": "boundary",
  "rate_limit_handling": "exponential_backoff"
}
```

## Deep Research Approved

- Rate limiting behavior (for retry logic)
- SVG optimization (for SVG format)

## Open Questions

[Any remaining ambiguities]
```

## Integration with Hooks

The `enforce-interview.py` hook injects these decisions when Claude tries to write implementation:

```
INTERVIEW CONTEXT REMINDER

When implementing, remember user decisions:
- format: ["json", "svg", "png"] (raw excluded)
- quality: boundary testing (1, 50, 100)
- rate limits: exponential backoff

Source: .claude/api-dev-state.json
```

<claude-commands-template>
## Interview Guidelines v3.0

1. **Questions FROM Research** - Never use generic templates
2. **Parameter-Specific** - Each discovered param gets appropriate question
3. **Test Strategy for Continuous** - Ask how to test ranges
4. **Track Decisions** - Save everything to state file
5. **Propose Deep Research** - Based on selections
6. **No Skipped Parameters** - Every discovered param must have a decision

## Question Generation Rules

| If research finds... | Then ask... |
|---------------------|-------------|
| Enum with 3+ options | Multi-select: which to support |
| Continuous range | Test strategy: all/boundary/sample |
| Boolean param | Enable/disable/hardcode |
| Optional feature | Include/exclude/defer |
| Error case | Handling strategy |

## After Interview

- Decisions saved to state file
- Decisions injected during implementation via hook
- Consistency between interview answers and code enforced
</claude-commands-template>
