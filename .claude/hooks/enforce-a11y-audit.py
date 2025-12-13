#!/usr/bin/env python3
"""
Hook: PostToolUse for Write/Edit
Purpose: Trigger accessibility audit after UI component/page implementation

This hook runs after Phase 9 (TDD GREEN) for UI workflows. It notifies Claude
to run axe-core audit on Storybook stories or pages to verify WCAG compliance.

Version: 3.10.0

Returns:
  - {"continue": true} - Always continues
  - May include "notify" with accessibility check reminder
  - May include "additionalContext" with accessibility guidelines
"""
import json
import sys
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"

# WCAG 2.1 Level AA Quick Reference
WCAG_AA_CHECKLIST = [
    "Color contrast: 4.5:1 for normal text, 3:1 for large text",
    "Focus visible: All interactive elements show focus state",
    "Keyboard nav: All functionality accessible via keyboard",
    "Labels: All form inputs have associated labels",
    "Alt text: All images have meaningful alt text",
    "Headings: Proper heading hierarchy (h1-h6)",
    "Touch targets: Min 44x44px for touch targets",
    "Error messages: Clear error identification and suggestions",
]


def get_workflow_type(state):
    """Detect the workflow type from state."""
    workflow = state.get("workflow", "")
    if workflow:
        return workflow

    if state.get("ui_config"):
        mode = state.get("ui_config", {}).get("mode", "")
        return f"ui-create-{mode}" if mode else "ui-create-component"

    return "api-create"


def get_active_element(state):
    """Get active element name and data."""
    if "elements" in state and "active_element" in state:
        active = state.get("active_element")
        if active and active in state["elements"]:
            return active, state["elements"][active]
        return None, None

    active = state.get("active_element")
    if active:
        return active, state

    return None, None


def is_verify_phase(phases):
    """Check if we're in or just completed the verify phase."""
    verify = phases.get("verify", {})
    tdd_green = phases.get("tdd_green", {})

    # After green, before or during verify
    return (
        tdd_green.get("status") == "complete" and
        verify.get("status") in ["not_started", "in_progress"]
    )


def get_accessibility_level(state, element_data):
    """Get the accessibility level requirement."""
    ui_config = state.get("ui_config", {})
    if not ui_config and element_data:
        ui_config = element_data.get("ui_config", {})

    return ui_config.get("accessibility_level", "AA")


def generate_a11y_commands(element_name, workflow_type):
    """Generate accessibility testing commands."""
    commands = []

    if "component" in workflow_type:
        commands.extend([
            f"# Storybook accessibility check",
            f"pnpm storybook --ci",
            f"# Then run axe in browser or:",
            f"pnpm dlx @storybook/test-runner --url http://localhost:6006",
            f"",
            f"# Or manual axe-core check:",
            f"pnpm dlx @axe-core/cli http://localhost:6006/?path=/story/{element_name.lower()}--default"
        ])
    else:
        commands.extend([
            f"# Page accessibility check",
            f"pnpm dev",
            f"# Then in another terminal:",
            f"pnpm dlx @axe-core/cli http://localhost:3000/{element_name}",
            f"",
            f"# Or use Playwright accessibility tests:",
            f"pnpm test:e2e --grep 'accessibility'"
        ])

    return "\n".join(commands)


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

    workflow_type = get_workflow_type(state)

    # Only apply for UI workflows
    if not workflow_type.startswith("ui-create"):
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Get active element
    element_name, element_data = get_active_element(state)
    if not element_name or not element_data:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    phases = element_data.get("phases", {}) if element_data else state.get("phases", {})

    # Check if we should trigger a11y audit (after TDD Green)
    if not is_verify_phase(phases):
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Get accessibility level
    a11y_level = get_accessibility_level(state, element_data)

    # Generate audit commands
    commands = generate_a11y_commands(element_name, workflow_type)

    # Build accessibility context
    checklist = "\n".join([f"  - {item}" for item in WCAG_AA_CHECKLIST])

    context = f"""
## Accessibility Audit Required (WCAG 2.1 {a11y_level})

The TDD Green phase is complete. Before marking verify as complete, run an accessibility audit.

### Quick Commands
```bash
{commands}
```

### WCAG 2.1 {a11y_level} Checklist
{checklist}

### 4-Step Verification for UI
1. **Responsive**: Test at 320px, 768px, 1024px, 1440px
2. **Data Binding**: Verify all data sources load correctly
3. **Tests**: All unit/e2e tests pass
4. **Accessibility**: Run axe-core, fix any violations

If violations are found, fix them before completing the verify phase.
"""

    output = {
        "continue": True,
        "notify": f"Accessibility audit required for {element_name} (WCAG 2.1 {a11y_level})",
        "additionalContext": context
    }

    print(json.dumps(output))
    sys.exit(0)


if __name__ == "__main__":
    main()
