#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Inject brand guide content and validate color compliance during UI implementation

This hook runs before writing component/page files. When use_brand_guide=true
in the state, it logs the brand guide summary to remind Claude to apply
consistent branding and validates that only approved colors are used.

Version: 3.10.0

Returns:
  - {"continue": true} - Always continues (notifies on violations)
  - May include "notify" with brand guide summary or color violations
"""
import json
import sys
import re
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
BRAND_GUIDE_FILE = Path(__file__).parent.parent / "BRAND_GUIDE.md"


def extract_brand_colors(content):
    """Extract all brand colors from brand guide markdown.

    Returns a set of allowed colors (hex values, CSS variables, Tailwind classes).
    """
    allowed_colors = set()

    # Extract hex colors from brand guide
    hex_pattern = r'#[0-9A-Fa-f]{3,8}'
    for match in re.finditer(hex_pattern, content):
        allowed_colors.add(match.group(0).upper())

    # Extract CSS variable names
    css_var_pattern = r'var\(--([a-zA-Z0-9-]+)\)'
    for match in re.finditer(css_var_pattern, content):
        allowed_colors.add(f"--{match.group(1)}")

    # Extract Tailwind color classes mentioned in brand guide
    tailwind_pattern = r'(?:bg|text|border|ring)-([a-zA-Z]+-[0-9]+|[a-zA-Z]+)'
    for match in re.finditer(tailwind_pattern, content):
        allowed_colors.add(match.group(0))

    # Always allow these common values
    allowed_colors.update([
        'transparent', 'inherit', 'currentColor', 'current',
        'white', 'black', 'bg-white', 'bg-black', 'text-white', 'text-black',
        'bg-transparent', 'border-transparent',
        # Common utility colors
        'bg-background', 'text-foreground', 'border-border',
        'bg-primary', 'text-primary', 'border-primary',
        'bg-secondary', 'text-secondary', 'border-secondary',
        'bg-accent', 'text-accent', 'border-accent',
        'bg-muted', 'text-muted', 'border-muted',
        'bg-destructive', 'text-destructive', 'border-destructive',
    ])

    return allowed_colors


def extract_colors_from_code(code_content):
    """Extract colors used in component code.

    Returns a list of color usages found.
    """
    used_colors = []

    # Find hex colors
    hex_pattern = r'#[0-9A-Fa-f]{3,8}'
    for match in re.finditer(hex_pattern, code_content):
        used_colors.append(('hex', match.group(0).upper()))

    # Find Tailwind color classes (excluding allowed dynamic patterns)
    tailwind_pattern = r'(?:bg|text|border|ring|from|to|via)-([a-zA-Z]+-[0-9]+)'
    for match in re.finditer(tailwind_pattern, code_content):
        # Skip if it's a dynamic value like bg-[#xxx]
        full_match = match.group(0)
        if '[' not in full_match:
            used_colors.append(('tailwind', full_match))

    # Find inline style colors
    style_pattern = r'(?:color|backgroundColor|borderColor):\s*["\']([^"\']+)["\']'
    for match in re.finditer(style_pattern, code_content):
        value = match.group(1)
        if value.startswith('#'):
            used_colors.append(('style', value.upper()))

    return used_colors


def validate_color_compliance(code_content, allowed_colors):
    """Check if code uses only brand-approved colors.

    Returns list of violations found.
    """
    violations = []
    used_colors = extract_colors_from_code(code_content)

    for color_type, color_value in used_colors:
        # Check if color is allowed
        is_allowed = False

        if color_type == 'hex':
            is_allowed = color_value in allowed_colors
        elif color_type == 'tailwind':
            is_allowed = color_value in allowed_colors or color_value.split('-')[0] in ['bg', 'text', 'border']
        elif color_type == 'style':
            is_allowed = color_value in allowed_colors

        if not is_allowed:
            # Check against all allowed colors more loosely
            if color_value not in allowed_colors:
                violations.append(f"{color_type}: {color_value}")

    return violations


def extract_brand_summary(content):
    """Extract key brand values from brand guide markdown."""
    summary = []

    lines = content.split("\n")
    current_section = ""

    for line in lines:
        line = line.strip()

        # Track section
        if line.startswith("## "):
            current_section = line[3:].lower()
            continue

        # Extract key values
        if line.startswith("- **") and ":" in line:
            # Parse "- **Key:** Value" format
            try:
                key_part = line.split(":**")[0].replace("- **", "")
                value_part = line.split(":**")[1].strip()

                # Only include primary brand values
                if current_section == "colors" and key_part in ["Primary", "Accent", "Background"]:
                    summary.append(f"{key_part}: {value_part}")
                elif current_section == "typography" and key_part in ["Headings", "Body"]:
                    summary.append(f"{key_part}: {value_part}")
                elif current_section == "component styling" and key_part in ["Border Radius", "Focus Ring"]:
                    summary.append(f"{key_part}: {value_part}")
            except IndexError:
                continue

    return summary


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

    # Check if brand guide is enabled
    ui_config = state.get("ui_config", {})
    use_brand_guide = ui_config.get("use_brand_guide", False)

    if not use_brand_guide:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if brand guide file exists
    if not BRAND_GUIDE_FILE.exists():
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Extract brand summary
    brand_content = BRAND_GUIDE_FILE.read_text()
    summary = extract_brand_summary(brand_content)

    # For Edit operations, check color compliance
    tool_input = input_data.get("tool_input", {})
    if tool_name == "Edit":
        new_content = tool_input.get("new_string", "")
        if new_content:
            allowed_colors = extract_brand_colors(brand_content)
            violations = validate_color_compliance(new_content, allowed_colors)

            if violations:
                notify_msg = f"⚠️ Brand color check: {len(violations)} potential non-brand colors: " + ", ".join(violations[:3])
                print(json.dumps({"continue": True, "notify": notify_msg}))
                sys.exit(0)

    if summary:
        notify_msg = "Applying brand guide: " + " | ".join(summary[:5])
        print(json.dumps({"continue": True, "notify": notify_msg}))
    else:
        print(json.dumps({"continue": True}))

    sys.exit(0)


if __name__ == "__main__":
    main()
