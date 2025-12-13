#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Block writing if deep research not completed WITH USER APPROVAL

Phase 5 requires:
  1. PROPOSE searches based on interview answers
  2. Show checkbox list to user
  3. USE AskUserQuestion: "Approve? [Y] / Add more? ____"
  4. Execute only approved searches
  5. Loop back if user wants additions

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

    # Only enforce after interview is complete
    if interview.get("status") != "complete":
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    status = research_deep.get("status", "not_started")

    # If deep research was not needed (no proposed searches), allow
    proposed = research_deep.get("proposed_searches", [])
    if not proposed and status == "not_started":
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    phase_exit_confirmed = research_deep.get("phase_exit_confirmed", False)

    if status != "complete" or not phase_exit_confirmed:
        user_question_asked = research_deep.get("user_question_asked", False)
        user_approved = research_deep.get("user_approved", False)
        proposals_shown = research_deep.get("proposals_shown", False)
        approved_searches = research_deep.get("approved_searches", [])
        executed_searches = research_deep.get("executed_searches", [])
        skipped_searches = research_deep.get("skipped_searches", [])

        # Calculate pending
        pending = [s for s in approved_searches if s not in executed_searches and s not in skipped_searches]

        missing = []
        if not proposals_shown:
            missing.append("Proposed searches not shown to user")
        if not user_question_asked:
            missing.append("User approval question (AskUserQuestion not used)")
        if not user_approved:
            missing.append("User hasn't approved the search list")
        if pending:
            missing.append(f"Approved searches not executed ({len(pending)} pending)")
        if not phase_exit_confirmed:
            missing.append("Phase exit confirmation (user must explicitly approve to proceed)")

        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: Deep research (Phase 5) not complete.

Status: {status}
Proposed searches: {len(proposed)}
User shown proposals: {proposals_shown}
User question asked: {user_question_asked}
User approved: {user_approved}
Approved: {len(approved_searches)}
Executed: {len(executed_searches)}
Skipped: {len(skipped_searches)}
Pending: {len(pending)}
Phase exit confirmed: {phase_exit_confirmed}

MISSING:
{chr(10).join(f"  • {m}" for m in missing)}

═══════════════════════════════════════════════════════════
⚠️  GET USER APPROVAL FOR DEEP RESEARCH
═══════════════════════════════════════════════════════════

REQUIRED STEPS:

1. Based on interview, PROPOSE targeted searches:
   ┌───────────────────────────────────────────────────────┐
   │ PROPOSED DEEP RESEARCH                                │
   │                                                       │
   │ Based on your interview answers, I want to research:  │
   │                                                       │
   │ [x] Error response format (for error handling)        │
   │ [x] Rate limiting behavior (caching selected)         │
   │ [ ] Webhook support (not selected in interview)       │
   │ [x] Authentication edge cases                         │
   │                                                       │
   │ Approve these searches? [Y]                           │
   │ Add more: ____                                        │
   │ Skip and proceed: [n]                                 │
   └───────────────────────────────────────────────────────┘

2. USE AskUserQuestion:
   question: "Approve these deep research searches?"
   options: [
     {{"value": "approve", "label": "Yes, run these searches"}},
     {{"value": "add", "label": "Add more - I also need [topic]"}},
     {{"value": "skip", "label": "Skip deep research, proceed to schema"}}
   ]

3. If user says "add":
   • Ask what additional topics they need
   • Add to proposed_searches
   • LOOP BACK and show updated list

4. If user says "approve":
   • Execute each approved search
   • Record results in executed_searches

5. If user says "skip":
   • Record all as skipped_searches with reason
   • Proceed to schema

6. After all searches complete (or skipped):
   • Set research_deep.user_approved = true
   • Set research_deep.user_question_asked = true
   • Set research_deep.proposals_shown = true
   • Set research_deep.status = "complete"

WHY: Research is ADAPTIVE based on interview, not shotgun."""
        }))
        sys.exit(0)

    # Complete
    executed = research_deep.get("executed_searches", [])
    skipped = research_deep.get("skipped_searches", [])
    print(json.dumps({
        "permissionDecision": "allow",
        "message": f"""✅ Deep research complete.
Executed: {len(executed)} searches
Skipped: {len(skipped)} (with reasons)
User approved the search plan."""
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
