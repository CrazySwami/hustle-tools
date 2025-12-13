#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Block UI implementation until component/page type is clarified (Phase 1)

This hook ensures that Phase 1 (Disambiguation) is complete before any
component or page files are written. It checks that:
- Component type (atom/molecule/organism) is specified for components
- Page type (landing/dashboard/form/list) is specified for pages

Version: 3.9.0

Returns:
  - {"continue": true} - If disambiguation is complete or not a UI workflow
  - {"continue": false, "reason": "..."} - If disambiguation is incomplete
"""
import json
import sys
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"


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

    # Only enforce for UI workflows
    if workflow not in ["ui-create-component", "ui-create-page"]:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Get UI config
    ui_config = state.get("ui_config", {})

    # Check disambiguation for components
    if workflow == "ui-create-component":
        component_type = ui_config.get("component_type", "")
        if not component_type:
            print(json.dumps({
                "continue": False,
                "reason": (
                    "Phase 1 (Disambiguation) incomplete.\n\n"
                    "Before creating this component, you must clarify:\n"
                    "- Is this an Atom, Molecule, or Organism?\n\n"
                    "Please complete the disambiguation phase first."
                )
            }))
            sys.exit(0)

    # Check disambiguation for pages
    if workflow == "ui-create-page":
        page_type = ui_config.get("page_type", "")
        if not page_type:
            print(json.dumps({
                "continue": False,
                "reason": (
                    "Phase 1 (Disambiguation) incomplete.\n\n"
                    "Before creating this page, you must clarify:\n"
                    "- Is this a Landing, Dashboard, Form, or List page?\n\n"
                    "Please complete the disambiguation phase first."
                )
            }))
            sys.exit(0)

    # Disambiguation complete
    print(json.dumps({"continue": True}))
    sys.exit(0)


if __name__ == "__main__":
    main()
