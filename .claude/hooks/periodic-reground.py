#!/usr/bin/env python3
"""
Hook: PostToolUse (for periodic re-grounding)
Purpose: Inject context reminders every N turns to prevent context dilution

This hook tracks turn count and periodically injects a summary of:
  - Current endpoint and phase
  - Key decisions from interview
  - Research cache status
  - Important file locations

The goal is to keep Claude grounded during long sessions where
the original CLAUDE.md context may get diluted.

Configuration:
  - REGROUND_INTERVAL: Number of turns between re-grounding (default: 7)

Returns:
  - {"continue": true} with optional additionalContext on reground turns
"""
import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Configuration
REGROUND_INTERVAL = 7  # Re-ground every N turns

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if state file exists
    if not STATE_FILE.exists():
        print(json.dumps({"continue": True}))
        sys.exit(0)

    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Increment turn count
    turn_count = state.get("turn_count", 0) + 1
    state["turn_count"] = turn_count
    state["last_turn_timestamp"] = datetime.now().isoformat()

    # Check if we should re-ground
    should_reground = turn_count % REGROUND_INTERVAL == 0

    if should_reground and state.get("endpoint"):
        # Build re-grounding context
        context_parts = []
        context_parts.append(f"## Re-Grounding Reminder (Turn {turn_count})")
        context_parts.append("")

        endpoint = state.get("endpoint", "unknown")
        context_parts.append(f"**Active Endpoint:** {endpoint}")

        # Get current phase
        phases = state.get("phases", {})
        phase_order = [
            "disambiguation", "scope", "research_initial", "interview",
            "research_deep", "schema_creation", "environment_check",
            "tdd_red", "tdd_green", "verify", "tdd_refactor", "documentation"
        ]

        current_phase = None
        completed_phases = []
        for phase_name in phase_order:
            phase = phases.get(phase_name, {})
            status = phase.get("status", "not_started")
            if status == "complete":
                completed_phases.append(phase_name)
            elif status == "in_progress" and not current_phase:
                current_phase = phase_name

        if not current_phase:
            # Find first not_started phase
            for phase_name in phase_order:
                phase = phases.get(phase_name, {})
                if phase.get("status", "not_started") == "not_started":
                    current_phase = phase_name
                    break

        context_parts.append(f"**Current Phase:** {current_phase or 'documentation'}")
        context_parts.append(f"**Completed:** {', '.join(completed_phases) if completed_phases else 'None'}")

        # Key decisions summary
        interview = phases.get("interview", {})
        decisions = interview.get("decisions", {})
        if decisions:
            context_parts.append("")
            context_parts.append("**Key Decisions:**")
            for key, value in list(decisions.items())[:5]:  # Limit to 5 key decisions
                response = value.get("value", value.get("response", "N/A"))
                if response:
                    context_parts.append(f"  - {key}: {str(response)[:50]}")

        # Research freshness warning
        research_index = state.get("research_index", {})
        if endpoint in research_index:
            entry = research_index[endpoint]
            days_old = entry.get("days_old", 0)
            if days_old > 7:
                context_parts.append("")
                context_parts.append(f"**WARNING:** Research is {days_old} days old. Consider re-researching.")

        # File reminders
        context_parts.append("")
        context_parts.append("**Key Files:** .claude/api-dev-state.json, .claude/research/")

        # Add to reground history
        reground_history = state.setdefault("reground_history", [])
        reground_history.append({
            "turn": turn_count,
            "timestamp": datetime.now().isoformat(),
            "phase": current_phase
        })
        # Keep only last 10 reground events
        state["reground_history"] = reground_history[-10:]

        # Save state
        STATE_FILE.write_text(json.dumps(state, indent=2))

        # Output with context injection
        output = {
            "continue": True,
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": "\n".join(context_parts)
            }
        }
        print(json.dumps(output))
    else:
        # Just update turn count and continue
        STATE_FILE.write_text(json.dumps(state, indent=2))
        print(json.dumps({"continue": True}))

    sys.exit(0)


if __name__ == "__main__":
    main()
