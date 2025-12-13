#!/usr/bin/env python3
"""
Hook: PostToolUse for Write/Edit
Purpose: Update .claude/registry.json when workflow completes Phase 13

This hook runs AFTER Claude writes/edits files. When it detects that
the completion phase status was just set to "complete" in api-dev-state.json,
it automatically updates the registry.json with the new entry.

Supports:
  - API workflows (api-create) -> registry.apis
  - Component workflows (ui-create-component) -> registry.components
  - Page workflows (ui-create-page) -> registry.pages
  - Combined workflows (combine-api, combine-ui) -> registry.combined

Version: 3.9.0

Returns:
  - {"continue": true} - Always continues (logging only, no blocking)
  - For UI workflows, includes notify message with UI Showcase link
"""
import json
import sys
from datetime import datetime
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
REGISTRY_FILE = Path(__file__).parent.parent / "registry.json"


def get_active_endpoint(state):
    """Get active endpoint - supports both old and new state formats."""
    # New format (v3.6.7+): endpoints object with active_endpoint pointer
    if "endpoints" in state and "active_endpoint" in state:
        active = state.get("active_endpoint")
        if active and active in state["endpoints"]:
            return active, state["endpoints"][active]
        return None, None

    # Old format: single endpoint field
    endpoint = state.get("endpoint")
    if endpoint:
        return endpoint, state

    return None, None


def load_registry():
    """Load existing registry or create default."""
    if REGISTRY_FILE.exists():
        try:
            return json.loads(REGISTRY_FILE.read_text())
        except json.JSONDecodeError:
            pass

    return {
        "version": "1.0.0",
        "updated_at": "",
        "description": "Central registry tracking all APIs, components, and pages created through Hustle Dev Tools",
        "apis": {},
        "components": {},
        "pages": {},
        "combined": {}
    }


def save_registry(registry):
    """Save registry to file."""
    registry["updated_at"] = datetime.now().isoformat()
    REGISTRY_FILE.write_text(json.dumps(registry, indent=2))


def extract_api_entry(endpoint_name, endpoint_state, state):
    """Extract registry entry from state for a standard API."""
    phases = endpoint_state.get("phases", state.get("phases", {}))
    interview = phases.get("interview", {})
    decisions = interview.get("decisions", {})

    # Get purpose from scope or interview
    scope = phases.get("scope", {})
    purpose = scope.get("purpose", decisions.get("purpose", {}).get("response", ""))

    # Get schema file path
    schema = phases.get("schema_creation", {})
    schema_file = schema.get("schema_file", f"src/app/api/v2/{endpoint_name}/schemas.ts")

    # Get test file path
    tdd_red = phases.get("tdd_red", {})
    test_file = tdd_red.get("test_file", f"src/app/api/v2/{endpoint_name}/__tests__/{endpoint_name}.api.test.ts")

    # Get implementation file path
    tdd_green = phases.get("tdd_green", {})
    impl_file = tdd_green.get("implementation_file", f"src/app/api/v2/{endpoint_name}/route.ts")

    # Determine methods from interview decisions or default
    methods = ["POST"]
    if decisions.get("methods"):
        methods = decisions.get("methods", {}).get("value", ["POST"])

    return {
        "name": endpoint_name.replace("-", " ").title(),
        "description": purpose[:200] if purpose else f"API endpoint for {endpoint_name}",
        "route": impl_file,
        "schemas": schema_file,
        "tests": test_file,
        "methods": methods if isinstance(methods, list) else [methods],
        "created_at": datetime.now().strftime("%Y-%m-%d"),
        "status": "complete"
    }


def extract_combined_entry(endpoint_name, endpoint_state, state):
    """Extract registry entry for a combined API."""
    combine_config = state.get("combine_config", endpoint_state.get("combine_config", {}))
    phases = endpoint_state.get("phases", state.get("phases", {}))
    interview = phases.get("interview", {})
    decisions = interview.get("decisions", {})

    # Get source APIs
    source_elements = combine_config.get("source_elements", [])
    combines = [elem.get("name") for elem in source_elements if elem.get("type") == "api"]

    # Get purpose from scope
    scope = phases.get("scope", {})
    purpose = scope.get("purpose", "")

    # Get flow type from interview
    flow_type = decisions.get("execution_order", decisions.get("flow_type", "sequential"))
    if isinstance(flow_type, dict):
        flow_type = flow_type.get("value", "sequential")

    return {
        "name": endpoint_name.replace("-", " ").title(),
        "type": "api",
        "description": purpose[:200] if purpose else f"Combined API: {', '.join(combines)}",
        "combines": combines,
        "route": f"src/app/api/v2/{endpoint_name}/route.ts",
        "schemas": f"src/app/api/v2/{endpoint_name}/schemas.ts",
        "tests": f"src/app/api/v2/{endpoint_name}/__tests__/",
        "flow_type": flow_type,
        "created_at": datetime.now().strftime("%Y-%m-%d"),
        "status": "complete"
    }


def extract_component_entry(element_name, element_state, state):
    """Extract registry entry for a UI component."""
    phases = element_state.get("phases", state.get("phases", {}))
    ui_config = state.get("ui_config", element_state.get("ui_config", {}))
    interview = phases.get("interview", {})
    decisions = interview.get("decisions", {})

    # Get description from scope
    scope = phases.get("scope", {})
    description = scope.get("component_purpose", scope.get("purpose", ""))

    # Get component type (atom, molecule, organism)
    component_type = ui_config.get("component_type", decisions.get("component_type", {}).get("value", "atom"))

    # Get variants from interview decisions
    variants = ui_config.get("variants", [])
    if not variants and decisions.get("variants"):
        variants = decisions.get("variants", {}).get("value", [])

    # Get accessibility level
    accessibility = ui_config.get("accessibility_level", "wcag2aa")

    # File paths (PascalCase for component name)
    pascal_name = "".join(word.capitalize() for word in element_name.replace("-", " ").split())
    base_path = f"src/components/{pascal_name}"

    return {
        "name": pascal_name,
        "description": description[:200] if description else f"UI component: {pascal_name}",
        "type": component_type,
        "file": f"{base_path}/{pascal_name}.tsx",
        "story": f"{base_path}/{pascal_name}.stories.tsx",
        "tests": f"{base_path}/{pascal_name}.test.tsx",
        "props_interface": f"{pascal_name}Props",
        "variants": variants if isinstance(variants, list) else [],
        "accessibility": accessibility,
        "responsive": True,
        "status": "complete",
        "created_at": datetime.now().strftime("%Y-%m-%d")
    }


def extract_page_entry(element_name, element_state, state):
    """Extract registry entry for a page."""
    phases = element_state.get("phases", state.get("phases", {}))
    ui_config = state.get("ui_config", element_state.get("ui_config", {}))
    interview = phases.get("interview", {})
    decisions = interview.get("decisions", {})

    # Get description from scope
    scope = phases.get("scope", {})
    description = scope.get("page_purpose", scope.get("purpose", ""))

    # Get page type (landing, dashboard, form, list)
    page_type = ui_config.get("page_type", decisions.get("page_type", {}).get("value", "landing"))

    # Get components used (from component analysis phase)
    component_analysis = phases.get("component_analysis", {})
    uses_components = component_analysis.get("selected_components", [])
    if not uses_components:
        uses_components = ui_config.get("uses_components", [])

    # Get data fetching type from interview
    data_fetching = decisions.get("data_fetching", {}).get("value", "server")
    if isinstance(data_fetching, dict):
        data_fetching = data_fetching.get("value", "server")

    # Check auth requirement
    auth_required = decisions.get("auth_required", {}).get("value", False)
    if isinstance(auth_required, dict):
        auth_required = auth_required.get("value", False)

    # Route path (kebab-case)
    route_path = element_name.lower().replace(" ", "-").replace("_", "-")

    return {
        "name": element_name.replace("-", " ").title(),
        "description": description[:200] if description else f"Page: {element_name}",
        "type": page_type,
        "file": f"src/app/{route_path}/page.tsx",
        "route": f"/{route_path}",
        "tests": f"tests/e2e/{route_path}.spec.ts",
        "uses_components": uses_components if isinstance(uses_components, list) else [],
        "data_fetching": data_fetching,
        "auth_required": auth_required,
        "status": "complete",
        "created_at": datetime.now().strftime("%Y-%m-%d")
    }


def get_active_element(state):
    """Get active element - supports both API and UI workflows."""
    # UI workflow format: elements object with active_element pointer
    if "elements" in state and "active_element" in state:
        active = state.get("active_element")
        if active and active in state["elements"]:
            return active, state["elements"][active]

    # Fall back to API endpoint format
    return get_active_endpoint(state)


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")

    # Only process Write/Edit operations
    if tool_name not in ["Write", "Edit"]:
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

    # Determine workflow type
    workflow = state.get("workflow", "api-create")

    # Get active element based on workflow type
    if workflow in ["ui-create-component", "ui-create-page"]:
        element_name, element_state = get_active_element(state)
    else:
        element_name, element_state = get_active_endpoint(state)

    if not element_name or not element_state:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if completion phase just became "complete"
    phases = element_state.get("phases", state.get("phases", {}))
    completion = phases.get("completion", {})

    if completion.get("status") != "complete":
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if already in registry (avoid duplicates)
    registry = load_registry()

    # Result object - may include notify for UI workflows
    result = {"continue": True}

    # Route to appropriate handler based on workflow
    if workflow == "ui-create-component":
        # Component workflow
        if element_name in registry.get("components", {}):
            print(json.dumps(result))
            sys.exit(0)

        entry = extract_component_entry(element_name, element_state, state)
        registry.setdefault("components", {})[element_name] = entry
        result["notify"] = f"🎨 View in UI Showcase: http://localhost:3000/ui-showcase"

    elif workflow == "ui-create-page":
        # Page workflow
        if element_name in registry.get("pages", {}):
            print(json.dumps(result))
            sys.exit(0)

        entry = extract_page_entry(element_name, element_state, state)
        registry.setdefault("pages", {})[element_name] = entry
        result["notify"] = f"🎨 View in UI Showcase: http://localhost:3000/ui-showcase"

    elif workflow in ["combine-api", "combine-ui"]:
        # Combined workflow
        if element_name in registry.get("combined", {}):
            print(json.dumps(result))
            sys.exit(0)

        entry = extract_combined_entry(element_name, element_state, state)
        registry.setdefault("combined", {})[element_name] = entry

    else:
        # Default: API workflow
        if element_name in registry.get("apis", {}):
            print(json.dumps(result))
            sys.exit(0)

        entry = extract_api_entry(element_name, element_state, state)
        registry.setdefault("apis", {})[element_name] = entry
        result["notify"] = f"🔌 View in API Showcase: http://localhost:3000/api-showcase"

    # Save registry
    save_registry(registry)

    # Return success (with optional notify for UI workflows)
    print(json.dumps(result))
    sys.exit(0)


if __name__ == "__main__":
    main()
