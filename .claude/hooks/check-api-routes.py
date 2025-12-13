#!/usr/bin/env python3
"""
Hook: check-api-routes.py
Trigger: PreToolUse (Write|Edit)
Purpose: Verify required API routes exist before page implementation

For ui-create-page workflow, ensures Phase 7 (ENVIRONMENT) has verified
that required API routes are available.
"""

import json
import sys
import os
import glob

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
        active = state.get("endpoint", "")
    return active

def is_page_implementation(file_path, element_name):
    """Check if the file is a page implementation file"""
    if not file_path or not element_name:
        return False

    patterns = [
        f"src/app/{element_name}/page.tsx",
        f"app/{element_name}/page.tsx",
    ]

    return any(pattern in file_path for pattern in patterns)

def check_environment_phase(state, element_name):
    """Check if environment phase is complete"""
    elements = state.get("elements", {})
    element = elements.get(element_name, {})
    phases = element.get("phases", {})

    environment = phases.get("environment_check", {})
    return environment.get("status") == "complete"

def get_required_api_routes(state, element_name):
    """Get list of required API routes from interview decisions"""
    elements = state.get("elements", {})
    element = elements.get(element_name, {})
    ui_config = element.get("ui_config", {})

    # Check if data sources were defined
    data_sources = ui_config.get("data_sources", [])
    return data_sources

def find_existing_api_routes():
    """Find all existing API routes in the project"""
    routes = []

    # Check src/app/api paths
    api_patterns = [
        "src/app/api/**/*.ts",
        "src/app/api/**/*.tsx",
        "app/api/**/*.ts",
        "app/api/**/*.tsx",
    ]

    for pattern in api_patterns:
        for file_path in glob.glob(pattern, recursive=True):
            if "route.ts" in file_path or "route.tsx" in file_path:
                # Extract route name from path
                route = file_path.replace("src/app/api/", "/api/")
                route = route.replace("app/api/", "/api/")
                route = route.replace("/route.ts", "")
                route = route.replace("/route.tsx", "")
                routes.append(route)

    return routes

def main():
    try:
        # Read tool input from stdin
        input_data = json.loads(sys.stdin.read())
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})

        # Only check Write tool
        if tool_name != "Write":
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

        # Check if writing main page file
        if is_page_implementation(file_path, element_name):
            # Verify environment phase is complete
            if not check_environment_phase(state, element_name):
                # Find existing API routes for reference
                existing_routes = find_existing_api_routes()
                routes_list = "\n".join([f"  - {r}" for r in existing_routes[:15]])
                if len(existing_routes) > 15:
                    routes_list += f"\n  ... and {len(existing_routes) - 15} more"

                print(json.dumps({
                    "decision": "block",
                    "reason": f"""
ENVIRONMENT CHECK REQUIRED (Phase 7)

You are implementing the main page, but the Environment phase is not complete.

Before implementing page.tsx:
1. Verify required API routes exist
2. Check authentication configuration
3. Verify required packages are installed
4. Update state: phases.environment_check.status = "complete"

Existing API Routes Found:
{routes_list if existing_routes else "  (No API routes found)"}

If you need new API routes, use /api-create to create them first.
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
