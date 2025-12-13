#!/usr/bin/env python3
"""
Hook: PostToolUse for Write/Edit
Purpose: Auto-create UI Showcase page when first component/page is created
         and auto-populate showcase data from registry.

This hook monitors for new component or page registrations. When the first
UI element is added to registry.json, it creates the UI Showcase page
at src/app/ui-showcase/ if it doesn't exist.

Also generates src/app/ui-showcase/data.json from registry for auto-population.

Version: 3.10.0

Returns:
  - {"continue": true} - Always continues
  - May include "notify" about showcase creation
"""
import json
import sys
from pathlib import Path
import shutil
from datetime import datetime

# State and registry files in .claude/ directory
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
REGISTRY_FILE = Path(__file__).parent.parent / "registry.json"


def generate_showcase_data(registry, cwd):
    """Generate showcase data file from registry for auto-population.

    Creates src/app/ui-showcase/data.json with component/page listings.
    """
    components = registry.get("components", {})
    pages = registry.get("pages", {})

    showcase_data = {
        "version": "3.10.0",
        "generated_at": datetime.now().isoformat(),
        "components": [],
        "pages": []
    }

    # Process components
    for name, comp in components.items():
        showcase_data["components"].append({
            "id": name,
            "name": comp.get("name", name),
            "description": comp.get("description", ""),
            "type": comp.get("type", "atom"),
            "path": comp.get("path", f"src/components/{name}/{name}.tsx"),
            "storybook_url": comp.get("storybook_url", f"/?path=/story/{name.lower()}--default"),
            "variants": comp.get("variants", []),
            "props": list(comp.get("props", {}).keys()) if isinstance(comp.get("props"), dict) else [],
            "created_at": comp.get("created_at", ""),
            "status": comp.get("status", "ready")
        })

    # Process pages
    for name, page in pages.items():
        showcase_data["pages"].append({
            "id": name,
            "name": page.get("name", name),
            "description": page.get("description", ""),
            "route": page.get("route", f"/{name}"),
            "page_type": page.get("page_type", "landing"),
            "path": page.get("path", f"src/app/{name}/page.tsx"),
            "requires_auth": page.get("requires_auth", False),
            "data_sources": page.get("data_sources", []),
            "created_at": page.get("created_at", ""),
            "status": page.get("status", "ready")
        })

    # Write data file
    data_file = cwd / "src" / "app" / "ui-showcase" / "data.json"
    data_file.parent.mkdir(parents=True, exist_ok=True)
    data_file.write_text(json.dumps(showcase_data, indent=2))

    return str(data_file.relative_to(cwd))


def copy_showcase_templates(cwd):
    """Copy UI showcase templates to src/app/ui-showcase/."""
    # Source templates (installed by CLI)
    templates_dir = Path(__file__).parent.parent / "templates" / "ui-showcase"

    # Destination
    showcase_dir = cwd / "src" / "app" / "ui-showcase"

    # Create directory if needed
    showcase_dir.mkdir(parents=True, exist_ok=True)

    # Copy template files
    templates_to_copy = [
        ("page.tsx", "page.tsx"),
        ("UIShowcase.tsx", "_components/UIShowcase.tsx"),
        ("PreviewCard.tsx", "_components/PreviewCard.tsx"),
        ("PreviewModal.tsx", "_components/PreviewModal.tsx"),
    ]

    created_files = []
    for src_name, dest_name in templates_to_copy:
        src_path = templates_dir / src_name
        dest_path = showcase_dir / dest_name

        # Create subdirectories if needed
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        if src_path.exists() and not dest_path.exists():
            shutil.copy2(src_path, dest_path)
            created_files.append(str(dest_path.relative_to(cwd)))

    return created_files


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

    workflow = state.get("workflow", "")

    # Only apply for UI workflows
    if workflow not in ["ui-create-component", "ui-create-page"]:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if completion phase is complete
    active_element = state.get("active_element", "")
    elements = state.get("elements", {})

    if active_element and active_element in elements:
        phases = elements[active_element].get("phases", {})
    else:
        phases = state.get("phases", {})

    completion = phases.get("completion", {})
    if completion.get("status") != "complete":
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if showcase already exists
    cwd = Path.cwd()
    showcase_page = cwd / "src" / "app" / "ui-showcase" / "page.tsx"

    if showcase_page.exists():
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if we have components or pages in registry
    if not REGISTRY_FILE.exists():
        print(json.dumps({"continue": True}))
        sys.exit(0)

    try:
        registry = json.loads(REGISTRY_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    components = registry.get("components", {})
    pages = registry.get("pages", {})

    # Create showcase if we have at least one component or page
    if components or pages:
        created_files = copy_showcase_templates(cwd)

        # Always update data.json from registry
        data_file = generate_showcase_data(registry, cwd)

        if created_files:
            print(json.dumps({
                "continue": True,
                "notify": f"Created UI Showcase at /ui-showcase ({len(created_files)} files) + data.json"
            }))
        else:
            # Just updated data.json
            print(json.dumps({
                "continue": True,
                "notify": f"Updated UI Showcase data ({len(components)} components, {len(pages)} pages)"
            }))
    else:
        print(json.dumps({"continue": True}))

    sys.exit(0)


if __name__ == "__main__":
    main()
