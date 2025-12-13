#!/usr/bin/env python3
"""
Hook: PreToolUse for AskUserQuestion
Purpose: Validate interview questions come from research, not templates

This hook ensures that questions asked during the interview phase are
generated from actual research findings, not generic template questions.

Added in v3.6.7 for question quality enforcement.

Returns:
  - {"permissionDecision": "allow"} - Question is properly sourced
  - {"permissionDecision": "allow", "message": "..."} - Allow with reminder
"""
import json
import sys
from pathlib import Path

STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"


def get_active_endpoint(state):
    """Get active endpoint - supports both old and new state formats."""
    if "endpoints" in state and "active_endpoint" in state:
        active = state.get("active_endpoint")
        if active and active in state["endpoints"]:
            return active, state["endpoints"][active]
        return None, None

    endpoint = state.get("endpoint")
    if endpoint:
        return endpoint, state

    return None, None


def get_research_keywords(state, endpoint_data):
    """Extract keywords from research that should appear in questions."""
    keywords = set()

    # From research queries
    for query in state.get("research_queries", []):
        q = query.get("query", "")
        # Extract meaningful words (length > 3)
        words = [w.lower() for w in q.split() if len(w) > 3]
        keywords.update(words)

    # From initial research sources
    initial = endpoint_data.get("phases", {}).get("research_initial", {})
    for src in initial.get("sources", []):
        if isinstance(src, dict):
            summary = src.get("summary", "")
            words = [w.lower() for w in summary.split() if len(w) > 3]
            keywords.update(words)

    # From deep research sources
    deep = endpoint_data.get("phases", {}).get("research_deep", {})
    for src in deep.get("sources", []):
        if isinstance(src, dict):
            summary = src.get("summary", "")
            words = [w.lower() for w in summary.split() if len(w) > 3]
            keywords.update(words)

    return keywords


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    if tool_name != "AskUserQuestion":
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    if not STATE_FILE.exists():
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    endpoint, endpoint_data = get_active_endpoint(state)
    if not endpoint or not endpoint_data:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Only enforce during interview phase
    interview = endpoint_data.get("phases", {}).get("interview", {})
    if interview.get("status") != "in_progress":
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Check if research has been done
    initial = endpoint_data.get("phases", {}).get("research_initial", {})
    if initial.get("status") != "complete":
        # Allow question but remind to do research first
        print(json.dumps({
            "permissionDecision": "allow",
            "message": "REMINDER: Initial research (Phase 3) should be complete before interview. Questions should be generated FROM research findings."
        }))
        sys.exit(0)

    # Get the question being asked
    question = tool_input.get("question", "")

    # Get research keywords
    keywords = get_research_keywords(state, endpoint_data)

    # Check if question contains any research-derived terms
    question_lower = question.lower()
    found_keywords = [k for k in keywords if k in question_lower]

    if not found_keywords and len(keywords) > 5:
        # No research keywords found - this might be a generic question
        print(json.dumps({
            "permissionDecision": "allow",
            "message": f"""NOTE: This question doesn't appear to reference terms discovered in research.

Research-derived terms include: {', '.join(list(keywords)[:10])}...

BEST PRACTICE: Interview questions should be generated FROM research findings.
Example: "I discovered the API supports [feature]. Do you want to implement this?"

Proceeding anyway, but consider revising the question."""
        }))
        sys.exit(0)

    # Question looks good
    print(json.dumps({
        "permissionDecision": "allow",
        "message": f"Question references research terms: {', '.join(found_keywords[:5])}"
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
