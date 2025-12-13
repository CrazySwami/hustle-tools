#!/usr/bin/env python3
"""
Hook: PostToolUse for AskUserQuestion
Purpose: Track implemented vs deferred features for scope coverage

This hook tracks which features discovered during research are:
  - Implemented (user chose to include)
  - Deferred (user chose to skip for later)
  - Discovered (found in docs but not yet decided)

Added in v3.6.7 for feature scope tracking.

Returns:
  - JSON with scope coverage update info
"""
import json
import sys
from datetime import datetime
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


def extract_feature_from_question(question, options):
    """Try to extract a feature name from the question."""
    # Look for common patterns
    patterns = [
        "implement",
        "include",
        "support",
        "enable",
        "add"
    ]

    question_lower = question.lower()
    for pattern in patterns:
        if pattern in question_lower:
            # Extract the words after the pattern
            idx = question_lower.find(pattern)
            after = question_lower[idx:].split("?")[0]
            # Clean up
            words = after.split()[1:4]  # Get 1-3 words after pattern
            if words:
                return " ".join(words).strip(",.?")

    return None


def is_feature_decision(question, answer, options):
    """Determine if this was a feature implementation decision."""
    question_lower = question.lower()

    # Keywords suggesting feature decision
    feature_keywords = [
        "implement", "include", "support", "enable", "add",
        "feature", "functionality", "capability"
    ]

    has_keyword = any(k in question_lower for k in feature_keywords)

    # Check if answer indicates yes/no/defer decision
    answer_lower = str(answer).lower() if answer else ""
    is_decision = any(word in answer_lower for word in [
        "yes", "no", "skip", "defer", "later", "include", "exclude",
        "implement", "confirm", "reject"
    ])

    return has_keyword and is_decision


def categorize_decision(answer):
    """Categorize the decision as implement/defer/skip."""
    answer_lower = str(answer).lower() if answer else ""

    if any(word in answer_lower for word in ["yes", "include", "implement", "confirm"]):
        return "implement"
    elif any(word in answer_lower for word in ["defer", "later", "phase 2", "future"]):
        return "defer"
    elif any(word in answer_lower for word in ["no", "skip", "exclude", "reject"]):
        return "skip"

    return "unknown"


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    tool_result = input_data.get("tool_result", {})

    if tool_name != "AskUserQuestion":
        print(json.dumps({"continue": True}))
        sys.exit(0)

    if not STATE_FILE.exists():
        print(json.dumps({"continue": True}))
        sys.exit(0)

    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    endpoint, endpoint_data = get_active_endpoint(state)
    if not endpoint or not endpoint_data:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Get question and answer
    question = tool_input.get("question", "")
    options = tool_input.get("options", [])

    # Get user's answer from result
    answer = None
    if isinstance(tool_result, dict):
        answer = tool_result.get("answer", tool_result.get("value", ""))
    elif isinstance(tool_result, str):
        answer = tool_result

    # Check if this is a feature decision
    if not is_feature_decision(question, answer, options):
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Extract feature name
    feature = extract_feature_from_question(question, options)
    if not feature:
        feature = f"feature_{datetime.now().strftime('%H%M%S')}"

    # Categorize decision
    category = categorize_decision(answer)

    # Ensure scope object exists
    if "endpoints" in state:
        if "scope" not in state["endpoints"][endpoint]:
            state["endpoints"][endpoint]["scope"] = {
                "discovered_features": [],
                "implemented_features": [],
                "deferred_features": [],
                "coverage_percent": 0
            }
        scope = state["endpoints"][endpoint]["scope"]
    else:
        if "scope" not in state:
            state["scope"] = {
                "discovered_features": [],
                "implemented_features": [],
                "deferred_features": [],
                "coverage_percent": 0
            }
        scope = state["scope"]

    # Add to discovered if not already there
    feature_entry = {
        "name": feature,
        "discovered_at": datetime.now().isoformat(),
        "question": question[:100],
        "decision": category
    }

    if feature not in [f.get("name") if isinstance(f, dict) else f for f in scope["discovered_features"]]:
        scope["discovered_features"].append(feature_entry)

    # Add to appropriate category
    if category == "implement":
        if feature not in scope["implemented_features"]:
            scope["implemented_features"].append(feature)
    elif category == "defer":
        defer_entry = {
            "name": feature,
            "reason": f"User chose to defer: {str(answer)[:50]}",
            "deferred_at": datetime.now().isoformat()
        }
        if feature not in [f.get("name") if isinstance(f, dict) else f for f in scope["deferred_features"]]:
            scope["deferred_features"].append(defer_entry)

    # Calculate coverage
    total = len(scope["discovered_features"])
    implemented = len(scope["implemented_features"])
    if total > 0:
        scope["coverage_percent"] = round((implemented / total) * 100, 1)

    # Save state
    STATE_FILE.write_text(json.dumps(state, indent=2))

    output = {
        "hookSpecificOutput": {
            "featureTracked": feature,
            "decision": category,
            "coveragePercent": scope["coverage_percent"]
        }
    }

    print(json.dumps(output))
    sys.exit(0)


if __name__ == "__main__":
    main()
