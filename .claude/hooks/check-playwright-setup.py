#!/usr/bin/env python3
"""
Hook: PreToolUse for Write
Purpose: Verify Playwright is configured before writing E2E test files

This hook runs before writing E2E test files. It checks that:
- playwright.config.ts or playwright.config.js exists
- @playwright/test is in package.json dependencies

If Playwright is not configured, it blocks and suggests installation.

Version: 3.9.0

Returns:
  - {"continue": true} - If Playwright is configured or not an E2E test file
  - {"continue": false, "reason": "..."} - If Playwright is not configured
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

    # Check if writing an E2E test file
    file_path = tool_input.get("file_path", "")

    # Common E2E test patterns
    is_e2e_test = (
        file_path.endswith(".spec.ts") or
        file_path.endswith(".spec.tsx") or
        file_path.endswith(".e2e.ts") or
        file_path.endswith(".e2e.tsx") or
        "/e2e/" in file_path or
        "/tests/e2e/" in file_path
    )

    if not is_e2e_test:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Look for playwright config in common locations
    cwd = Path.cwd()
    config_files = [
        cwd / "playwright.config.ts",
        cwd / "playwright.config.js",
        cwd.parent / "playwright.config.ts",
        cwd.parent / "playwright.config.js",
    ]

    playwright_found = False
    for config_file in config_files:
        if config_file.exists():
            playwright_found = True
            break

    # Also check package.json for @playwright/test
    if not playwright_found:
        package_json = cwd / "package.json"
        if package_json.exists():
            try:
                pkg = json.loads(package_json.read_text())
                deps = pkg.get("devDependencies", {})
                deps.update(pkg.get("dependencies", {}))
                if "@playwright/test" in deps:
                    playwright_found = True
            except (json.JSONDecodeError, IOError):
                pass

    if not playwright_found:
        print(json.dumps({
            "continue": False,
            "reason": (
                "Playwright is not configured in this project.\n\n"
                "Before writing E2E test files, please install Playwright:\n\n"
                "  npm init playwright@latest\n\n"
                "This will create playwright.config.ts and install browsers.\n"
                "After installation, run 'npx playwright test' to run tests."
            )
        }))
        sys.exit(0)

    # Playwright is configured
    print(json.dumps({"continue": True}))
    sys.exit(0)


if __name__ == "__main__":
    main()
