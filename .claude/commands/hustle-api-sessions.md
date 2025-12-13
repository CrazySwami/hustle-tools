# API Sessions Command

Browse and export saved session logs from previous API development workflows.

## Usage
```
/hustle-api-sessions [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--list` | List all saved sessions |
| `--view [endpoint]` | View a specific session |
| `--export [endpoint] [format]` | Export session to PDF/HTML/MD |
| `--search [term]` | Search across all sessions |
| `--cleanup` | Remove old sessions (>30 days) |

## Examples

```bash
# List all sessions
/hustle-api-sessions --list

# View most recent brandfetch session
/hustle-api-sessions --view brandfetch

# Export to markdown
/hustle-api-sessions --export brandfetch md

# Search for "rate limit"
/hustle-api-sessions --search "rate limit"
```

## Session Storage Structure

Sessions are stored in `.claude/hustle-api-sessions/`:

```
.claude/hustle-api-sessions/
├── brandfetch_2025-12-11_15-30-00/
│   ├── state-snapshot.json     # State at completion
│   ├── files-created.txt       # List of files made
│   ├── summary.md              # Executive summary
│   └── research-cache/         # Copy of research files
│       ├── sources.json
│       ├── interview.json
│       └── CURRENT.md
├── elevenlabs_2025-12-11_18-45-00/
│   └── ...
└── index.json                  # Session index
```

## Output Examples

### --list

```
SAVED SESSIONS
═══════════════════════════════════════════════════

 # │ Endpoint    │ Date       │ Phases │ Status
───┼─────────────┼────────────┼────────┼──────────
 1 │ brandfetch  │ 2025-12-11 │ 13/13  │ complete
 2 │ elevenlabs  │ 2025-12-10 │ 8/13   │ in_progress
 3 │ stripe      │ 2025-12-09 │ 13/13  │ complete

Total: 3 sessions
```

### --view [endpoint]

```
SESSION: brandfetch
═══════════════════════════════════════════════════

Date: 2025-12-11 15:30:00
Status: complete
Phases: 13/13

Files Created:
  • src/app/api/v2/brandfetch/route.ts
  • src/app/api/v2/brandfetch/__tests__/brandfetch.api.test.ts
  • src/lib/schemas/brandfetch.ts

Interview Decisions:
  • format: json, svg
  • authentication: api_key
  • rate_limiting: yes

Research Sources:
  • https://docs.brandfetch.com/reference/
  • https://brandfetch.com/developers/

Session Path: .claude/hustle-api-sessions/brandfetch_2025-12-11_15-30-00/
```

---

## Implementation

When user runs `/hustle-api-sessions`:

### --list

```
READ .claude/hustle-api-sessions/index.json
FOR each session in index:
  SHOW endpoint, date, phases completed, status
SORT by date descending
```

### --view [endpoint]

```
FIND most recent session for endpoint
READ summary.md from session folder
DISPLAY formatted summary
OFFER to open session folder
```

### --export [endpoint] [format]

```
FIND session folder
LOAD all session files
FORMAT to requested output (md/html/pdf)
WRITE to output file
SHOW output path
```

### --search [term]

```
FOR each session folder:
  SEARCH summary.md for term
  SEARCH state-snapshot.json for term
  SEARCH research-cache/* for term
SHOW matching sessions with context
```

---

## Related Commands

- `/hustle-api-create [endpoint]` - Start new workflow
- `/hustle-api-continue [endpoint]` - Resume interrupted workflow
- `/hustle-api-status [endpoint]` - Check current workflow progress
