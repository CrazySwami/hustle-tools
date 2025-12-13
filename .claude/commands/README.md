# Hustle Development Slash Commands v3.9.0

**Interview-driven, research-first API and UI development workflow with continuous verification loops**

## What's New in v3.9.0

- **`/hustle-ui-create`** - Create UI components and pages with 13-phase workflow
- **UI Showcase** - Auto-generated grid view with modal preview for all components/pages
- **API Showcase** - Auto-generated grid with interactive "Try It" API testing
- **Brand Guide** - Default `.claude/BRAND_GUIDE.md` template installed
- **Performance Budgets** - TDD gates for memory, re-renders, Core Web Vitals (tests FAIL if exceeded)
- **ShadCN Detection** - Phase 5 checks `src/components/ui/` for existing components
- **4-Step Verification** - Desktop/tablet/mobile + brand + tests + memory/re-renders
- **33 Enforcement Hooks** - Includes 6 new UI-specific hooks

## What's in v3.8.0

- **`/hustle-combine`** - Combine existing APIs into orchestration endpoints
- **Central Registry** - `.claude/registry.json` tracks all APIs, components, pages
- **Auto-Registry Update** - Registry populated when workflows complete
- **27 Enforcement Hooks** - Includes new `update-registry.py`

## What's in v3.7.0

- **Hustle Branding** - All API commands renamed to `/hustle-api-*` prefix
- **Session Logging** - Every workflow saved to `.claude/api-sessions/`
- **Session Continuation** - `/hustle-api-continue` to resume interrupted workflows
- **Multi-API Support** - State file supports multiple concurrent APIs
- **Comprehensive Manifest Generation** - Auto-generated curl examples, test cases, documentation
- **26 Enforcement Hooks** - Full phase-by-phase enforcement (including freshness enforcement)
- **Scope Tracking** - Track implemented vs deferred features
- **Research Cache Creation** - Automatic `sources.json`, `interview.json`, `schema.json`

## Hook Architecture (33 Hooks)

### SessionStart (2 hooks)
| Hook | Purpose |
|------|---------|
| `session-startup.py` | Inject state at session start |
| `detect-interruption.py` | Detect interrupted workflows, prompt resume |

### UserPromptSubmit (1 hook)
| Hook | Purpose |
|------|---------|
| `enforce-external-research.py` | Detect API terms, require research |

### PreToolUse - Write/Edit (21 hooks)

**API Workflow Hooks (15)**
| Hook | Phase | Purpose |
|------|-------|---------|
| `enforce-disambiguation.py` | 1 | Block until disambiguation complete |
| `enforce-scope.py` | 2 | Block until scope confirmed |
| `enforce-research.py` | 3 | Block writes until research done |
| `enforce-interview.py` | 4 | Inject interview decisions |
| `enforce-deep-research.py` | 5 | Block until deep research complete |
| `enforce-schema.py` | 6 | Block until schema created |
| `enforce-environment.py` | 7 | Block until environment verified |
| `enforce-tdd-red.py` | 8 | Block implementation until tests exist |
| `verify-implementation.py` | 9 | Require test file before route |
| `enforce-verify.py` | 10 | Block until verification complete |
| `enforce-refactor.py` | 11 | Block until refactor phase |
| `enforce-documentation.py` | 12 | Block until docs updated |
| `enforce-questions-sourced.py` | 4 | Validate questions come from research |
| `enforce-schema-from-interview.py` | 6 | Validate schema matches interview |
| `enforce-freshness.py` | * | Block if research >7 days old for active endpoint |

**UI Workflow Hooks (6)** *(NEW in v3.9.0)*
| Hook | Phase | Purpose |
|------|-------|---------|
| `enforce-ui-disambiguation.py` | 1 | Block until component/page type clarified |
| `enforce-brand-guide.py` | 3 | Inject brand guide during implementation |
| `enforce-ui-interview.py` | 4 | Inject UI interview decisions |
| `check-storybook-setup.py` | 7 | Verify Storybook is configured |
| `check-playwright-setup.py` | 7 | Verify Playwright for pages |
| `update-ui-showcase.py` | 13 | Auto-create UI Showcase page |

### PostToolUse (7 hooks)
| Hook | Matcher | Purpose |
|------|---------|---------|
| `track-tool-use.py` | WebSearch/mcp__context7 | Log research, count turns |
| `periodic-reground.py` | WebSearch/mcp__context7 | Re-ground every 7 turns |
| `track-scope-coverage.py` | WebSearch/mcp__context7 | Track implemented vs deferred |
| `verify-after-green.py` | Bash | Trigger Phase 10 after test pass |
| `cache-research.py` | Write/Edit | Create research cache files |
| `generate-manifest-entry.py` | Write/Edit | Auto-generate API documentation |
| `update-registry.py` | Write/Edit | Update registry.json on workflow completion |

### Stop (2 hooks)
| Hook | Purpose |
|------|---------|
| `api-workflow-check.py` | Block if phases incomplete, generate output |
| `session-logger.py` | Save session to `.claude/api-sessions/` |

## Available Commands

### Complete Workflows

**`/hustle-api-create [endpoint-name]`**
- Runs all 13 phases for NEW API development
- Loop-back architecture at every checkpoint
- See [hustle-api-create.md](hustle-api-create.md) for full flow

**`/hustle-ui-create`** *(NEW in v3.9.0)*
- Creates UI components OR pages with 13-phase workflow
- Mode selection: Component (Storybook) or Page (Playwright E2E)
- ShadCN detection and brand guide integration
- 4-step verification: responsive + brand + tests + memory
- Auto-adds to UI Showcase at `/ui-showcase`
- See [hustle-ui-create.md](hustle-ui-create.md) for full flow

**`/hustle-combine [api|ui]`** (v3.8.0)
- Combines EXISTING APIs or UI elements from registry
- Reads from `.claude/registry.json` to present available elements
- Creates orchestration endpoints
- See [hustle-combine.md](hustle-combine.md) for full flow

### Individual Phases

**`/hustle-api-interview [endpoint-name]`**
- Questions GENERATED from research findings
- Different question types: enum, continuous, boolean
- See [hustle-api-interview.md](hustle-api-interview.md)

**`/hustle-api-research [library-or-service]`**
- Adaptive propose-approve flow (not shotgun)
- Research cached with 7-day freshness
- See [hustle-api-research.md](hustle-api-research.md)

**`/hustle-api-verify [endpoint-name]`**
- Manual Phase 10 verification
- Re-read docs, compare to implementation
- Report gaps, loop back or document omissions
- See [hustle-api-verify.md](hustle-api-verify.md)

**`/hustle-api-env [endpoint-name]`**
- Check API keys and environment
- See [hustle-api-env.md](hustle-api-env.md)

**`/hustle-api-status [endpoint-name]`**
- Track progress through 13 phases
- See [hustle-api-status.md](hustle-api-status.md)

### Session Management

**`/hustle-api-continue [endpoint-name]`**
- Resume interrupted workflow from last completed phase
- Auto-detects in-progress endpoints
- See [hustle-api-continue.md](hustle-api-continue.md)

**`/hustle-api-sessions [--list|--view|--export]`**
- Browse saved session logs
- Export to PDF/HTML
- See [hustle-api-sessions.md](hustle-api-sessions.md)

### TDD Commands

From [@wbern/claude-instructions](https://github.com/wbern/claude-instructions):
- `/red` - Write ONE failing test
- `/green` - Minimal implementation to pass
- `/refactor` - Clean up while tests pass
- `/cycle [description]` - Full Red -> Green -> Refactor

## 13-Phase Flow (API)

```
Phase 1:  DISAMBIGUATION     - Clarify ambiguous terms
Phase 2:  SCOPE              - Confirm understanding
Phase 3:  INITIAL RESEARCH   - 2-3 targeted searches
Phase 4:  INTERVIEW          - Questions FROM research
Phase 5:  DEEP RESEARCH      - Adaptive propose-approve
Phase 6:  SCHEMA             - Zod from research + interview
Phase 7:  ENVIRONMENT        - Verify API keys
Phase 8:  TDD RED            - Write failing tests
Phase 9:  TDD GREEN          - Minimal implementation
Phase 10: VERIFY             - Re-research, find gaps
Phase 11: TDD REFACTOR       - Clean up code
Phase 12: DOCUMENTATION      - Update manifests
Phase 13: COMPLETION         - Final verification
```

## 13-Phase Flow (UI) *(NEW in v3.9.0)*

```
Phase 1:  DISAMBIGUATION     - Component type (atom/molecule/organism) or Page type
Phase 2:  SCOPE              - Confirm component/page purpose
Phase 3:  DESIGN RESEARCH    - Search patterns, ask "Use brand guide?"
Phase 4:  INTERVIEW          - Props, variants, accessibility, data fetching
Phase 5:  COMPONENT ANALYSIS - Check src/components/ui/ for ShadCN components
Phase 6:  PROPS SCHEMA       - TypeScript interface from interview
Phase 7:  ENVIRONMENT        - Storybook (component) or Playwright (page) check
Phase 8:  TDD RED            - Story + tests (component) or E2E tests (page) - FAILING
Phase 9:  TDD GREEN          - Implement until tests PASS
Phase 10: VERIFY             - 4-STEP: Responsive + brand + tests + memory
Phase 11: TDD REFACTOR       - Extract hooks, optimize re-renders
Phase 12: DOCUMENTATION      - Storybook autodocs, registry entry
Phase 13: COMPLETION         - Output files, UI Showcase link
```

### 4-Step Verification (UI)

Every component/page must pass ALL 4 checks:

```
Step 1: Responsive Check
  - Desktop (1920px)
  - Tablet (768px)
  - Mobile (375px)

Step 2: Brand Guide Match
  - Colors match .claude/BRAND_GUIDE.md
  - Typography matches
  - Spacing matches

Step 3: All Tests Passed
  - Unit tests (component)
  - Storybook stories render
  - A11y audit: WCAG 2.1 AA

Step 4: Performance Metrics
  - Memory usage logged
  - Re-renders on mount: 1 (optimal)
  - Re-renders on prop change: 1 (optimal)
```

## Brand Guide

Default template installed at `.claude/BRAND_GUIDE.md`:

```markdown
# Project Brand Guide

## Colors
- Primary: #000000
- Accent: #0066FF
- Background: #FFFFFF

## Typography
- Headings: Inter, sans-serif
- Body: Inter, sans-serif

## Component Styling
- Border radius: 8px
- Focus ring: 2px solid accent
```

During Phase 3, Claude asks: "Use brand guide?" with a prompt to update NOW before proceeding.

## UI Showcase

Auto-generated at `src/app/ui-showcase/` when first component/page is created:

- Grid layout showing ALL components and pages
- Click any card → Modal opens with live preview
- Components: Inline render with variant controls
- Pages: Iframe preview at responsive sizes
- Filter tabs: [All] [Components] [Pages]
- Auto-updates via `update-registry.py` hook

## API Showcase *(NEW in v3.9.0)*

Auto-generated at `src/app/api-showcase/` when first API is created:

- Grid layout showing ALL APIs and combined endpoints
- Click any card → Modal with interactive "Try It" testing
- **Try It Tab** - Send real requests with editable body, method selector
- **Documentation Tab** - File locations, schemas, test paths
- **Curl Examples Tab** - Copy-paste curl commands
- Filter by type: [All] [Standard APIs] [Combined]
- Auto-updates via `update-registry.py` hook

**Features:**
- Reads from `registry.json` APIs and combined sections
- Interactive API testing from browser
- Shows request/response in real-time
- Method badges (GET=green, POST=blue, DELETE=red)
- Status indicators for each endpoint

## Performance Budgets *(NEW in v3.9.0)*

TDD gates that **FAIL tests** if thresholds exceeded, triggering loop-back.

Configured in `.claude/performance-budgets.json`:

```json
{
  "memory": {
    "page_max_mb": 50,
    "component_max_mb": 10,
    "heap_growth_max_mb": 5
  },
  "renders": {
    "mount_max": 1,
    "prop_change_max": 1,
    "unnecessary_renders_max": 0
  },
  "layout": {
    "count_max": 10,
    "duration_max_ms": 100
  },
  "timing": {
    "page_load_max_ms": 3000,
    "first_contentful_paint_max_ms": 1500,
    "largest_contentful_paint_max_ms": 2500
  },
  "dom": {
    "nodes_max": 1500
  }
}
```

**How it works:**
- E2E tests use Chromium DevTools Protocol (CDP) for memory metrics
- Component tests track re-render counts via wrapper components
- Tests FAIL if thresholds exceeded → TDD loop-back to fix
- Core Web Vitals (FCP, LCP) measured via PerformanceObserver

**Example E2E test with thresholds:**
```typescript
test('should have acceptable memory usage', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  const metrics = await client.send('Performance.getMetrics');

  const jsHeapSize = metrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0;
  const domNodes = metrics.metrics.find(m => m.name === 'Nodes')?.value || 0;

  // THRESHOLD: Memory max 50MB - FAIL if exceeded
  expect(jsHeapSize).toBeLessThan(50 * 1024 * 1024);

  // THRESHOLD: DOM nodes max 1500 - FAIL if exceeded
  expect(domNodes).toBeLessThan(1500);
});
```

**Example component test with re-render tracking:**
```typescript
it('should not re-render excessively on mount', () => {
  let renderCount = 0;

  const TestWrapper = () => {
    renderCount++;
    return <Button>Test</Button>;
  };

  render(<TestWrapper />);

  // THRESHOLD: Mount renders max 1 - FAIL if exceeded
  expect(renderCount).toBeLessThanOrEqual(1);
});
```

## State File

All progress tracked in `.claude/api-dev-state.json`:

```json
{
  "version": "3.7.0",
  "active_endpoint": "brandfetch",
  "endpoints": {
    "brandfetch": {
      "started_at": "2025-12-11T15:30:00Z",
      "status": "complete",
      "turn_count": 23,
      "phases": {
        "disambiguation": { "status": "complete", "phase_exit_confirmed": true },
        "scope": { "status": "complete", "phase_exit_confirmed": true },
        "research_initial": { "status": "complete" },
        "interview": { "status": "complete", "decisions": {} },
        "research_deep": {
          "proposed_searches": [],
          "approved_searches": [],
          "skipped_searches": []
        },
        "verify": {
          "gaps_found": 2,
          "gaps_fixed": 2,
          "intentional_omissions": []
        }
      },
      "scope": {
        "discovered_features": [],
        "implemented_features": [],
        "deferred_features": [],
        "coverage_percent": 100
      },
      "session": {
        "interrupted_at": null,
        "interrupted_phase": null
      }
    }
  },
  "reground_history": []
}
```

## Research Cache

Research cached in `.claude/research/`:

```
.claude/research/
├── brandfetch/
│   ├── CURRENT.md           # Aggregated research
│   ├── sources.json         # Research sources with freshness
│   ├── interview.json       # Interview decisions
│   └── schema.json          # Schema snapshot
└── index.json               # Freshness tracking (7-day validity)
```

## Session Logs

Sessions saved in `.claude/api-sessions/`:

```
.claude/api-sessions/
├── brandfetch_2025-12-11_15-30-00/
│   ├── session.jsonl        # Raw Claude conversation
│   ├── session.md           # Human-readable markdown
│   ├── state-snapshot.json  # api-dev-state at completion
│   └── summary.md           # Executive summary
└── index.json               # Session index
```

## Auto-Generated Documentation

When Phase 12 completes, `generate-manifest-entry.py` automatically generates:

### Comprehensive Curl Examples
- **Minimal** - Required parameters only
- **Full** - All parameters
- **With Authentication** - API key headers
- **Enum Variations** - One example per enum value (up to 4)
- **Alternative Values** - Different valid inputs
- **Array Examples** - Multiple items
- **Boundary Values** - Min/max values

### Complete Test Cases
- **Success Cases** - Required only, all fields, alternatives
- **Enum Validation** - Each valid value + invalid
- **Required Fields** - Missing each required field
- **Type Validation** - Wrong types for each field
- **Boundary Tests** - At min, below min, at max, above max
- **Array Tests** - Empty, multiple items
- **Edge Cases** - Empty body, null values, extra fields

### Parameter Documentation
- All required and optional parameters
- Types with validation rules
- Enum values with descriptions
- Min/max constraints
- String length limits

## Quick Start

### Automated
```bash
/hustle-api-create my-endpoint
```

### Manual Step-by-Step
```bash
/hustle-api-research [library]      # Initial research
/hustle-api-interview [endpoint]    # Questions from research
/hustle-api-env [endpoint]          # Verify environment
/red                                # Failing tests
/green                              # Make tests pass
/hustle-api-verify [endpoint]       # Compare to docs
/refactor                           # Clean up
/commit                             # Semantic commit
```

## Installation

```bash
npx @hustle-together/api-dev-tools --scope=project
```

Installs:
- Commands in `.claude/commands/` (10 hustle-* commands)
- Hooks in `.claude/hooks/` (33 hooks)
- Settings in `.claude/settings.json`
- State template in `.claude/api-dev-state.json`
- Registry in `.claude/registry.json`
- Brand guide in `.claude/BRAND_GUIDE.md` *(NEW in v3.9.0)*
- Performance budgets in `.claude/performance-budgets.json` *(NEW in v3.9.0)*
- Research index in `.claude/research/index.json`

### File Structures (UI)

**Component Structure:**
```
src/components/Button/
├── Button.tsx              # Component implementation
├── Button.types.ts         # TypeScript interfaces
├── Button.stories.tsx      # Storybook documentation
├── Button.test.tsx         # Unit tests
└── index.ts                # Barrel export
```

**Page Structure:**
```
src/app/dashboard/
├── page.tsx                # Page component
├── layout.tsx              # (optional) Layout
└── _components/            # Page-specific components

tests/e2e/
└── dashboard.spec.ts       # Playwright E2E tests
```

### Team-Wide

Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "npx @hustle-together/api-dev-tools --scope=project"
  }
}
```

## Central Registry

All created APIs, components, and pages are tracked in `.claude/registry.json`:

```json
{
  "version": "1.0.0",
  "apis": {
    "brandfetch": {
      "name": "Brandfetch",
      "description": "Brand data extraction by domain",
      "route": "src/app/api/v2/brandfetch/route.ts",
      "status": "complete"
    },
    "elevenlabs": {
      "name": "ElevenLabs",
      "description": "Voice synthesis (TTS, voices, models)",
      "route": "src/app/api/v2/elevenlabs/",
      "status": "complete"
    }
  },
  "components": {},
  "pages": {},
  "combined": {
    "brand-voice": {
      "name": "Brand Voice",
      "combines": ["brandfetch", "elevenlabs"],
      "flow_type": "sequential",
      "status": "complete"
    }
  }
}
```

The registry enables `/hustle-combine` to present available elements for combination.

## Key Principles

1. **Loop Until Green** - Every verification loops back if not successful
2. **Continuous Interviews** - Checkpoints at EVERY phase transition
3. **Adaptive Research** - Propose based on context, not shotgun
4. **Self-Documenting** - State file captures everything
5. **Verify After Green** - Re-research to catch memory errors
6. **Comprehensive Output** - Full documentation ready for UI consumption
7. **Session Persistence** - Never lose a workflow, always resume
8. **Registry Tracking** - All created elements tracked for combination

---

**Version:** 3.9.0
**Last Updated:** 2025-12-12
