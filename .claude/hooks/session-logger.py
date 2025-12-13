#!/usr/bin/env python3
"""
Hook: Stop
Purpose: Save session to .claude/api-sessions/ for later review

This hook runs when a Claude Code session ends (Stop event).
It saves the session data for the completed workflow including:
  - State snapshot at completion
  - Files created during the workflow
  - Summary of phases completed
  - Research sources used
  - Interview decisions made

Added in v3.6.7 for session logging support.

Returns:
  - JSON with session save info
"""
import json
import sys
import os
from datetime import datetime
from pathlib import Path
import shutil

STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
SESSIONS_DIR = Path(__file__).parent.parent / "api-sessions"
RESEARCH_DIR = Path(__file__).parent.parent / "research"


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


def get_completed_phases(endpoint_data):
    """Get list of completed phases."""
    completed = []
    phases = endpoint_data.get("phases", {})

    phase_order = [
        "disambiguation", "scope", "research_initial", "interview",
        "research_deep", "schema_creation", "environment_check",
        "tdd_red", "tdd_green", "verify", "tdd_refactor", "documentation", "completion"
    ]

    for phase_name in phase_order:
        phase = phases.get(phase_name, {})
        if phase.get("status") == "complete":
            completed.append(phase_name)

    return completed


def get_files_created(endpoint_data):
    """Get list of files created during this workflow."""
    files = []

    # From completion phase
    completion = endpoint_data.get("phases", {}).get("completion", {})
    files.extend(completion.get("files_created", []))

    # From schema phase
    schema = endpoint_data.get("phases", {}).get("schema_creation", {})
    if schema.get("schema_file"):
        files.append(schema.get("schema_file"))

    # From TDD phases
    tdd_red = endpoint_data.get("phases", {}).get("tdd_red", {})
    if tdd_red.get("test_file"):
        files.append(tdd_red.get("test_file"))

    tdd_green = endpoint_data.get("phases", {}).get("tdd_green", {})
    if tdd_green.get("implementation_file"):
        files.append(tdd_green.get("implementation_file"))

    return list(set(files))  # Deduplicate


def generate_summary(endpoint, endpoint_data, state):
    """Generate a markdown summary of the session."""
    completed = get_completed_phases(endpoint_data)
    files = get_files_created(endpoint_data)
    decisions = endpoint_data.get("phases", {}).get("interview", {}).get("decisions", {})

    lines = [
        f"# Session Summary: {endpoint}",
        "",
        f"*Generated: {datetime.now().isoformat()}*",
        "",
        "## Overview",
        "",
        f"- **Endpoint:** {endpoint}",
        f"- **Library:** {endpoint_data.get('library', 'N/A')}",
        f"- **Started:** {endpoint_data.get('started_at', 'N/A')}",
        f"- **Completed Phases:** {len(completed)}/13",
        f"- **Status:** {endpoint_data.get('status', 'unknown')}",
        "",
        "## Phases Completed",
        ""
    ]

    for i, phase in enumerate(completed, 1):
        lines.append(f"{i}. {phase.replace('_', ' ').title()}")

    lines.extend([
        "",
        "## Files Created",
        ""
    ])

    for f in files:
        lines.append(f"- `{f}`")

    if decisions:
        lines.extend([
            "",
            "## Interview Decisions",
            ""
        ])
        for key, value in decisions.items():
            response = value.get("response", value.get("value", "N/A"))
            lines.append(f"- **{key}:** {response}")

    lines.extend([
        "",
        "## Research Sources",
        ""
    ])

    # Check for research cache
    research_path = RESEARCH_DIR / endpoint / "sources.json"
    if research_path.exists():
        try:
            sources = json.loads(research_path.read_text())
            for src in sources.get("sources", [])[:10]:  # Limit to 10
                url = src.get("url", src.get("query", ""))
                if url:
                    lines.append(f"- {url}")
        except (json.JSONDecodeError, IOError):
            lines.append("- (sources.json not readable)")
    else:
        lines.append("- (no sources.json found)")

    lines.extend([
        "",
        "---",
        "",
        f"*Session saved to: .claude/api-sessions/{endpoint}_{{timestamp}}/*"
    ])

    return "\n".join(lines)


def save_session(endpoint, endpoint_data, state):
    """Save session to .claude/api-sessions/."""
    # Create timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    session_dir = SESSIONS_DIR / f"{endpoint}_{timestamp}"
    session_dir.mkdir(parents=True, exist_ok=True)

    # 1. Save state snapshot
    state_snapshot = {
        "saved_at": datetime.now().isoformat(),
        "endpoint": endpoint,
        "endpoint_data": endpoint_data,
        "turn_count": state.get("turn_count", 0),
        "research_queries": state.get("research_queries", [])
    }
    (session_dir / "state-snapshot.json").write_text(json.dumps(state_snapshot, indent=2))

    # 2. Save files list
    files = get_files_created(endpoint_data)
    (session_dir / "files-created.txt").write_text("\n".join(files))

    # 3. Generate and save summary
    summary = generate_summary(endpoint, endpoint_data, state)
    (session_dir / "summary.md").write_text(summary)

    # 4. Copy research cache if exists
    research_src = RESEARCH_DIR / endpoint
    if research_src.exists():
        research_dst = session_dir / "research-cache"
        research_dst.mkdir(exist_ok=True)
        for f in research_src.iterdir():
            if f.is_file():
                shutil.copy2(f, research_dst / f.name)

    # 5. Update sessions index
    update_sessions_index(endpoint, timestamp, endpoint_data)

    return session_dir


def update_sessions_index(endpoint, timestamp, endpoint_data):
    """Update the sessions index file."""
    index_file = SESSIONS_DIR / "index.json"

    if index_file.exists():
        try:
            index = json.loads(index_file.read_text())
        except json.JSONDecodeError:
            index = {"version": "3.6.7", "sessions": []}
    else:
        index = {"version": "3.6.7", "sessions": []}

    # Add this session
    completed = get_completed_phases(endpoint_data)
    index["sessions"].append({
        "endpoint": endpoint,
        "timestamp": timestamp,
        "folder": f"{endpoint}_{timestamp}",
        "status": endpoint_data.get("status", "unknown"),
        "phases_completed": len(completed),
        "created_at": datetime.now().isoformat()
    })

    index_file.write_text(json.dumps(index, indent=2))


def main():
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

    # Get active endpoint
    endpoint, endpoint_data = get_active_endpoint(state)
    if not endpoint or not endpoint_data:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Only save if there's meaningful progress
    completed = get_completed_phases(endpoint_data)
    if len(completed) < 2:
        # Not enough progress to save
        print(json.dumps({
            "hookSpecificOutput": {
                "sessionSaved": False,
                "reason": "Not enough progress to save (need at least 2 completed phases)"
            }
        }))
        sys.exit(0)

    # Save the session
    try:
        session_dir = save_session(endpoint, endpoint_data, state)

        output = {
            "hookSpecificOutput": {
                "sessionSaved": True,
                "endpoint": endpoint,
                "sessionDir": str(session_dir),
                "phasesCompleted": len(completed)
            }
        }

        print(json.dumps(output))
        sys.exit(0)

    except Exception as e:
        output = {
            "hookSpecificOutput": {
                "sessionSaved": False,
                "error": str(e)
            }
        }
        print(json.dumps(output))
        sys.exit(0)


if __name__ == "__main__":
    main()
