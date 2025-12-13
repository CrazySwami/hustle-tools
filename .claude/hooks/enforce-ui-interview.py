#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Inject UI interview decisions during component/page implementation

This hook injects the user's interview answers (variants, accessibility level,
component dependencies, etc.) when Claude writes implementation code.
This ensures the implementation matches what the user specified.

Version: 3.9.0

Returns:
  - {"continue": true} - Always continues
  - May include "notify" with key decisions summary
"""
import json
import sys
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"


def format_decisions(decisions):
    """Format interview decisions for display."""
    formatted = []

    for key, value in decisions.items():
        if isinstance(value, dict):
            # Extract value from nested structure
            display_value = value.get("value", value.get("response", str(value)))
        else:
            display_value = value

        # Format for display
        if isinstance(display_value, list):
            display_value = ", ".join(str(v) for v in display_value)
        elif isinstance(display_value, bool):
            display_value = "Yes" if display_value else "No"

        formatted.append(f"{key}: {display_value}")

    return formatted


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    # Only check Write/Edit operations
    if tool_name not in ["Write", "Edit"]:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if targeting component or page files
    file_path = tool_input.get("file_path", "")
    is_component = "/components/" in file_path and file_path.endswith(".tsx")
    is_page = "/app/" in file_path and "page.tsx" in file_path

    if not is_component and not is_page:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if state file exists
    if not STATE_FILE.exists():
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Load state
    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    workflow = state.get("workflow", "")

    # Only apply for UI workflows
    if workflow not in ["ui-create-component", "ui-create-page"]:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Get interview decisions
    # Try elements format first, then fall back to phases format
    active_element = state.get("active_element", "")
    elements = state.get("elements", {})

    if active_element and active_element in elements:
        phases = elements[active_element].get("phases", {})
    else:
        phases = state.get("phases", {})

    interview = phases.get("interview", {})
    decisions = interview.get("decisions", {})

    if not decisions:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Format key decisions for notification
    formatted = format_decisions(decisions)

    # Limit to most important decisions
    key_decisions = []
    priority_keys = ["component_type", "page_type", "variants", "accessibility", "design_system", "data_fetching"]

    for key in priority_keys:
        for f in formatted:
            if f.lower().startswith(key.replace("_", " ")):
                key_decisions.append(f)
                break

    if key_decisions:
        notify_msg = "Interview decisions: " + " | ".join(key_decisions[:4])
        print(json.dumps({"continue": True, "notify": notify_msg}))
    else:
        print(json.dumps({"continue": True}))

    sys.exit(0)


if __name__ == "__main__":
    main()
