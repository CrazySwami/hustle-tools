#!/usr/bin/env python3
"""
Hook: SessionStart
Purpose: Inject current state and context at the beginning of each session

This hook runs when Claude Code starts a new session or resumes.
It reads the api-dev-state.json and injects a summary into Claude's context,
helping to re-ground Claude on:
  - Current endpoint being developed
  - Which phases are complete/in-progress
  - Key decisions from interviews
  - Research cache location and freshness

Returns:
  - JSON with additionalContext to inject into Claude's context

Updated in v3.6.7:
  - Support multi-API state structure (endpoints object)
  - Read research index from .claude/research/index.json file
  - Calculate freshness from timestamps
"""
import json
import sys
import os
from datetime import datetime
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
RESEARCH_INDEX = Path(__file__).parent.parent / "research" / "index.json"


def get_workflow_type(state):
    """Detect the workflow type from state."""
    workflow = state.get("workflow", "")
    if workflow:
        return workflow

    # Infer from state structure
    if state.get("combine_config"):
        return "combine-api"
    if state.get("ui_config"):
        mode = state.get("ui_config", {}).get("mode", "")
        return f"ui-create-{mode}" if mode else "ui-create-component"

    return "api-create"


def get_active_endpoint(state):
    """Get active endpoint - supports both old and new state formats."""
    # New format (v3.6.7+): endpoints object with active_endpoint pointer
    if "endpoints" in state and "active_endpoint" in state:
        active = state.get("active_endpoint")
        if active and active in state["endpoints"]:
            return active, state["endpoints"][active]
        return None, None

    # Support for elements (UI workflow)
    if "elements" in state and "active_element" in state:
        active = state.get("active_element")
        if active and active in state["elements"]:
            return active, state["elements"][active]
        return None, None

    # Old format: single endpoint field
    endpoint = state.get("endpoint")
    if endpoint:
        # Return endpoint name and the entire state as endpoint data
        return endpoint, state

    # Try active_element without elements dict
    active = state.get("active_element")
    if active:
        return active, state

    return None, None


def load_research_index():
    """Load research index from .claude/research/index.json file."""
    if not RESEARCH_INDEX.exists():
        return {}
    try:
        index = json.loads(RESEARCH_INDEX.read_text())
        return index.get("apis", {})
    except (json.JSONDecodeError, IOError):
        return {}


def calculate_days_old(timestamp_str):
    """Calculate how many days old a timestamp is."""
    if not timestamp_str:
        return 0
    try:
        last_updated = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        now = datetime.now(last_updated.tzinfo) if last_updated.tzinfo else datetime.now()
        return (now - last_updated).days
    except (ValueError, TypeError):
        return 0


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        input_data = {}

    cwd = input_data.get("cwd", os.getcwd())

    # Check if state file exists
    if not STATE_FILE.exists():
        # No active workflow - just continue without injection
        print(json.dumps({"continue": True}))
        sys.exit(0)

    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Get active endpoint (supports both old and new formats)
    endpoint, endpoint_data = get_active_endpoint(state)
    if not endpoint or not endpoint_data:
        # No active endpoint - just continue
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Detect workflow type
    workflow_type = get_workflow_type(state)

    # Build context summary
    context_parts = []

    # Header based on workflow type
    if workflow_type == "combine-api":
        context_parts.append("## Combined API Development Session Context")
    elif workflow_type.startswith("ui-create"):
        mode = "Page" if "page" in workflow_type else "Component"
        context_parts.append(f"## UI {mode} Development Session Context")
    else:
        context_parts.append("## API Development Session Context")

    context_parts.append("")
    context_parts.append(f"**Workflow:** {workflow_type}")
    context_parts.append(f"**Active Element:** {endpoint}")

    # Add combine-specific context
    if workflow_type == "combine-api":
        combine_config = state.get("combine_config", {})
        source_elements = combine_config.get("source_elements", [])
        flow_type = combine_config.get("flow_type", "sequential")
        error_strategy = combine_config.get("error_strategy", "fail-fast")

        if source_elements:
            source_names = []
            for elem in source_elements:
                if isinstance(elem, dict):
                    source_names.append(elem.get("name", "unknown"))
                else:
                    source_names.append(str(elem))

            context_parts.append("")
            context_parts.append("**Combining APIs:**")
            for name in source_names:
                context_parts.append(f"  - {name}")
            context_parts.append(f"  Flow: {flow_type}")
            context_parts.append(f"  Error Strategy: {error_strategy}")

    # Add UI-specific context
    elif workflow_type.startswith("ui-create"):
        ui_config = state.get("ui_config", {})
        if not ui_config and endpoint_data:
            ui_config = endpoint_data.get("ui_config", {})

        if ui_config:
            context_parts.append("")
            context_parts.append("**UI Configuration:**")
            if ui_config.get("use_brand_guide"):
                context_parts.append("  - Brand guide: Applied")
            if ui_config.get("component_type"):
                context_parts.append(f"  - Type: {ui_config['component_type']}")
            if ui_config.get("accessibility_level"):
                context_parts.append(f"  - A11y: {ui_config['accessibility_level']}")
            if ui_config.get("data_sources"):
                context_parts.append(f"  - Data sources: {len(ui_config['data_sources'])}")

    # Get phase status (from endpoint_data for multi-API, or state for legacy)
    phases = endpoint_data.get("phases", {})
    completed = []
    in_progress = []
    not_started = []

    phase_order = [
        "disambiguation", "scope", "research_initial", "interview",
        "research_deep", "schema_creation", "environment_check",
        "tdd_red", "tdd_green", "verify", "tdd_refactor", "documentation"
    ]

    for phase_name in phase_order:
        phase = phases.get(phase_name, {})
        status = phase.get("status", "not_started")
        if status == "complete":
            completed.append(phase_name)
        elif status == "in_progress":
            in_progress.append(phase_name)
        else:
            not_started.append(phase_name)

    context_parts.append("")
    context_parts.append("**Phase Status:**")
    if completed:
        context_parts.append(f"  - Completed: {', '.join(completed)}")
    if in_progress:
        context_parts.append(f"  - In Progress: {', '.join(in_progress)}")

    # Current phase (first in_progress or first not_started)
    current_phase = in_progress[0] if in_progress else (not_started[0] if not_started else "documentation")
    context_parts.append(f"  - Current: **{current_phase}**")

    # Key decisions from interview
    interview = phases.get("interview", {})
    decisions = interview.get("decisions", {})
    if decisions:
        context_parts.append("")
        context_parts.append("**Key Interview Decisions:**")
        for key, value in decisions.items():
            response = value.get("response", value.get("value", "N/A"))
            if response:
                context_parts.append(f"  - {key}: {str(response)[:100]}")

    # Research cache info - READ FROM index.json FILE (v3.6.7 fix)
    research_index = load_research_index()
    if endpoint in research_index:
        entry = research_index[endpoint]
        last_updated = entry.get("last_updated", "")
        days_old = calculate_days_old(last_updated)
        context_parts.append("")
        context_parts.append("**Research Cache:**")
        context_parts.append(f"  - Location: .claude/research/{endpoint}/CURRENT.md")
        context_parts.append(f"  - Last Updated: {last_updated or 'Unknown'}")
        if days_old > 7:
            context_parts.append(f"  - ⚠️ WARNING: Research is {days_old} days old. Consider re-researching.")
    else:
        # Check if research directory exists even without index entry
        research_dir = Path(__file__).parent.parent / "research" / endpoint
        if research_dir.exists():
            context_parts.append("")
            context_parts.append("**Research Cache:**")
            context_parts.append(f"  - Location: .claude/research/{endpoint}/")
            context_parts.append(f"  - ⚠️ Not indexed - run /api-research to update")

    # Turn count for re-grounding awareness
    turn_count = state.get("turn_count", 0)
    if turn_count > 0:
        context_parts.append("")
        context_parts.append(f"**Session Info:** Turn {turn_count} of previous session")

    # Important file locations
    context_parts.append("")
    context_parts.append("**Key Files:**")
    context_parts.append("  - State: .claude/api-dev-state.json")
    context_parts.append("  - Research: .claude/research/")
    context_parts.append("  - Manifest: src/app/api-test/api-tests-manifest.json (if exists)")

    # Workflow reminder based on type
    context_parts.append("")
    if workflow_type == "combine-api":
        context_parts.append("**Workflow Reminder:** This is a combined API workflow.")
        context_parts.append("Ensure all source APIs exist in registry before orchestration.")
        context_parts.append("Test both individual APIs and the combined flow.")
    elif workflow_type.startswith("ui-create"):
        context_parts.append("**Workflow Reminder:** This is a UI development workflow.")
        context_parts.append("Check registry for reusable components before creating new ones.")
        context_parts.append("Ensure brand guide compliance and accessibility requirements.")
    else:
        context_parts.append("**Workflow Reminder:** This project uses interview-driven API development.")
        context_parts.append("Phases loop back if verification fails. Research before answering API questions.")

    # Build the output
    additional_context = "\n".join(context_parts)

    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": additional_context
        }
    }

    print(json.dumps(output))
    sys.exit(0)


if __name__ == "__main__":
    main()
