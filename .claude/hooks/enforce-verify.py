#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Block refactoring until verification complete WITH USER GAP DECISION

Phase 10 (Verify) requires:
  1. Re-read original documentation (after tests pass)
  2. Compare implementation to docs - find gaps
  3. SHOW gap analysis to user
  4. USE AskUserQuestion: "Fix gaps? [Y] / Skip? [n]"
  5. Loop back to Phase 8 if user wants fixes
  6. Only proceed to refactor when user decides

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

    # Only enforce for API route files
    is_api_file = "/api/" in file_path and file_path.endswith(".ts")

    if not is_api_file:
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
    tdd_green = phases.get("tdd_green", {})
    verify = phases.get("verify", {})

    # Only enforce after TDD Green is complete
    if tdd_green.get("status") != "complete":
        # Let earlier hooks handle this
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    status = verify.get("status", "not_started")

    if status != "complete":
        user_question_asked = verify.get("user_question_asked", False)
        user_decided = verify.get("user_decided", False)
        gap_analysis_shown = verify.get("gap_analysis_shown", False)
        re_research_done = verify.get("re_research_done", False)
        gaps_found = verify.get("gaps_found", 0)
        gaps_fixed = verify.get("gaps_fixed", 0)
        gaps_skipped = verify.get("gaps_skipped", 0)
        user_decision = verify.get("user_decision", None)

        missing = []
        if not re_research_done:
            missing.append("Re-research original docs not done")
        if not gap_analysis_shown:
            missing.append("Gap analysis not shown to user")
        if not user_question_asked:
            missing.append("User gap decision question (AskUserQuestion not used)")
        if not user_decided:
            missing.append("User hasn't decided on gaps")

        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: Verification (Phase 10) not complete.

Status: {status}
Re-research done: {re_research_done}
Gap analysis shown: {gap_analysis_shown}
User question asked: {user_question_asked}
User decided: {user_decided}
User decision: {user_decision or "None yet"}
Gaps found: {gaps_found}
Gaps fixed: {gaps_fixed}
Gaps skipped: {gaps_skipped}

MISSING:
{chr(10).join(f"  • {m}" for m in missing)}

═══════════════════════════════════════════════════════════
⚠️  GET USER DECISION ON IMPLEMENTATION GAPS
═══════════════════════════════════════════════════════════

REQUIRED STEPS:

1. Re-read the ORIGINAL API documentation:
   • Use Context7 or WebSearch with SAME queries from Phase 3
   • Compare EVERY documented feature to your implementation
   • Don't rely on memory - actually re-read the docs

2. Create and SHOW gap analysis table:
   ┌───────────────────────────────────────────────────────┐
   │ VERIFICATION RESULTS                                  │
   │                                                       │
   │ │ Feature         │ In Docs │ Implemented │ Status   │
   │ ├─────────────────┼─────────┼─────────────┼──────────│
   │ │ domain param    │ Yes     │ Yes         │ ✓ Match  │
   │ │ format option   │ Yes     │ Yes         │ ✓ Match  │
   │ │ include_fonts   │ Yes     │ No          │ ❌ GAP   │
   │ │ webhook_url     │ No      │ Yes         │ ⚠ Extra │
   │                                                       │
   │ Found 1 gap in implementation.                        │
   │                                                       │
   │ Fix the gap? [Y] - Loop back to add missing feature  │
   │ Skip? [n] - Document as intentional omission          │
   └───────────────────────────────────────────────────────┘

3. USE AskUserQuestion:
   question: "I found {gaps_found} gap(s). How should I proceed?"
   options: [
     {{"value": "fix", "label": "Fix gaps - loop back to Red phase"}},
     {{"value": "skip", "label": "Skip - these are intentional omissions"}},
     {{"value": "partial", "label": "Fix some, skip others - [specify]"}}
   ]

4. If user says "fix":
   • Loop back to Phase 8 (TDD Red)
   • Write new tests for missing features
   • Implement and verify again
   • REPEAT until no gaps or user says skip

5. If user says "skip":
   • Document each skipped gap with reason
   • Set verify.gaps_skipped = count
   • Proceed to refactor

6. After user decides:
   • Set verify.user_decided = true
   • Set verify.user_question_asked = true
   • Set verify.gap_analysis_shown = true
   • Set verify.re_research_done = true
   • Set verify.user_decision = "fix" or "skip" or "partial"
   • Set verify.status = "complete"

WHY: Catch memory-based implementation errors BEFORE refactoring."""
        }))
        sys.exit(0)

    # Verify complete
    user_decision = verify.get("user_decision", "unknown")
    print(json.dumps({
        "permissionDecision": "allow",
        "message": f"""✅ Verification complete.
User decision: {user_decision}
Gaps found: {gaps_found}
Gaps fixed: {gaps_fixed}
Gaps skipped (intentional): {gaps_skipped}
Proceeding to refactor phase."""
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
