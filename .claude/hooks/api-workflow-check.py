#!/usr/bin/env python3
"""
Hook: Stop
Purpose: Check if all required phases are complete before allowing stop

This hook runs when Claude tries to stop/end the conversation.
It checks api-dev-state.json to ensure critical workflow phases completed.

Gap Fixes Applied:
- Gap 2: Shows files_created vs files_modified to verify all claimed changes
- Gap 3: Warns if there are verification_warnings that weren't addressed
- Gap 4: Requires explicit verification that implementation matches interview

v3.6.7 Enhancement:
- Phase 13 completion output with curl examples, test commands, parameter tables
- Scope coverage report (discovered vs implemented vs deferred)
- Research cache location
- Summary statistics

Returns:
  - {"decision": "approve"} - Allow stopping
  - {"decision": "block", "reason": "..."} - Prevent stopping with explanation
"""
import json
import sys
import subprocess
import re
from datetime import datetime
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
RESEARCH_DIR = Path(__file__).parent.parent / "research"

# Phases that MUST be complete before stopping
REQUIRED_PHASES = [
    ("research_initial", "Initial research (Context7/WebSearch)"),
    ("interview", "User interview"),
    ("tdd_red", "TDD Red phase (failing tests written)"),
    ("tdd_green", "TDD Green phase (tests passing)"),
    ("verify", "Verification phase (re-checked against docs)"),
    ("documentation", "Documentation updates (manifest/research cached)"),
]

# Phases that SHOULD be complete (warning but don't block)
RECOMMENDED_PHASES = [
    ("schema_creation", "Schema creation"),
    ("tdd_refactor", "TDD Refactor phase"),
    ("documentation", "Documentation updates"),
]

# Combine workflow specific phases
COMBINE_REQUIRED_PHASES = [
    ("selection", "API selection (2+ APIs required)"),
    ("scope", "Scope confirmation"),
    ("research_initial", "Initial research"),
    ("interview", "User interview"),
    ("research_deep", "Deep research"),
    ("schema_creation", "Combined schema creation"),
    ("environment_check", "Environment check"),
    ("tdd_red", "TDD Red phase"),
    ("tdd_green", "TDD Green phase"),
    ("verify", "Verification phase"),
    ("documentation", "Documentation updates"),
]

# UI workflow specific phases
UI_REQUIRED_PHASES = [
    ("disambiguation", "Component/Page type disambiguation"),
    ("scope", "Scope confirmation"),
    ("design_research", "Design research"),
    ("interview", "User interview"),
    ("tdd_red", "TDD Red phase"),
    ("tdd_green", "TDD Green phase"),
    ("verify", "Verification phase (4-step)"),
    ("documentation", "Documentation updates"),
]


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


def get_required_phases_for_workflow(workflow_type):
    """Get the required phases list for a given workflow type."""
    if workflow_type == "combine-api":
        return COMBINE_REQUIRED_PHASES
    elif workflow_type.startswith("ui-create"):
        return UI_REQUIRED_PHASES
    else:
        return REQUIRED_PHASES


def validate_combine_workflow(state):
    """Validate combine-specific requirements.

    Returns list of issues if validation fails, empty list if OK.
    """
    issues = []

    combine_config = state.get("combine_config", {})
    if not combine_config:
        issues.append("❌ Combine config not found in state")
        return issues

    # Check that at least 2 APIs are selected
    source_elements = combine_config.get("source_elements", [])
    if len(source_elements) < 2:
        issues.append(f"❌ Combine requires 2+ APIs, found {len(source_elements)}")
        issues.append("   Select more APIs in Phase 1 (SELECTION)")

    # Verify all source APIs exist in registry
    try:
        registry_path = STATE_FILE.parent / "registry.json"
        if registry_path.exists():
            registry = json.loads(registry_path.read_text())
            apis = registry.get("apis", {})

            for elem in source_elements:
                elem_name = elem.get("name", "") if isinstance(elem, dict) else str(elem)
                if elem_name and elem_name not in apis:
                    issues.append(f"⚠️ Source API '{elem_name}' not found in registry")
                    issues.append(f"   Run /api-create {elem_name} first")
    except Exception:
        pass

    # Check flow type is defined
    flow_type = combine_config.get("flow_type", "")
    if not flow_type:
        issues.append("⚠️ Flow type not defined (sequential/parallel/conditional)")

    return issues


def validate_ui_workflow(state):
    """Validate UI-specific requirements.

    Returns list of issues if validation fails, empty list if OK.
    """
    issues = []

    ui_config = state.get("ui_config", {})
    if not ui_config:
        # Try to get from active element
        active = state.get("active_element", "")
        if active:
            elements = state.get("elements", {})
            element = elements.get(active, {})
            ui_config = element.get("ui_config", {})

    if not ui_config:
        issues.append("⚠️ UI config not found in state")
        return issues

    # Check brand guide was applied
    if not ui_config.get("use_brand_guide"):
        issues.append("⚠️ Brand guide not applied - design may not match project standards")

    return issues


def get_active_endpoint(state):
    """Get active endpoint - supports both old and new state formats."""
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

    # Old format: single endpoint
    endpoint = state.get("endpoint")
    if endpoint:
        return endpoint, state

    # Try active_element without elements dict
    active = state.get("active_element")
    if active:
        return active, state

    return None, None


def get_git_modified_files() -> list[str]:
    """Get list of modified files from git.

    Gap 2 Fix: Verify which files actually changed.
    """
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD"],
            capture_output=True,
            text=True,
            cwd=STATE_FILE.parent.parent  # Project root
        )
        if result.returncode == 0:
            return [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
    except Exception:
        pass
    return []


def check_verification_warnings(state: dict) -> list[str]:
    """Check for unaddressed verification warnings.

    Gap 3 Fix: Don't accept "skipped" or warnings without explanation.
    """
    warnings = state.get("verification_warnings", [])
    if warnings:
        return [
            "⚠️ Unaddressed verification warnings:",
            *[f"  - {w}" for w in warnings[-5:]],  # Show last 5
            "",
            "Please review and address these warnings before completing."
        ]
    return []


def check_interview_implementation_match(state: dict, endpoint_data: dict = None) -> list[str]:
    """Verify implementation matches interview requirements.

    Gap 4 Fix: Define specific "done" criteria based on interview.
    """
    issues = []

    # Use endpoint_data if provided (multi-API), otherwise use state directly
    data = endpoint_data if endpoint_data else state
    interview = data.get("phases", {}).get("interview", {})
    questions = interview.get("questions", [])

    # Extract key requirements from interview
    all_text = " ".join(str(q) for q in questions)

    # Check files_created includes expected patterns
    files_created = data.get("files_created", []) or state.get("files_created", [])

    # Look for route files if interview mentioned endpoints
    if "endpoint" in all_text.lower() or "/api/" in all_text.lower():
        route_files = [f for f in files_created if "route.ts" in f]
        if not route_files:
            issues.append("⚠️ Interview mentioned endpoints but no route.ts files were created")

    # Look for test files
    test_files = [f for f in files_created if ".test." in f or "__tests__" in f]
    if not test_files:
        issues.append("⚠️ No test files tracked in files_created")

    return issues


def extract_schema_params(endpoint: str, endpoint_data: dict) -> list[dict]:
    """Extract parameters from schema file for the parameter table."""
    schema_file = endpoint_data.get("phases", {}).get("schema_creation", {}).get("schema_file")
    if not schema_file:
        return []

    # Try to read the schema file
    try:
        schema_path = STATE_FILE.parent.parent / schema_file
        if not schema_path.exists():
            return []

        content = schema_path.read_text()

        # Simple regex to extract Zod field definitions
        # Matches patterns like: fieldName: z.string(), fieldName: z.number().optional()
        params = []
        field_pattern = r'(\w+):\s*z\.(\w+)\(([^)]*)\)(\.[^,\n}]+)?'

        for match in re.finditer(field_pattern, content):
            name = match.group(1)
            zod_type = match.group(2)
            chain = match.group(4) or ""

            # Map Zod types to simple types
            type_map = {
                "string": "string",
                "number": "number",
                "boolean": "boolean",
                "array": "array",
                "object": "object",
                "enum": "enum",
                "literal": "literal",
                "union": "union",
            }

            param_type = type_map.get(zod_type, zod_type)
            required = ".optional()" not in chain
            description = ""

            # Try to extract description from .describe()
            desc_match = re.search(r'\.describe\(["\']([^"\']+)["\']', chain)
            if desc_match:
                description = desc_match.group(1)

            params.append({
                "name": name,
                "type": param_type,
                "required": required,
                "description": description
            })

        return params
    except Exception:
        return []


def generate_curl_examples(endpoint: str, endpoint_data: dict, params: list) -> list[str]:
    """Generate curl command examples for the endpoint."""
    lines = []

    # Determine HTTP method from route file
    method = "POST"  # Default
    files_created = endpoint_data.get("files_created", [])
    for f in files_created:
        if "route.ts" in f:
            try:
                route_path = STATE_FILE.parent.parent / f
                if route_path.exists():
                    route_content = route_path.read_text()
                    if "export async function GET" in route_content:
                        method = "GET"
                    elif "export async function DELETE" in route_content:
                        method = "DELETE"
                    elif "export async function PUT" in route_content:
                        method = "PUT"
                    elif "export async function PATCH" in route_content:
                        method = "PATCH"
            except Exception:
                pass
            break

    lines.append("## API Usage (curl)")
    lines.append("")
    lines.append("```bash")
    lines.append("# Basic request")

    # Build example request body from params
    if method in ["POST", "PUT", "PATCH"] and params:
        example_body = {}
        for p in params[:5]:  # First 5 params
            if p["type"] == "string":
                example_body[p["name"]] = f"example-{p['name']}"
            elif p["type"] == "number":
                example_body[p["name"]] = 42
            elif p["type"] == "boolean":
                example_body[p["name"]] = True
            elif p["type"] == "array":
                example_body[p["name"]] = []

        body_json = json.dumps(example_body, indent=2)
        lines.append(f"curl -X {method} http://localhost:3001/api/v2/{endpoint} \\")
        lines.append("  -H \"Content-Type: application/json\" \\")
        lines.append(f"  -d '{body_json}'")
    else:
        lines.append(f"curl http://localhost:3001/api/v2/{endpoint}")

    lines.append("")

    # With authentication example
    lines.append("# With API key (if required)")
    if method in ["POST", "PUT", "PATCH"]:
        lines.append(f"curl -X {method} http://localhost:3001/api/v2/{endpoint} \\")
        lines.append("  -H \"Content-Type: application/json\" \\")
        lines.append("  -H \"X-API-Key: your-api-key\" \\")
        lines.append("  -d '{\"param\": \"value\"}'")
    else:
        lines.append(f"curl http://localhost:3001/api/v2/{endpoint} \\")
        lines.append("  -H \"X-API-Key: your-api-key\"")

    lines.append("```")

    return lines


def generate_test_commands(endpoint: str, endpoint_data: dict) -> list[str]:
    """Generate test commands for running endpoint tests."""
    lines = []

    lines.append("## Test Commands")
    lines.append("")
    lines.append("```bash")
    lines.append("# Run endpoint tests")
    lines.append(f"pnpm test -- {endpoint}")
    lines.append("")
    lines.append("# Run with coverage")
    lines.append(f"pnpm test:coverage -- {endpoint}")
    lines.append("")
    lines.append("# Run specific test file")

    # Find test file
    files_created = endpoint_data.get("files_created", [])
    test_file = None
    for f in files_created:
        if ".test." in f or "__tests__" in f:
            test_file = f
            break

    if test_file:
        lines.append(f"pnpm test:run {test_file}")
    else:
        lines.append(f"pnpm test:run src/app/api/v2/{endpoint}/__tests__/{endpoint}.api.test.ts")

    lines.append("")
    lines.append("# Full test suite")
    lines.append("pnpm test:run")
    lines.append("```")

    return lines


def generate_parameter_table(params: list) -> list[str]:
    """Generate markdown parameter table."""
    if not params:
        return []

    lines = []
    lines.append("## Parameters Discovered")
    lines.append("")
    lines.append("| Name | Type | Required | Description |")
    lines.append("|------|------|----------|-------------|")

    for p in params:
        req = "✓" if p.get("required") else "-"
        desc = p.get("description", "")[:50]  # Truncate long descriptions
        lines.append(f"| {p['name']} | {p['type']} | {req} | {desc} |")

    return lines


def generate_scope_coverage(endpoint_data: dict) -> list[str]:
    """Generate scope coverage report."""
    scope = endpoint_data.get("scope", {})
    if not scope:
        return []

    discovered = scope.get("discovered_features", [])
    implemented = scope.get("implemented_features", [])
    deferred = scope.get("deferred_features", [])
    coverage = scope.get("coverage_percent", 0)

    if not discovered and not implemented and not deferred:
        return []

    lines = []
    lines.append("## Implementation Scope")
    lines.append("")

    if implemented:
        lines.append(f"### Implemented ({len(implemented)}/{len(discovered)} features)")
        lines.append("")
        lines.append("| Feature | Status |")
        lines.append("|---------|--------|")
        for feat in implemented:
            if isinstance(feat, dict):
                lines.append(f"| {feat.get('name', feat)} | ✅ |")
            else:
                lines.append(f"| {feat} | ✅ |")
        lines.append("")

    if deferred:
        lines.append(f"### Deferred ({len(deferred)} features)")
        lines.append("")
        lines.append("| Feature | Reason |")
        lines.append("|---------|--------|")
        for feat in deferred:
            if isinstance(feat, dict):
                reason = feat.get("reason", "User choice")
                lines.append(f"| {feat.get('name', feat)} | {reason} |")
            else:
                lines.append(f"| {feat} | User choice |")
        lines.append("")

    if discovered:
        total = len(discovered)
        impl_count = len(implemented)
        lines.append(f"**Coverage:** {impl_count}/{total} features ({coverage}%)")

    return lines


def generate_completion_output(endpoint: str, endpoint_data: dict, state: dict) -> str:
    """Generate comprehensive Phase 13 completion output."""
    lines = []

    # Header
    lines.append("")
    lines.append("=" * 60)
    lines.append(f"# ✅ API Implementation Complete: {endpoint}")
    lines.append("=" * 60)
    lines.append("")

    # Summary
    phases = endpoint_data.get("phases", {})
    phases_complete = sum(1 for p in phases.values() if isinstance(p, dict) and p.get("status") == "complete")
    total_phases = len([p for p in phases.values() if isinstance(p, dict)])

    started_at = endpoint_data.get("started_at", "Unknown")
    files_created = endpoint_data.get("files_created", []) or state.get("files_created", [])

    # Calculate test count from state
    tdd_red = phases.get("tdd_red", {})
    test_count = tdd_red.get("test_count", 0)

    lines.append("## Summary")
    lines.append("")
    lines.append(f"- **Status:** PRODUCTION READY")
    lines.append(f"- **Phases:** {phases_complete}/{total_phases} Complete")
    lines.append(f"- **Tests:** {test_count} test scenarios")
    lines.append(f"- **Started:** {started_at}")
    lines.append(f"- **Completed:** {datetime.now().isoformat()}")
    lines.append("")

    # Files Created
    if files_created:
        lines.append("## Files Created")
        lines.append("")
        for f in files_created:
            lines.append(f"- {f}")
        lines.append("")

    # Extract schema params
    params = extract_schema_params(endpoint, endpoint_data)

    # Test Commands
    lines.extend(generate_test_commands(endpoint, endpoint_data))
    lines.append("")

    # Curl Examples
    lines.extend(generate_curl_examples(endpoint, endpoint_data, params))
    lines.append("")

    # Parameter Table
    param_lines = generate_parameter_table(params)
    if param_lines:
        lines.extend(param_lines)
        lines.append("")

    # Scope Coverage
    scope_lines = generate_scope_coverage(endpoint_data)
    if scope_lines:
        lines.extend(scope_lines)
        lines.append("")

    # Research Cache Location
    research_cache = RESEARCH_DIR / endpoint
    if research_cache.exists():
        lines.append("## Research Cache")
        lines.append("")
        lines.append(f"- `.claude/research/{endpoint}/CURRENT.md`")
        lines.append(f"- `.claude/research/{endpoint}/sources.json`")
        lines.append(f"- `.claude/research/{endpoint}/interview.json`")
        lines.append("")

    # Next Steps
    lines.append("## Next Steps")
    lines.append("")
    lines.append(f"1. Review tests: `pnpm test -- {endpoint}`")
    lines.append("2. Test manually with curl examples above")
    lines.append("3. Deploy to staging")
    lines.append("4. Update OpenAPI spec if needed")
    lines.append("")

    lines.append("=" * 60)

    return "\n".join(lines)


def main():
    # If no state file, we're not in an API workflow - allow stop
    if not STATE_FILE.exists():
        print(json.dumps({"decision": "approve"}))
        sys.exit(0)

    # Load state
    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        # Corrupted state, allow stop
        print(json.dumps({"decision": "approve"}))
        sys.exit(0)

    # Detect workflow type
    workflow_type = get_workflow_type(state)

    # Get active endpoint (multi-API support)
    endpoint, endpoint_data = get_active_endpoint(state)

    # If no active endpoint, check if using old format
    if not endpoint_data:
        phases = state.get("phases", {})
    else:
        phases = endpoint_data.get("phases", {})

    # Check if workflow was even started
    research = phases.get("research_initial", {})
    design_research = phases.get("design_research", {})  # For UI workflows
    selection = phases.get("selection", {})  # For combine workflows

    if (research.get("status") == "not_started" and
        design_research.get("status") == "not_started" and
        selection.get("status") == "not_started"):
        # Workflow not started, allow stop
        print(json.dumps({"decision": "approve"}))
        sys.exit(0)

    # Collect all issues
    all_issues = []

    # Workflow-specific validation
    if workflow_type == "combine-api":
        combine_issues = validate_combine_workflow(state)
        if combine_issues:
            all_issues.append("❌ COMBINE WORKFLOW VALIDATION FAILED:")
            all_issues.extend(combine_issues)
            all_issues.append("")

    elif workflow_type.startswith("ui-create"):
        ui_issues = validate_ui_workflow(state)
        if ui_issues:
            all_issues.extend(ui_issues)
            all_issues.append("")

    # Get the correct required phases for this workflow
    required_phases = get_required_phases_for_workflow(workflow_type)

    # Check required phases
    incomplete_required = []
    for phase_key, phase_name in required_phases:
        phase = phases.get(phase_key, {})
        status = phase.get("status", "not_started")
        if status != "complete":
            incomplete_required.append(f"  - {phase_name} ({status})")

    if incomplete_required:
        all_issues.append("❌ REQUIRED phases incomplete:")
        all_issues.extend(incomplete_required)

    # Check recommended phases
    incomplete_recommended = []
    for phase_key, phase_name in RECOMMENDED_PHASES:
        phase = phases.get(phase_key, {})
        status = phase.get("status", "not_started")
        if status != "complete":
            incomplete_recommended.append(f"  - {phase_name} ({status})")

    # Gap 2: Check git diff vs tracked files
    git_files = get_git_modified_files()
    data_for_files = endpoint_data if endpoint_data else state
    tracked_files = (data_for_files.get("files_created", []) or []) + (data_for_files.get("files_modified", []) or [])

    if git_files and tracked_files:
        # Find files in git but not tracked
        untracked_changes = []
        for gf in git_files:
            if not any(gf.endswith(tf) or tf in gf for tf in tracked_files):
                if gf.endswith(".ts") and ("/api/" in gf or "/lib/" in gf):
                    untracked_changes.append(gf)

        if untracked_changes:
            all_issues.append("\n⚠️ Gap 2: Files changed but not tracked:")
            all_issues.extend([f"  - {f}" for f in untracked_changes[:5]])

    # Gap 3: Check for unaddressed warnings
    warning_issues = check_verification_warnings(endpoint_data if endpoint_data else state)
    if warning_issues:
        all_issues.append("\n" + "\n".join(warning_issues))

    # Gap 4: Check interview-implementation match
    match_issues = check_interview_implementation_match(state, endpoint_data)
    if match_issues:
        all_issues.append("\n⚠️ Gap 4: Implementation verification:")
        all_issues.extend([f"  {i}" for i in match_issues])

    # Block if required phases incomplete
    if incomplete_required:
        all_issues.append("\n\nTo continue:")
        all_issues.append("  1. Complete required phases above")
        all_issues.append("  2. Use /api-status to see detailed progress")
        all_issues.append("  3. Run `git diff --name-only` to verify changes")

        print(json.dumps({
            "decision": "block",
            "reason": "\n".join(all_issues)
        }))
        sys.exit(0)

    # ================================================================
    # Phase 13: Generate comprehensive completion output (v3.6.7)
    # ================================================================

    # Build completion message with full output
    message_parts = []

    # Generate comprehensive output if we have endpoint data
    if endpoint and endpoint_data:
        completion_output = generate_completion_output(endpoint, endpoint_data, state)
        message_parts.append(completion_output)
    else:
        # Fallback for old format
        message_parts.append("✅ API workflow completing")

        # Show summary of tracked files
        files_created = state.get("files_created", [])
        if files_created:
            message_parts.append(f"\n📁 Files created: {len(files_created)}")
            for f in files_created[:5]:
                message_parts.append(f"  - {f}")
            if len(files_created) > 5:
                message_parts.append(f"  ... and {len(files_created) - 5} more")

    # Add warnings if any optional phases were skipped
    if incomplete_recommended:
        message_parts.append("\n⚠️ Optional phases skipped:")
        message_parts.extend(incomplete_recommended)

    # Show any remaining warnings
    if warning_issues or match_issues:
        message_parts.append("\n⚠️ Review suggested:")
        if warning_issues:
            message_parts.extend(warning_issues[:3])
        if match_issues:
            message_parts.extend(match_issues[:3])

    print(json.dumps({
        "decision": "approve",
        "message": "\n".join(message_parts)
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
