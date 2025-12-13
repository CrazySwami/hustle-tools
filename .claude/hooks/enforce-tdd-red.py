#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Block writing implementation if test matrix not approved WITH USER CONFIRMATION

Phase 8 (TDD Red) requires:
  1. Propose test matrix based on interview + schema
  2. SHOW test plan to user (scenarios, edge cases, coverage)
  3. USE AskUserQuestion: "Test plan looks good? [Y/n]"
  4. Loop back if user wants more tests
  5. Only allow route.ts after user approves test matrix

Returns:
  - {"permissionDecision": "allow"} - Let the tool run
  - {"permissionDecision": "deny", "reason": "..."} - Block with explanation
"""
import json
import sys
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"


def find_test_file(route_path: str) -> tuple[bool, str]:
    """Check if a test file exists for the given route file."""
    route_file = Path(route_path)

    # Common test file patterns
    # route.ts -> route.test.ts, __tests__/route.test.ts, route.spec.ts
    possible_tests = [
        route_file.with_suffix(".test.ts"),
        route_file.with_suffix(".test.tsx"),
        route_file.with_suffix(".spec.ts"),
        route_file.parent / "__tests__" / f"{route_file.stem}.test.ts",
        route_file.parent / "__tests__" / f"{route_file.stem}.test.tsx",
        route_file.parent.parent / "__tests__" / f"{route_file.parent.name}.test.ts",
    ]

    for test_path in possible_tests:
        if test_path.exists():
            return True, str(test_path)

    return False, str(possible_tests[0])  # Return expected path


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # Only enforce for route.ts files in /api/ directories
    if not file_path.endswith("route.ts") or "/api/" not in file_path:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Allow if this IS a test file (shouldn't match but safety check)
    if ".test." in file_path or "/__tests__/" in file_path or ".spec." in file_path:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Check if state file exists
    if not STATE_FILE.exists():
        # Even without state, enforce TDD
        test_exists, expected_path = find_test_file(file_path)
        if not test_exists:
            print(json.dumps({
                "permissionDecision": "deny",
                "reason": f"""❌ TDD VIOLATION: No test file found!

You're trying to write: {file_path}

But the test file doesn't exist: {expected_path}

═══════════════════════════════════════════════════════════
⚠️  WRITE TESTS FIRST (TDD Red Phase)
═══════════════════════════════════════════════════════════

TDD requires:
  1. Write a FAILING test first
  2. THEN write implementation to make it pass

Create the test file first:
  {expected_path}

Example test structure:
  import {{ describe, it, expect }} from 'vitest';

  describe('POST /api/...', () => {{
    it('should return 200 with valid input', async () => {{
      // Test implementation
    }});

    it('should return 400 with invalid input', async () => {{
      // Test validation
    }});
  }});"""
            }))
            sys.exit(0)
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Load state
    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    phases = state.get("phases", {})
    tdd_red = phases.get("tdd_red", {})
    tdd_red_status = tdd_red.get("status", "not_started")
    test_count = tdd_red.get("test_count", 0)

    # Get user checkpoint fields
    user_question_asked = tdd_red.get("user_question_asked", False)
    user_approved = tdd_red.get("user_approved", False)
    matrix_shown = tdd_red.get("matrix_shown", False)
    test_scenarios = tdd_red.get("test_scenarios", [])
    phase_exit_confirmed = tdd_red.get("phase_exit_confirmed", False)

    # Check if TDD Red phase is complete
    if tdd_red_status != "complete" or not phase_exit_confirmed:
        test_exists, expected_path = find_test_file(file_path)

        # Check what's missing for user checkpoint
        missing = []
        if not test_exists:
            missing.append("Test file not created yet")
        if not matrix_shown:
            missing.append("Test matrix not shown to user")
        if not user_question_asked:
            missing.append("User approval question (AskUserQuestion not used)")
        if not user_approved:
            missing.append("User hasn't approved the test plan")
        if not phase_exit_confirmed:
            missing.append("Phase exit confirmation (user must explicitly approve to proceed)")

        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: TDD Red phase (Phase 8) not complete.

Current status: {tdd_red_status}
Test count: {test_count}
Test file exists: {test_exists}
Matrix shown: {matrix_shown}
User question asked: {user_question_asked}
User approved: {user_approved}
Phase exit confirmed: {phase_exit_confirmed}
Scenarios: {len(test_scenarios)}

MISSING:
{chr(10).join(f"  • {m}" for m in missing)}

═══════════════════════════════════════════════════════════
⚠️  GET USER APPROVAL FOR TEST MATRIX
═══════════════════════════════════════════════════════════

REQUIRED STEPS:

1. PROPOSE test matrix based on interview + schema:
   ┌───────────────────────────────────────────────────────┐
   │ TEST MATRIX                                           │
   │                                                       │
   │ Based on your interview, I'll test:                   │
   │                                                       │
   │ ✅ Success Scenarios:                                 │
   │    • GET with valid domain → 200 + brand data        │
   │    • POST with full payload → 200 + created          │
   │                                                       │
   │ ✅ Error Scenarios (your choice: return objects):    │
   │    • Invalid domain → 400 + error object             │
   │    • Missing API key → 401 + error object            │
   │    • Not found → 404 + error object                  │
   │                                                       │
   │ ✅ Edge Cases:                                        │
   │    • Rate limit exceeded → 429 + retry-after         │
   │    • Cache hit → 200 + cached: true                  │
   │    • Empty response → 200 + empty data               │
   │                                                       │
   │ Total: 8 test scenarios                               │
   │                                                       │
   │ Test plan looks good? [Y]                             │
   │ Add more tests? [n] ____                              │
   └───────────────────────────────────────────────────────┘

2. USE AskUserQuestion:
   question: "This test plan cover your requirements?"
   options: [
     {{"value": "approve", "label": "Yes, write these tests"}},
     {{"value": "add", "label": "Add more - I also need [scenario]"}},
     {{"value": "modify", "label": "Change a scenario - [which one]"}}
   ]

3. If user says "add" or "modify":
   • Update test_scenarios list
   • LOOP BACK and show updated matrix

4. If user says "approve":
   • Create test file: {expected_path}
   • Write all approved test scenarios
   • Run tests to confirm they FAIL (red)
   • Set tdd_red.user_approved = true
   • Set tdd_red.user_question_asked = true
   • Set tdd_red.matrix_shown = true
   • Set tdd_red.test_count = N
   • Set tdd_red.status = "complete"

Based on interview decisions:
{_format_interview_hints(phases.get("interview", {}))}

WHY: User approves what gets tested BEFORE implementation."""
        }))
        sys.exit(0)

    # TDD Red complete - allow implementation
    print(json.dumps({
        "permissionDecision": "allow",
        "message": f"""✅ TDD Red phase complete.
{test_count} tests written and failing.
User approved {len(test_scenarios)} test scenarios.
Proceeding to Green phase - make them pass!"""
    }))
    sys.exit(0)


def _format_interview_hints(interview: dict) -> str:
    """Format interview decisions as test hints."""
    decisions = interview.get("decisions", {})
    if not decisions:
        return "  (no interview decisions recorded)"

    hints = []
    for key, data in list(decisions.items())[:5]:
        value = data.get("value", data.get("response", ""))
        if value:
            short_value = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
            hints.append(f"  • {key}: {short_value}")

    return "\n".join(hints) if hints else "  (no interview decisions recorded)"


if __name__ == "__main__":
    main()
