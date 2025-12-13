#!/usr/bin/env python3
"""
Hook: enforce-page-data-schema.py
Trigger: PreToolUse (Write|Edit)
Purpose: Validate that API response types are defined before page implementation

For ui-create-page workflow, ensures Phase 6 (DATA SCHEMA) is complete before
allowing page implementation in Phase 9.
"""

import json
import sys
import os
import re

def load_state():
    """Load the api-dev-state.json file"""
    state_paths = [
        ".claude/api-dev-state.json",
        os.path.join(os.environ.get("CLAUDE_PROJECT_DIR", ""), ".claude/api-dev-state.json")
    ]

    for path in state_paths:
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
    return None

def is_page_workflow(state):
    """Check if current workflow is ui-create-page"""
    workflow = state.get("workflow", "")
    return workflow == "ui-create-page"

def get_active_element(state):
    """Get the active element being worked on"""
    active = state.get("active_element", "")
    if not active:
        # Fall back to endpoint for older state files
        active = state.get("endpoint", "")
    return active

def is_page_file(file_path, element_name):
    """Check if the file being written is a page implementation file"""
    if not file_path or not element_name:
        return False

    patterns = [
        f"src/app/{element_name}/page.tsx",
        f"src/app/{element_name}/layout.tsx",
        f"src/app/{element_name}/_components/",
        f"app/{element_name}/page.tsx",
    ]

    return any(pattern in file_path for pattern in patterns)

def is_types_file(file_path, element_name):
    """Check if the file being written is the types/schema file"""
    if not file_path or not element_name:
        return False

    patterns = [
        f"src/app/{element_name}/_types/",
        f"src/app/{element_name}/types.ts",
        f"src/lib/schemas/{element_name}",
    ]

    return any(pattern in file_path for pattern in patterns)

def is_test_file(file_path):
    """Check if file is a test file"""
    return "__tests__" in file_path or ".test." in file_path or ".spec." in file_path

def check_data_schema_phase(state, element_name):
    """Check if data schema phase is complete"""
    elements = state.get("elements", {})
    element = elements.get(element_name, {})
    phases = element.get("phases", {})

    # Check data_schema phase
    data_schema = phases.get("data_schema", {})
    return data_schema.get("status") == "complete"

def main():
    try:
        # Read tool input from stdin
        input_data = json.loads(sys.stdin.read())
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})

        # Only check Write and Edit tools
        if tool_name not in ["Write", "Edit"]:
            print(json.dumps({"decision": "allow"}))
            return

        file_path = tool_input.get("file_path", "")

        # Load state
        state = load_state()
        if not state:
            print(json.dumps({"decision": "allow"}))
            return

        # Only apply to ui-create-page workflow
        if not is_page_workflow(state):
            print(json.dumps({"decision": "allow"}))
            return

        element_name = get_active_element(state)
        if not element_name:
            print(json.dumps({"decision": "allow"}))
            return

        # Allow writing types/schema files (Phase 6)
        if is_types_file(file_path, element_name):
            print(json.dumps({"decision": "allow"}))
            return

        # Allow writing test files (Phase 8)
        if is_test_file(file_path):
            print(json.dumps({"decision": "allow"}))
            return

        # Check if writing page implementation file
        if is_page_file(file_path, element_name):
            # Verify data schema phase is complete
            if not check_data_schema_phase(state, element_name):
                print(json.dumps({
                    "decision": "block",
                    "reason": f"""
DATA SCHEMA REQUIRED (Phase 6)

You are trying to implement page code, but the data schema phase is not complete.

Before writing page implementation:
1. Define TypeScript interfaces for API responses
2. Create types in src/app/{element_name}/_types/index.ts
3. Update state: phases.data_schema.status = "complete"

Page implementation requires knowing the data structure first.
"""
                }))
                return

        # Allow everything else
        print(json.dumps({"decision": "allow"}))

    except Exception as e:
        # On error, allow to avoid blocking workflow
        print(json.dumps({
            "decision": "allow",
            "error": str(e)
        }))

if __name__ == "__main__":
    main()
