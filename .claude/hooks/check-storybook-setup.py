#!/usr/bin/env python3
"""
Hook: PreToolUse for Write
Purpose: Verify Storybook is configured before writing story files

This hook runs before writing .stories.tsx files. It checks that:
- .storybook/ directory exists
- main.ts or main.js config exists

If Storybook is not configured, it blocks and suggests installation.

Version: 3.9.0

Returns:
  - {"continue": true} - If Storybook is configured or not a story file
  - {"continue": false, "reason": "..."} - If Storybook is not configured
"""
import json
import sys
from pathlib import Path


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    # Only check Write operations
    if tool_name != "Write":
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if writing a story file
    file_path = tool_input.get("file_path", "")
    if not file_path.endswith(".stories.tsx") and not file_path.endswith(".stories.ts"):
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Look for .storybook directory in common locations
    cwd = Path.cwd()
    storybook_dirs = [
        cwd / ".storybook",
        cwd.parent / ".storybook",  # In case running from subdirectory
    ]

    storybook_found = False
    for storybook_dir in storybook_dirs:
        if storybook_dir.exists():
            # Check for main config file
            main_ts = storybook_dir / "main.ts"
            main_js = storybook_dir / "main.js"
            if main_ts.exists() or main_js.exists():
                storybook_found = True
                break

    if not storybook_found:
        print(json.dumps({
            "continue": False,
            "reason": (
                "Storybook is not configured in this project.\n\n"
                "Before writing story files, please install Storybook:\n\n"
                "  npx storybook@latest init\n\n"
                "This will create the .storybook/ directory and configuration.\n"
                "After installation, run 'pnpm storybook' to start the dev server."
            )
        }))
        sys.exit(0)

    # Storybook is configured
    print(json.dumps({"continue": True}))
    sys.exit(0)


if __name__ == "__main__":
    main()
