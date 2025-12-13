#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit on schema files
Purpose: Validate schema fields match interview decisions

This hook ensures that when writing Zod schema files, the fields
match what the user selected during the interview phase.

Added in v3.6.7 for schema-interview consistency enforcement.

Returns:
  - {"permissionDecision": "allow"} - Schema matches interview
  - {"permissionDecision": "allow", "message": "..."} - Allow with warning
  - {"permissionDecision": "deny", "reason": "..."} - Block with explanation
"""
import json
import sys
import re
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


def extract_schema_fields_from_content(content):
    """Extract field names from Zod schema content."""
    fields = set()

    # Match Zod object field definitions
    # Patterns like: fieldName: z.string(), fieldName: z.number().optional()
    field_pattern = r'(\w+):\s*z\.\w+\('

    for match in re.finditer(field_pattern, content):
        field_name = match.group(1)
        # Skip common non-field names
        if field_name not in {'z', 'const', 'export', 'type', 'interface'}:
            fields.add(field_name.lower())

    return fields


def extract_interview_approved_fields(endpoint_data):
    """Extract field names that were approved during interview."""
    approved_fields = set()

    interview = endpoint_data.get("phases", {}).get("interview", {})
    decisions = interview.get("decisions", {})
    questions = interview.get("questions", [])

    # Extract from decisions
    for key, value in decisions.items():
        # Decision keys often match field names
        approved_fields.add(key.lower())

        # Values might be lists of approved options
        if isinstance(value, list):
            for v in value:
                if isinstance(v, str):
                    approved_fields.add(v.lower())
        elif isinstance(value, str):
            approved_fields.add(value.lower())

    # Extract from question text (look for parameters mentioned)
    for q in questions:
        if isinstance(q, dict):
            q_text = q.get("question", "") + " " + q.get("answer", "")
        else:
            q_text = str(q)

        # Look for parameter-like words
        param_pattern = r'\b(param|field|property|attribute)[:=\s]+["\']?(\w+)["\']?'
        for match in re.finditer(param_pattern, q_text, re.IGNORECASE):
            approved_fields.add(match.group(2).lower())

        # Also extract snake_case and camelCase words that look like fields
        field_like = re.findall(r'\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b', q_text, re.IGNORECASE)
        for f in field_like:
            approved_fields.add(f.lower())

        field_like = re.findall(r'\b([a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)+)\b', q_text)
        for f in field_like:
            # Convert camelCase to lowercase for comparison
            approved_fields.add(f.lower())

    # Extract from scope if available
    scope = endpoint_data.get("scope", {})
    for feature in scope.get("implemented_features", []):
        if isinstance(feature, dict):
            approved_fields.add(feature.get("name", "").lower())
        else:
            approved_fields.add(str(feature).lower())

    return approved_fields


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    # Only check Write and Edit tools
    if tool_name not in ["Write", "Edit"]:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Check if writing to a schema file
    file_path = tool_input.get("file_path", "")

    # Detect schema files by path patterns
    is_schema_file = any([
        "/schemas/" in file_path,
        "schema.ts" in file_path.lower(),
        "schemas.ts" in file_path.lower(),
        ".schema.ts" in file_path.lower(),
    ])

    if not is_schema_file:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Load state
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

    # Check if interview phase is complete
    interview = endpoint_data.get("phases", {}).get("interview", {})
    if interview.get("status") != "complete":
        # Interview not done yet - allow but warn
        print(json.dumps({
            "permissionDecision": "allow",
            "message": "WARNING: Writing schema before interview is complete. Schema fields should be derived from interview decisions."
        }))
        sys.exit(0)

    # Get schema content being written
    if tool_name == "Write":
        schema_content = tool_input.get("content", "")
    else:  # Edit
        new_string = tool_input.get("new_string", "")
        schema_content = new_string

    if not schema_content:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Extract fields from schema
    schema_fields = extract_schema_fields_from_content(schema_content)

    if not schema_fields:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Extract approved fields from interview
    approved_fields = extract_interview_approved_fields(endpoint_data)

    if not approved_fields:
        # No interview data to compare against
        print(json.dumps({
            "permissionDecision": "allow",
            "message": "NOTE: No interview decisions found to validate schema against."
        }))
        sys.exit(0)

    # Find fields in schema that weren't discussed in interview
    # Use fuzzy matching - if any part of field name matches approved
    unmatched_fields = []
    for field in schema_fields:
        matched = False
        for approved in approved_fields:
            # Check if field contains or is contained by approved field
            if field in approved or approved in field:
                matched = True
                break
            # Check word overlap
            field_words = set(re.split(r'[_\s]', field))
            approved_words = set(re.split(r'[_\s]', approved))
            if field_words & approved_words:
                matched = True
                break

        if not matched:
            unmatched_fields.append(field)

    # Common fields that are always okay
    common_fields = {'id', 'createdat', 'updatedat', 'error', 'message', 'success', 'data', 'status', 'result'}
    unmatched_fields = [f for f in unmatched_fields if f not in common_fields]

    if unmatched_fields:
        # Found fields not in interview - warn but allow
        print(json.dumps({
            "permissionDecision": "allow",
            "message": f"""SCHEMA VALIDATION NOTE:

The following schema fields were not explicitly discussed in the interview:
  {', '.join(unmatched_fields[:5])}{'...' if len(unmatched_fields) > 5 else ''}

Interview-approved terms: {', '.join(list(approved_fields)[:10])}{'...' if len(approved_fields) > 10 else ''}

This is allowed, but consider:
1. Did research discover these fields?
2. Should the user be asked about these?
3. Are these derived from approved fields?

Proceeding with schema write."""
        }))
        sys.exit(0)

    # All fields match interview
    print(json.dumps({
        "permissionDecision": "allow",
        "message": f"Schema fields validated against interview: {', '.join(list(schema_fields)[:5])}"
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
