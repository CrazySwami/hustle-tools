#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Block writing API code if disambiguation phase not complete WITH USER CONFIRMATION

Phase 1 requires:
  1. Search 3-5 variations of the term
  2. Present options to user via AskUserQuestion
  3. User selects which interpretation
  4. Loop back if still ambiguous

Returns:
  - {"permissionDecision": "allow"} - Let the tool run
  - {"permissionDecision": "deny", "reason": "..."} - Block with explanation
"""
import json
import sys
from pathlib import Path

STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"

# Minimum search variations required
MIN_SEARCH_VARIATIONS = 2


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # Only enforce for API route files
    if "/api/" not in file_path:
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
        print(json.dumps({
            "permissionDecision": "deny",
            "reason": """❌ API workflow not started.

Run /api-create [endpoint-name] to begin the interview-driven workflow.

Phase 1 (Disambiguation) is required before any implementation."""
        }))
        sys.exit(0)

    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    endpoint = state.get("endpoint")
    if not endpoint:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    phases = state.get("phases", {})
    disambiguation = phases.get("disambiguation", {})
    status = disambiguation.get("status", "not_started")

    # Also check phase_exit_confirmed even if status is "complete"
    phase_exit_confirmed = disambiguation.get("phase_exit_confirmed", False)

    if status != "complete" or not phase_exit_confirmed:
        search_variations = disambiguation.get("search_variations", [])
        user_question_asked = disambiguation.get("user_question_asked", False)
        user_selected = disambiguation.get("user_selected", None)

        # Check what's missing
        missing = []
        if len(search_variations) < MIN_SEARCH_VARIATIONS:
            missing.append(f"Search variations ({len(search_variations)}/{MIN_SEARCH_VARIATIONS})")
        if not user_question_asked:
            missing.append("User question (AskUserQuestion not used)")
        if not user_selected:
            missing.append("User selection (no choice recorded)")
        if not phase_exit_confirmed:
            missing.append("Phase exit confirmation (user must explicitly confirm to proceed)")

        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: Disambiguation phase (Phase 1) not complete.

Status: {status}
Search variations: {len(search_variations)}
User question asked: {user_question_asked}
User selection: {user_selected or "None"}
Phase exit confirmed: {phase_exit_confirmed}

MISSING:
{chr(10).join(f"  • {m}" for m in missing)}

═══════════════════════════════════════════════════════════
⚠️  COMPLETE DISAMBIGUATION WITH USER CONFIRMATION
═══════════════════════════════════════════════════════════

REQUIRED STEPS:

1. Search 2-3 variations:
   • WebSearch: "{endpoint}"
   • WebSearch: "{endpoint} API"
   • WebSearch: "{endpoint} SDK npm package"

2. USE AskUserQuestion with options:
   ┌───────────────────────────────────────────────────────┐
   │ I found multiple things matching "{endpoint}":        │
   │                                                       │
   │ [A] The official REST API                             │
   │ [B] The npm/SDK wrapper package                       │
   │ [C] Both (API + SDK)                                  │
   │ [D] Something else: ____                              │
   │                                                       │
   │ Which should this endpoint use?                       │
   └───────────────────────────────────────────────────────┘

3. Record user's choice in state:
   disambiguation.user_selected = "A" (or user's choice)
   disambiguation.user_question_asked = true
   disambiguation.status = "complete"

4. LOOP BACK if user is still unsure - search more variations

WHY: Different interpretations = different implementations."""
        }))
        sys.exit(0)

    # Complete - inject context
    selected = disambiguation.get("user_selected", "")
    print(json.dumps({
        "permissionDecision": "allow",
        "message": f"""✅ Disambiguation complete.
User selected: {selected}
Proceeding with this interpretation."""
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
