#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Block refactoring until verification phase is complete

This hook ensures that after tests pass (Green phase), the implementation
is verified against documentation before any refactoring begins.

Phase 20 of the 13-phase workflow requires:
  - TDD Green phase complete (tests passing)
  - Verify phase complete (Phase 10)
  - All gaps found have been fixed or documented as intentional omissions

Returns:
  - {"permissionDecision": "allow"} - Let the tool run
  - {"permissionDecision": "deny", "reason": "..."} - Block with explanation
"""
import json
import sys
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"

# Keywords that suggest refactoring intent
REFACTOR_KEYWORDS = [
    "refactor",
    "cleanup",
    "clean up",
    "restructure",
    "reorganize",
    "optimize",
    "simplify",
    "extract",
    "rename",
    "move",
]


def is_refactoring_edit(tool_input: dict) -> bool:
    """Detect if this edit appears to be a refactoring operation."""
    # Check the content being written
    new_string = tool_input.get("new_string", "")
    old_string = tool_input.get("old_string", "")

    # If both old and new exist and are similar length, might be refactoring
    if old_string and new_string:
        len_diff = abs(len(new_string) - len(old_string))
        # Similar length suggests refactoring vs new features
        if len_diff < len(old_string) * 0.3:  # Within 30% length
            return True

    return False


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # Only check Edit operations on API files (Write is for new content)
    if tool_name != "Edit":
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Only enforce for API route files
    if "/api/" not in file_path or not file_path.endswith(".ts"):
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Skip test files - can refactor tests anytime
    if ".test." in file_path or "/__tests__/" in file_path or ".spec." in file_path:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Check if state file exists
    if not STATE_FILE.exists():
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Load state
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
    tdd_green = phases.get("tdd_green", {})
    verify = phases.get("verify", {})
    tdd_refactor = phases.get("tdd_refactor", {})

    # Only enforce after TDD Green is complete
    if tdd_green.get("status") != "complete":
        # Still in implementation phase, allow edits
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Check if this looks like a refactoring edit
    if not is_refactoring_edit(tool_input):
        # Doesn't look like refactoring, might be bug fix
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Check verify phase status
    verify_status = verify.get("status", "not_started")
    gaps_found = verify.get("gaps_found", 0)
    gaps_fixed = verify.get("gaps_fixed", 0)
    intentional_omissions = verify.get("intentional_omissions", [])
    phase_exit_confirmed = verify.get("phase_exit_confirmed", False)

    if verify_status != "complete" or not phase_exit_confirmed:
        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: Verify phase (Phase 10) not complete.

Current status: {verify_status}
Gaps found: {gaps_found}
Gaps fixed: {gaps_fixed}
Intentional omissions: {len(intentional_omissions)}
Phase exit confirmed: {phase_exit_confirmed}

═══════════════════════════════════════════════════════════
⚠️  VERIFY BEFORE REFACTORING
═══════════════════════════════════════════════════════════

Before refactoring, you must:

1. Re-read the original documentation
2. Compare implementation to docs feature-by-feature
3. Fix any gaps OR document them as intentional omissions

Current gaps not addressed:
  • {gaps_found - gaps_fixed} gaps still need attention

Once verify phase is complete:
  • All gaps fixed OR documented as omissions
  • Implementation matches documented behavior
  • THEN you can safely refactor

WHY THIS MATTERS:
  - Refactoring should not change behavior
  - Must verify behavior is CORRECT before preserving it
  - Otherwise you cement bugs into clean code"""
        }))
        sys.exit(0)

    # Verify complete - check if all gaps addressed
    unaddressed_gaps = gaps_found - gaps_fixed - len(intentional_omissions)
    if unaddressed_gaps > 0:
        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: {unaddressed_gaps} gaps not addressed.

Gaps found: {gaps_found}
Gaps fixed: {gaps_fixed}
Intentional omissions: {len(intentional_omissions)}
Unaddressed: {unaddressed_gaps}

Fix the remaining gaps or mark them as intentional omissions
before refactoring."""
        }))
        sys.exit(0)

    # All clear for refactoring
    refactor_status = tdd_refactor.get("status", "not_started")
    print(json.dumps({
        "permissionDecision": "allow",
        "message": f"""✅ Verification complete. Safe to refactor.
Refactor phase status: {refactor_status}
Remember: Tests must still pass after refactoring!"""
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
