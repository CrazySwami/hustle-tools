# API Research - Adaptive Documentation Discovery v3.0

**Usage:** `/hustle-api-research [library-or-service-name]`

**Purpose:** Research external APIs and SDKs using an adaptive, propose-approve flow (not shotgun searches).

## Key Principle: Adaptive Research

**NOT shotgun research** - We don't blindly run 20 searches.

**Adaptive flow:**
1. Run 2-3 initial searches
2. Summarize findings
3. PROPOSE additional searches based on context
4. User approves/modifies proposals
5. Execute approved searches
6. Repeat until complete

## Research Phases

### Initial Discovery (Automatic)

Run 2-3 targeted searches:
```
- Context7: "[library-name]" (if SDK/library)
- WebSearch: "[name] official documentation"
- WebSearch: "site:[domain] api reference" (if known domain)
```

Present initial summary:
```
┌────────────────────────────────────────────────────────────┐
│ INITIAL RESEARCH: [library-name]                           │
│                                                            │
│ │ Source              │ Status                             │
│ ├─────────────────────┼────────────────────────────────────│
│ │ Official docs       │ ✓ Found: [URL]                     │
│ │ API Reference       │ ✓ REST v2 documented               │
│ │ Auth method         │ ✓ Bearer token / API key           │
│ │ TypeScript types    │ ? Not confirmed                    │
│ │ npm package         │ ? Not searched                     │
│                                                            │
│ Discovered parameters: 5 required, 12 optional             │
│                                                            │
│ Proceed to interview? [Y]                                  │
│ Search more first? [n] → What? ____                        │
└────────────────────────────────────────────────────────────┘
```

### Deep Research (Proposed)

After interview, PROPOSE targeted searches based on user's selections:

```
┌────────────────────────────────────────────────────────────┐
│ PROPOSED DEEP RESEARCH                                     │
│                                                            │
│ Based on interview answers, I recommend researching:       │
│                                                            │
│ [x] Error response format                                  │
│     Reason: You selected "comprehensive error handling"    │
│                                                            │
│ [x] Rate limiting behavior                                 │
│     Reason: You selected "short cache" / high frequency    │
│                                                            │
│ [ ] Webhook support                                        │
│     Reason: You didn't select async/webhook features       │
│                                                            │
│ [x] SVG optimization options                               │
│     Reason: You selected SVG output format                 │
│                                                            │
│ [x] Batch processing                                       │
│     Reason: You mentioned "multiple domains at once"       │
│                                                            │
│ Approve these searches? [Y]                                │
│ Add more: ____                                             │
│ Skip and proceed: [n]                                      │
└────────────────────────────────────────────────────────────┘
```

### Execute Approved Searches

Only run searches that were explicitly approved:
- Track which searches were proposed vs approved vs skipped
- Log everything to state file for transparency

```json
{
  "research_deep": {
    "proposed_searches": [
      "error response format",
      "rate limiting behavior",
      "webhook support",
      "SVG optimization options",
      "batch processing"
    ],
    "approved_searches": [
      "error response format",
      "rate limiting behavior",
      "SVG optimization options",
      "batch processing"
    ],
    "skipped_searches": [
      "webhook support"
    ]
  }
}
```

## Research Caching & Freshness

Research is cached in `.claude/research/[api-name]/`:

```
.claude/research/
├── brandfetch/
│   ├── 2025-12-08_initial.md    # Timestamped snapshot
│   ├── 2025-12-08_deep.md       # Deep research after interview
│   └── CURRENT.md               # Latest (copy or symlink)
├── vercel-ai-sdk/
│   ├── providers/               # Complex APIs get subfolders
│   │   ├── openai.md
│   │   ├── anthropic.md
│   │   └── groq.md
│   └── CURRENT.md
└── index.json                   # Catalog with freshness
```

### Freshness Tracking

```json
{
  "brandfetch": {
    "last_updated": "2025-12-08",
    "current_file": "brandfetch/CURRENT.md",
    "days_old": 0,
    "parameters_discovered": 7,
    "source_urls": ["https://docs.brandfetch.com"]
  }
}
```

**Freshness Rule:** If research is >7 days old when referenced:
```
⚠️ Research for "brandfetch" is 15 days old.
Re-research before using? [Y/n]
```

## Output Format

Creates: `.claude/research/[library-name]/CURRENT.md`

```markdown
# Research: [Library/Service Name]

**Date:** [current-date]
**Version:** [version-number]
**Status:** Research Complete
**Freshness:** 0 days (valid for 7 days)

## 1. Official Documentation Links
- Main docs: [URL]
- API reference: [URL]
- GitHub repo: [URL]
- npm package: [URL]
- TypeScript types: [URL]

## 2. Installation & Setup
### Installation
```bash
[installation command]
```

### Environment Variables
```env
[required env vars]
```

### API Key Setup
[How to obtain and configure]

## 3. Complete Request Schema
### Required Parameters
| Parameter | Type | Description | Validation |
|-----------|------|-------------|------------|
| [name] | [type] | [desc] | [rules] |

### Optional Parameters
| Parameter | Type | Default | Description | Notes |
|-----------|------|---------|-------------|-------|
| [name] | [type] | [default] | [desc] | [notes] |

### Continuous Parameters (for test strategy)
| Parameter | Type | Range | Suggested Test Values |
|-----------|------|-------|----------------------|
| quality | number | 1-100 | 1, 50, 100 (boundary) |
| timeout | number | 1000-30000 | 1000, 15000, 30000 |

## 4. Complete Response Schema
### Success Response
[TypeScript interface]

### Error Response
[TypeScript interface with error codes]

## 5. Features & Capabilities
### Core Features (Discovered)
- [x] [Feature 1]: [description]
- [x] [Feature 2]: [description]

### Features NOT Implemented (Intentional)
- [ ] [Feature]: [reason for exclusion]

## 6. Limitations & Constraints
- Rate limits: [details]
- Size limits: [details]
- Timeout: [details]

## 7. Testing Considerations
- [ ] Test boundary values for continuous params
- [ ] Test all enum values
- [ ] Test error responses
- [ ] Test rate limiting behavior

## 8. Research Trail
### Searches Performed
| Search | Tool | Found |
|--------|------|-------|
| "[name] documentation" | WebSearch | ✓ |
| "[name]" | Context7 | ✓ |

### Proposed but Skipped
- "webhook support" - User declined, not needed
```

## Research-First Schema Design (MANDATORY)

### The Anti-Pattern: Schema-First Development

**NEVER DO THIS:**
- ❌ Define interfaces based on assumptions before researching
- ❌ Rely on training data for API capabilities
- ❌ Say "I think it supports..." without verification
- ❌ Build schemas from memory instead of documentation

### The Correct Pattern: Research-First

**ALWAYS DO THIS:**

1. **Research the Source of Truth**
   - Use Context7 for SDK docs
   - Use WebSearch for official docs
   - Check GitHub for current implementation

2. **Build Schema FROM Research**
   - Interface fields emerge from discovered capabilities
   - Every field has a source (docs, SDK types, API response)
   - Don't guess - verify each capability

3. **Verify with Phase 10**
   - After implementation, re-research
   - Compare docs to implementation
   - Fix gaps or document intentional omissions

## Research Query Tracking

All research is tracked in `.claude/api-dev-state.json`:

```json
{
  "research_queries": [
    {
      "timestamp": "2025-12-08T...",
      "tool": "WebSearch",
      "query": "Brandfetch API documentation",
      "terms": ["brandfetch", "api", "documentation"]
    },
    {
      "timestamp": "2025-12-08T...",
      "tool": "mcp__context7__get-library-docs",
      "library": "brandfetch",
      "terms": ["brandfetch"]
    }
  ],
  "phases": {
    "research_initial": {
      "status": "complete",
      "sources": [...],
      "summary_approved": true
    },
    "research_deep": {
      "status": "complete",
      "proposed_searches": [...],
      "approved_searches": [...],
      "skipped_searches": [...]
    }
  }
}
```

## Usage Examples

### Research with full flow
```bash
/hustle-api-research brandfetch
# → Initial search (2-3 queries)
# → Present summary, ask to proceed
# → Interview happens (separate phase)
# → Propose deep research based on interview
# → User approves/modifies
# → Execute approved searches
# → Cache results with freshness tracking
```

<claude-commands-template>
## Research Guidelines

1. **Start minimal** - 2-3 searches, not 20
2. **Propose before executing** - User controls depth
3. **Track everything** - State file logs all searches
4. **Cache with freshness** - 7-day validity
5. **Cite sources** - Every claim has a URL
6. **Distinguish proposed vs approved** - Transparency

## Integration with API Development

- Phase 3 of `/hustle-api-create` uses this for initial research
- Phase 5 uses adaptive proposal flow
- Phase 10 (Verify) triggers re-research
- Freshness check prevents stale data
</claude-commands-template>
