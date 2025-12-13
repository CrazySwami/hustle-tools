#!/usr/bin/env python3
"""
Hook: PostToolUse for Write/Edit
Purpose: Auto-create API Showcase page when first API is created

This hook monitors for new API registrations. When the first API is added
to registry.json, it creates the API Showcase page at src/app/api-showcase/
if it doesn't exist.

Version: 3.9.0

Returns:
  - {"continue": true} - Always continues
  - May include "notify" about showcase creation
"""
import json
import sys
from pathlib import Path
import shutil

# State and registry files in .claude/ directory
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
REGISTRY_FILE = Path(__file__).parent.parent / "registry.json"


def copy_showcase_templates(cwd):
    """Copy API showcase templates to src/app/api-showcase/."""
    # Source templates (installed by CLI)
    templates_dir = Path(__file__).parent.parent / "templates" / "api-showcase"

    # Destination
    showcase_dir = cwd / "src" / "app" / "api-showcase"

    # Create directory if needed
    showcase_dir.mkdir(parents=True, exist_ok=True)

    # Copy template files
    templates_to_copy = [
        ("page.tsx", "page.tsx"),
        ("APIShowcase.tsx", "_components/APIShowcase.tsx"),
        ("APICard.tsx", "_components/APICard.tsx"),
        ("APIModal.tsx", "_components/APIModal.tsx"),
        ("APITester.tsx", "_components/APITester.tsx"),
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

    # Only apply for API workflows
    if workflow not in ["api-create", "combine-api"]:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if completion phase is complete
    active_endpoint = state.get("active_endpoint", "")
    endpoints = state.get("endpoints", {})

    if active_endpoint and active_endpoint in endpoints:
        phases = endpoints[active_endpoint].get("phases", {})
    else:
        phases = state.get("phases", {})

    completion = phases.get("completion", {})
    if completion.get("status") != "complete":
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if showcase already exists
    cwd = Path.cwd()
    showcase_page = cwd / "src" / "app" / "api-showcase" / "page.tsx"

    if showcase_page.exists():
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if we have APIs in registry
    if not REGISTRY_FILE.exists():
        print(json.dumps({"continue": True}))
        sys.exit(0)

    try:
        registry = json.loads(REGISTRY_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    apis = registry.get("apis", {})
    combined = registry.get("combined", {})

    # Create showcase if we have at least one API
    if apis or combined:
        created_files = copy_showcase_templates(cwd)

        if created_files:
            print(json.dumps({
                "continue": True,
                "notify": f"Created API Showcase at /api-showcase ({len(created_files)} files)"
            }))
        else:
            print(json.dumps({"continue": True}))
    else:
        print(json.dumps({"continue": True}))

    sys.exit(0)


if __name__ == "__main__":
    main()
