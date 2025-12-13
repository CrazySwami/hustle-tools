#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Block writing implementation if schema not reviewed WITH USER CONFIRMATION

Phase 6 requires:
  1. Create Zod schemas based on interview + research
  2. SHOW schema to user in formatted display
  3. USE AskUserQuestion: "Schema matches interview? [Y/n]"
  4. Loop back if user wants changes
  5. Only proceed when user confirms

Returns:
  - {"permissionDecision": "allow"} - Let the tool run
  - {"permissionDecision": "deny", "reason": "..."} - Block with explanation
"""
import json
import sys
from pathlib import Path

STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # Only enforce for API route and schema files
    is_api_file = "/api/" in file_path and file_path.endswith(".ts")
    is_schema_file = "/schemas/" in file_path and file_path.endswith(".ts")

    if not is_api_file and not is_schema_file:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Skip test files
    if ".test." in file_path or "/__tests__/" in file_path or ".spec." in file_path:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Skip documentation/config files
    if file_path.endswith(".md") or file_path.endswith(".json"):
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    if not STATE_FILE.exists():
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    endpoint = state.get("endpoint", "unknown")
    phases = state.get("phases", {})
    interview = phases.get("interview", {})
    research_deep = phases.get("research_deep", {})
    schema_creation = phases.get("schema_creation", {})

    # Only enforce after interview is complete
    if interview.get("status") != "complete":
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Only enforce after deep research is complete (or not needed)
    deep_status = research_deep.get("status", "not_started")
    proposed = research_deep.get("proposed_searches", [])
    if proposed and deep_status != "complete":
        # Let enforce-deep-research.py handle this
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    status = schema_creation.get("status", "not_started")

    if status != "complete":
        user_question_asked = schema_creation.get("user_question_asked", False)
        user_confirmed = schema_creation.get("user_confirmed", False)
        schema_shown = schema_creation.get("schema_shown", False)
        schema_file = schema_creation.get("schema_file", None)
        fields_count = schema_creation.get("fields_count", 0)

        missing = []
        if not schema_shown:
            missing.append("Schema not shown to user")
        if not user_question_asked:
            missing.append("User review question (AskUserQuestion not used)")
        if not user_confirmed:
            missing.append("User hasn't confirmed schema matches interview")

        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: Schema creation (Phase 6) not complete.

Status: {status}
Schema shown: {schema_shown}
User question asked: {user_question_asked}
User confirmed: {user_confirmed}
Schema file: {schema_file or "Not created yet"}
Fields: {fields_count}

MISSING:
{chr(10).join(f"  • {m}" for m in missing)}

═══════════════════════════════════════════════════════════
⚠️  GET USER CONFIRMATION FOR SCHEMA
═══════════════════════════════════════════════════════════

REQUIRED STEPS:

1. Create Zod schemas based on:
   • Interview answers (error handling, caching, etc.)
   • Research findings (API parameters, response format)

2. SHOW formatted schema to user:
   ┌───────────────────────────────────────────────────────┐
   │ SCHEMA REVIEW                                         │
   │                                                       │
   │ Request Schema:                                       │
   │   domain: z.string()        ← From interview: domain │
   │   mode: z.enum(["full", "logo"]) ← Your choice: full │
   │   includeColors: z.boolean().default(true)           │
   │                                                       │
   │ Response Schema:                                      │
   │   success: z.boolean()                               │
   │   data: BrandDataSchema                              │
   │   cached: z.boolean()       ← From interview: 24h   │
   │   error: ErrorSchema.optional()                      │
   │                                                       │
   │ Based on YOUR interview answers:                      │
   │   ✓ Error handling: Return objects                   │
   │   ✓ Caching: 24h (long)                              │
   │   ✓ Mode: Full brand kit                             │
   │                                                       │
   │ Does this match your requirements? [Y/n]             │
   └───────────────────────────────────────────────────────┘

3. USE AskUserQuestion:
   question: "Does this schema match your interview answers?"
   options: [
     {{"value": "confirm", "label": "Yes, schema looks correct"}},
     {{"value": "modify", "label": "No, I need changes - [describe]"}},
     {{"value": "restart", "label": "Let's redo the interview"}}
   ]

4. If user says "modify":
   • Ask what changes they need
   • Update schema accordingly
   • LOOP BACK and show updated schema

5. If user says "restart":
   • Reset interview phase
   • Go back to Phase 4

6. If user says "confirm":
   • Set schema_creation.user_confirmed = true
   • Set schema_creation.user_question_asked = true
   • Set schema_creation.schema_shown = true
   • Set schema_creation.status = "complete"

WHY: Schema is the CONTRACT. User must approve before implementation."""
        }))
        sys.exit(0)

    # Schema complete
    schema_file = schema_creation.get("schema_file", "")
    fields_count = schema_creation.get("fields_count", 0)
    print(json.dumps({
        "permissionDecision": "allow",
        "message": f"""✅ Schema creation complete.
Schema file: {schema_file}
Fields: {fields_count}
User confirmed schema matches interview requirements."""
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
