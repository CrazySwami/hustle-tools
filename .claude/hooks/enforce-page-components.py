#!/usr/bin/env python3
"""
Hook: enforce-page-components.py
Trigger: PreToolUse (Write|Edit)
Purpose: Check that components from registry are considered before creating new ones

For ui-create-page workflow, ensures Phase 5 (PAGE ANALYSIS) is complete and
encourages reuse of existing components from the registry.
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

def load_registry():
    """Load the registry.json file"""
    registry_paths = [
        ".claude/registry.json",
        os.path.join(os.environ.get("CLAUDE_PROJECT_DIR", ""), ".claude/registry.json")
    ]

    for path in registry_paths:
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
    return {}

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

def is_creating_new_component(file_path):
    """Check if the file path suggests creating a new standalone component"""
    if not file_path:
        return False

    # Patterns that suggest a new standalone component (not page-specific)
    standalone_patterns = [
        r"src/components/[A-Z]",
        r"components/ui/",
        r"components/shared/",
    ]

    return any(re.search(pattern, file_path) for pattern in standalone_patterns)

def is_page_specific_component(file_path, element_name):
    """Check if the file is a page-specific component (allowed)"""
    if not file_path or not element_name:
        return False

    # Page-specific components in _components folder are allowed
    patterns = [
        f"src/app/{element_name}/_components/",
        f"app/{element_name}/_components/",
    ]

    return any(pattern in file_path for pattern in patterns)

def check_page_analysis_phase(state, element_name):
    """Check if page analysis phase is complete"""
    elements = state.get("elements", {})
    element = elements.get(element_name, {})
    phases = element.get("phases", {})

    page_analysis = phases.get("page_analysis", {})
    return page_analysis.get("status") == "complete"

def get_available_components(registry):
    """Get list of available components from registry"""
    components = registry.get("components", {})
    return list(components.keys())

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

        # Allow page-specific components (in _components folder)
        if is_page_specific_component(file_path, element_name):
            print(json.dumps({"decision": "allow"}))
            return

        # Check if creating a new standalone component
        if is_creating_new_component(file_path):
            # Check if page analysis phase is complete
            if not check_page_analysis_phase(state, element_name):
                # Load registry to show available components
                registry = load_registry()
                available = get_available_components(registry)

                component_list = "\n".join([f"  - {c}" for c in available[:10]])
                if len(available) > 10:
                    component_list += f"\n  ... and {len(available) - 10} more"

                print(json.dumps({
                    "decision": "block",
                    "reason": f"""
PAGE ANALYSIS REQUIRED (Phase 5)

You are creating a new standalone component, but Page Analysis phase is not complete.

Before creating new components:
1. Check the registry for existing components
2. Decide which existing components to reuse
3. Update state: phases.page_analysis.status = "complete"

Available Components in Registry:
{component_list if available else "  (No components registered yet)"}

If you need a NEW component, consider:
- Using /ui-create to properly create and document it
- Or create a page-specific component in src/app/{element_name}/_components/
"""
                }))
                return

            # Even if phase is complete, notify about registry
            registry = load_registry()
            available = get_available_components(registry)

            if available:
                print(json.dumps({
                    "decision": "allow",
                    "message": f"Note: {len(available)} components available in registry. Consider reusing existing components."
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
