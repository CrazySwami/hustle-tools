#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Block writing API code if scope not confirmed BY USER

Phase 2 requires:
  1. Present scope understanding to user
  2. USE AskUserQuestion: "Is this correct? [Y/n]"
  3. Record any modifications user requests
  4. Loop back if user wants changes

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
    if "/api/" not in file_path:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Skip test files
    if ".test." in file_path or "/__tests__/" in file_path or ".spec." in file_path:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

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

    endpoint = state.get("endpoint")
    if not endpoint:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    phases = state.get("phases", {})
    disambiguation = phases.get("disambiguation", {})
    scope = phases.get("scope", {})

    # Check disambiguation is complete first
    if disambiguation.get("status") != "complete":
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    status = scope.get("status", "not_started")
    user_confirmed = scope.get("user_confirmed", False)
    user_question_asked = scope.get("user_question_asked", False)
    phase_exit_confirmed = scope.get("phase_exit_confirmed", False)

    if status != "complete" or not user_confirmed or not phase_exit_confirmed:
        endpoint_path = scope.get("endpoint_path", f"/api/v2/{endpoint}")
        modifications = scope.get("modifications", [])

        missing = []
        if not user_question_asked:
            missing.append("User question (AskUserQuestion not used)")
        if not user_confirmed:
            missing.append("User confirmation (user hasn't said 'yes')")
        if not phase_exit_confirmed:
            missing.append("Phase exit confirmation (user must explicitly approve to proceed)")

        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: Scope confirmation (Phase 2) not complete.

Status: {status}
User question asked: {user_question_asked}
User confirmed: {user_confirmed}
Phase exit confirmed: {phase_exit_confirmed}
Proposed path: {endpoint_path}
Modifications: {len(modifications)}

MISSING:
{chr(10).join(f"  • {m}" for m in missing)}

═══════════════════════════════════════════════════════════
⚠️  GET USER CONFIRMATION OF SCOPE
═══════════════════════════════════════════════════════════

REQUIRED STEPS:

1. Present your understanding:
   ┌───────────────────────────────────────────────────────┐
   │ SCOPE CONFIRMATION                                    │
   │                                                       │
   │ I understand you want: {endpoint_path}                │
   │ Purpose: [describe inferred purpose]                  │
   │ External API: [service name if any]                   │
   │                                                       │
   │ Is this correct? [Y/n]                                │
   │ Any modifications needed? ____                        │
   └───────────────────────────────────────────────────────┘

2. USE AskUserQuestion:
   question: "Is this scope correct? Any modifications?"
   options: [
     {{"value": "yes", "label": "Yes, proceed"}},
     {{"value": "modify", "label": "I have modifications"}},
     {{"value": "no", "label": "No, let me clarify"}}
   ]

3. If user says "modify" or "no":
   • Ask for their modifications
   • Record them in scope.modifications
   • LOOP BACK and confirm again

4. If user says "yes":
   • Set scope.user_confirmed = true
   • Set scope.user_question_asked = true
   • Set scope.status = "complete"

WHY: Prevents building the wrong thing."""
        }))
        sys.exit(0)

    # Scope confirmed - inject context
    endpoint_path = scope.get("endpoint_path", f"/api/v2/{endpoint}")
    modifications = scope.get("modifications", [])

    context = [f"✅ Scope confirmed: {endpoint_path}"]
    if modifications:
        context.append("User modifications:")
        for mod in modifications[:3]:
            context.append(f"  • {mod}")

    print(json.dumps({
        "permissionDecision": "allow",
        "message": "\n".join(context)
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
