#!/usr/bin/env python3
"""
Hook: SessionStart
Purpose: Detect and prompt for interrupted workflows

This hook runs at session start and checks if there are any
in-progress workflows that were interrupted. If found, it injects
a prompt asking the user if they want to resume.

Added in v3.6.7 for session continuation support.

Returns:
  - JSON with additionalContext about interrupted workflows
"""
import json
import sys
import os
from datetime import datetime
from pathlib import Path

STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"


def get_interrupted_workflows(state):
    """Find all workflows that are in_progress but not active."""
    interrupted = []

    # New format (v3.6.7+): check endpoints object
    if "endpoints" in state:
        active = state.get("active_endpoint")
        for endpoint_name, endpoint_data in state["endpoints"].items():
            status = endpoint_data.get("status", "not_started")
            if status == "in_progress" and endpoint_name != active:
                # Find the current phase
                phases = endpoint_data.get("phases", {})
                current_phase = None
                for phase_name, phase_data in phases.items():
                    if phase_data.get("status") == "in_progress":
                        current_phase = phase_name
                        break

                interrupted.append({
                    "endpoint": endpoint_name,
                    "status": status,
                    "current_phase": current_phase,
                    "started_at": endpoint_data.get("started_at"),
                    "interrupted_at": endpoint_data.get("session", {}).get("interrupted_at"),
                    "interrupted_phase": endpoint_data.get("session", {}).get("interrupted_phase")
                })

        # Also check if active endpoint is not fully started
        if active and active in state["endpoints"]:
            active_data = state["endpoints"][active]
            session = active_data.get("session", {})
            if session.get("interrupted_at"):
                # Active endpoint was previously interrupted
                interrupted.insert(0, {
                    "endpoint": active,
                    "status": active_data.get("status"),
                    "current_phase": session.get("interrupted_phase"),
                    "started_at": active_data.get("started_at"),
                    "interrupted_at": session.get("interrupted_at"),
                    "is_active": True
                })

    # Old format: single endpoint
    elif state.get("endpoint"):
        endpoint = state.get("endpoint")
        phases = state.get("phases", {})

        # Check if any phase is in_progress
        for phase_name, phase_data in phases.items():
            if phase_data.get("status") == "in_progress":
                interrupted.append({
                    "endpoint": endpoint,
                    "status": "in_progress",
                    "current_phase": phase_name,
                    "started_at": state.get("created_at"),
                    "is_legacy": True
                })
                break

    return interrupted


def format_interrupted_message(interrupted):
    """Format a user-friendly message about interrupted workflows."""
    if not interrupted:
        return None

    lines = [
        "",
        "=" * 60,
        " INTERRUPTED WORKFLOW DETECTED",
        "=" * 60,
        ""
    ]

    for i, workflow in enumerate(interrupted, 1):
        endpoint = workflow["endpoint"]
        phase = workflow.get("current_phase", "unknown")
        started = workflow.get("started_at", "unknown")
        interrupted_at = workflow.get("interrupted_at", "")

        lines.append(f"{i}. **{endpoint}**")
        lines.append(f"   - Phase: {phase}")
        lines.append(f"   - Started: {started}")
        if interrupted_at:
            lines.append(f"   - Interrupted: {interrupted_at}")
        lines.append("")

    lines.extend([
        "To resume an interrupted workflow, use:",
        "  /api-continue [endpoint-name]",
        "",
        "Or start a new workflow with:",
        "  /api-create [new-endpoint-name]",
        "",
        "=" * 60
    ])

    return "\n".join(lines)


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        input_data = {}

    # Check if state file exists
    if not STATE_FILE.exists():
        print(json.dumps({"continue": True}))
        sys.exit(0)

    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Find interrupted workflows
    interrupted = get_interrupted_workflows(state)

    if not interrupted:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Format message
    message = format_interrupted_message(interrupted)

    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": message,
            "interruptedWorkflows": interrupted
        }
    }

    print(json.dumps(output))
    sys.exit(0)


if __name__ == "__main__":
    main()
