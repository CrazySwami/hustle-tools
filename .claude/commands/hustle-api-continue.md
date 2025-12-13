# API Continue Command

Resume an interrupted API development workflow from where it left off.

## Usage
```
/hustle-api-continue [endpoint-name]
```

## Arguments
- `endpoint-name` (optional): The endpoint to resume. If not provided, will show available interrupted workflows.

## What This Command Does

1. **Check for Interrupted Workflows**
   - Read `.claude/api-dev-state.json`
   - Find endpoints with `status: "in_progress"`
   - Identify the last completed phase

2. **Restore Context**
   - Load all interview decisions
   - Load research cache from `.claude/research/{endpoint}/`
   - Inject phase-specific context

3. **Resume Workflow**
   - Set `active_endpoint` to the resumed endpoint
   - Continue from the interrupted phase
   - Re-inject any needed context

## Example

```bash
# List interrupted workflows
/hustle-api-continue

# Resume specific workflow
/hustle-api-continue brandfetch
```

## Output

When resuming, you'll see:
- Summary of completed phases
- Current phase to resume
- Key interview decisions
- Research cache status

---

## Implementation

When user runs `/hustle-api-continue [endpoint]`:

### Step 1: Load State and Find Workflow

```
READ .claude/api-dev-state.json
IF endpoint argument provided:
  FIND endpoint in state.endpoints
ELSE:
  LIST all endpoints with status == "in_progress"
  ASK user which to resume
```

### Step 2: Validate Workflow Can Resume

```
CHECK endpoint exists
CHECK endpoint.status == "in_progress"
FIND last completed phase
IDENTIFY next phase to run
```

### Step 3: Restore Context

```
SET state.active_endpoint = endpoint
LOAD .claude/research/{endpoint}/CURRENT.md if exists
LOAD .claude/research/{endpoint}/interview.json if exists
INJECT context into Claude's memory:
  - Endpoint name and purpose
  - Completed phases summary
  - Interview decisions
  - Research findings
  - Current phase requirements
```

### Step 4: Resume

```
SHOW resume summary to user:
  ┌────────────────────────────────────────────────────────┐
  │ RESUMING: {endpoint}                                   │
  │                                                        │
  │ Completed: Phase 1-5                                   │
  │ Resuming at: Phase 6 (Schema Creation)                 │
  │                                                        │
  │ Interview Decisions Loaded:                            │
  │   • format: json                                       │
  │   • authentication: api_key                            │
  │   • rate_limiting: yes                                 │
  │                                                        │
  │ Research Cache:                                        │
  │   • .claude/research/{endpoint}/CURRENT.md (fresh)     │
  │                                                        │
  │ Continue with Phase 6? [Y/n]                           │
  └────────────────────────────────────────────────────────┘

IF user confirms:
  TRIGGER next phase workflow
```

### Step 5: Clear Interruption State

```
UPDATE state.endpoints[endpoint].session:
  interrupted_at = null
  interrupted_phase = null
  recovery_checkpoint = null
SAVE state
```

---

## Phase Order for Reference

1. Disambiguation
2. Scope
3. Initial Research
4. Interview
5. Deep Research
6. Schema Creation
7. Environment Check
8. TDD Red
9. TDD Green
10. Verify
11. TDD Refactor
12. Documentation
13. Completion

---

## Error Handling

| Error | Resolution |
|-------|------------|
| No interrupted workflows | Show message: "No interrupted workflows found. Use /hustle-api-create to start a new one." |
| Endpoint not found | Show available endpoints and ask user to choose |
| Research cache stale | Warn user and offer to re-run research phases |
| State file missing | Error: "No state file found. Use /hustle-api-create to start a new workflow." |

---

## Related Commands

- `/hustle-api-create [endpoint]` - Start new workflow
- `/hustle-api-status [endpoint]` - Check workflow progress
- `/hustle-api-sessions --list` - View saved session logs
