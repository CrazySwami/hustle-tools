#!/usr/bin/env python3
"""
Hook: PreToolUse (Write|Edit)
Purpose: Enforce research freshness for the active endpoint

This hook blocks Write/Edit operations if:
  1. There is an active endpoint in api-dev-state.json
  2. Research exists for that endpoint
  3. Research is older than 7 days (configurable)

The user can:
  - Run /hustle-api-research to refresh the research
  - Set "enforce_freshness": false in the endpoint config to disable
  - Research is only enforced for the ACTIVE endpoint

Exit Codes:
  - 0: Continue (no active endpoint, research is fresh, or enforcement disabled)
  - 2: Block with message (research is stale, requires re-research)

Added in v3.7.0:
  - User requested enforcement (not just warning) for stale research
  - Only enforces for the active endpoint being worked on
"""
import json
import sys
import os
from datetime import datetime
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
RESEARCH_INDEX = Path(__file__).parent.parent / "research" / "index.json"

# Default freshness threshold (days)
FRESHNESS_THRESHOLD_DAYS = 7


def get_active_endpoint(state):
    """Get active endpoint - supports both old and new state formats."""
    if "endpoints" in state and "active_endpoint" in state:
        active = state.get("active_endpoint")
        if active and active in state["endpoints"]:
            return active, state["endpoints"][active]
        return None, None

    # Old format
    endpoint = state.get("endpoint")
    if endpoint:
        return endpoint, state

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


def is_api_related_file(file_path):
    """Check if the file being written is API-related."""
    if not file_path:
        return False

    file_path = file_path.lower()

    # Files that indicate API development
    api_indicators = [
        '/api/',
        '/route.ts',
        '/route.js',
        '.api.test.',
        '/schemas/',
        'api-tests-manifest',
        '/v2/'
    ]

    return any(indicator in file_path for indicator in api_indicators)


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        input_data = {}

    # Get the file being written (if applicable)
    tool_input = input_data.get("toolInput", {})
    file_path = tool_input.get("file_path", "")

    # Only enforce for API-related files
    if not is_api_related_file(file_path):
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
        # No active endpoint - allow
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if freshness enforcement is disabled for this endpoint
    if endpoint_data.get("enforce_freshness") is False:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check research freshness
    research_index = load_research_index()

    if endpoint not in research_index:
        # No research indexed yet - allow but note this is caught by enforce-research.py
        print(json.dumps({"continue": True}))
        sys.exit(0)

    entry = research_index[endpoint]
    last_updated = entry.get("last_updated", "")
    days_old = calculate_days_old(last_updated)

    # Get custom threshold if set
    threshold = endpoint_data.get("freshness_threshold_days", FRESHNESS_THRESHOLD_DAYS)

    if days_old > threshold:
        # Research is stale - block and require re-research
        output = {
            "decision": "block",
            "reason": f"""🔄 STALE RESEARCH DETECTED

Research for '{endpoint}' is {days_old} days old (threshold: {threshold} days).

**Action Required:**
Run `/hustle-api-research {endpoint}` to refresh the research before continuing.

**Why This Matters:**
- API documentation may have changed
- New parameters or features may be available
- Breaking changes may have been introduced
- Your implementation may not match current docs

**To Skip (Not Recommended):**
Set `"enforce_freshness": false` in api-dev-state.json for this endpoint.

Last researched: {last_updated or 'Unknown'}
Research location: .claude/research/{endpoint}/CURRENT.md"""
        }
        print(json.dumps(output))
        sys.exit(2)  # Exit code 2 = block with message

    # Research is fresh - continue
    print(json.dumps({"continue": True}))
    sys.exit(0)


if __name__ == "__main__":
    main()
