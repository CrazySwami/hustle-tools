#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit (and Stop)
Purpose: Block completion until documentation confirmed WITH USER REVIEW

Phase 12 (Documentation) requires:
  1. Update api-tests-manifest.json
  2. Cache research to .claude/research/
  3. Update OpenAPI spec if applicable
  4. SHOW documentation checklist to user
  5. USE AskUserQuestion: "Documentation complete? [Y/n]"
  6. Only allow completion when user confirms

Returns:
  - {"permissionDecision": "allow"} - Let the tool run
  - {"permissionDecision": "deny", "reason": "..."} - Block with explanation

Updated in v3.6.7:
  - Support multi-API state structure
  - Don't block on missing cache files (cache-research.py creates them)
  - Check actual file existence, not just state flags
"""
import json
import sys
from pathlib import Path

STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
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


def check_research_cache_exists(endpoint):
    """Check if research cache files actually exist."""
    cache_dir = RESEARCH_DIR / endpoint
    if not cache_dir.exists():
        return False, []

    expected_files = ["sources.json", "interview.json", "schema.json"]
    existing = []
    for f in expected_files:
        if (cache_dir / f).exists():
            existing.append(f)

    return len(existing) >= 2, existing  # At least 2 of 3 files should exist


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # Only enforce for documentation files or when trying to mark workflow complete
    is_manifest = "api-tests-manifest.json" in file_path
    is_openapi = "openapi" in file_path.lower() and file_path.endswith((".json", ".yaml", ".yml"))
    is_readme = file_path.endswith("README.md") and "/api/" in file_path

    # Also check for state file updates (marking complete)
    is_state_update = "api-dev-state.json" in file_path

    if not is_manifest and not is_openapi and not is_readme and not is_state_update:
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

    # Get active endpoint (supports both old and new formats)
    endpoint, endpoint_data = get_active_endpoint(state)
    if not endpoint or not endpoint_data:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    phases = endpoint_data.get("phases", {})
    tdd_refactor = phases.get("tdd_refactor", {})
    documentation = phases.get("documentation", {})

    # Only enforce after refactor is complete
    if tdd_refactor.get("status") != "complete":
        # Allow documentation updates during development
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    status = documentation.get("status", "not_started")

    phase_exit_confirmed = documentation.get("phase_exit_confirmed", False)

    if status != "complete" or not phase_exit_confirmed:
        user_question_asked = documentation.get("user_question_asked", False)
        user_confirmed = documentation.get("user_confirmed", False)
        checklist_shown = documentation.get("checklist_shown", False)
        manifest_updated = documentation.get("manifest_updated", False)
        openapi_updated = documentation.get("openapi_updated", False)

        # v3.6.7: Check actual file existence for research cache
        # (cache-research.py PostToolUse hook creates these files automatically)
        cache_exists, cache_files = check_research_cache_exists(endpoint)
        research_cached = cache_exists or documentation.get("research_cached", False)

        missing = []
        if not manifest_updated:
            missing.append("api-tests-manifest.json not updated")
        if not research_cached:
            # Don't block - cache-research.py will create files when docs are written
            missing.append(f"Research cache pending (will be created automatically)")
        if not checklist_shown:
            missing.append("Documentation checklist not shown to user")
        if not user_question_asked:
            missing.append("User confirmation question (AskUserQuestion not used)")
        if not user_confirmed:
            missing.append("User hasn't confirmed documentation complete")
        if not phase_exit_confirmed:
            missing.append("Phase exit confirmation (user must explicitly approve to complete)")

        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: Documentation (Phase 12) not complete.

Status: {status}
Manifest updated: {manifest_updated}
Research cached: {research_cached}
OpenAPI updated: {openapi_updated}
Checklist shown: {checklist_shown}
User question asked: {user_question_asked}
User confirmed: {user_confirmed}
Phase exit confirmed: {phase_exit_confirmed}

MISSING:
{chr(10).join(f"  • {m}" for m in missing)}

═══════════════════════════════════════════════════════════
⚠️  GET USER CONFIRMATION FOR DOCUMENTATION
═══════════════════════════════════════════════════════════

REQUIRED STEPS:

1. Update api-tests-manifest.json with:
   • Endpoint path, method, description
   • Request/response schemas
   • Test coverage info
   • Code examples
   • Testing notes

2. Cache research to .claude/research/{endpoint}/:
   • sources.json - URLs and summaries
   • interview.json - User decisions
   • schema.json - Final Zod schemas

3. Update OpenAPI spec (if applicable):
   • Add endpoint definition
   • Document parameters
   • Document responses

4. SHOW documentation checklist to user:
   ┌───────────────────────────────────────────────────────┐
   │ DOCUMENTATION CHECKLIST                               │
   │                                                       │
   │ ✓ api-tests-manifest.json                            │
   │   • Added {endpoint} entry                           │
   │   • 8 test scenarios documented                       │
   │   • Code examples included                            │
   │                                                       │
   │ ✓ Research Cache                                      │
   │   • .claude/research/{endpoint}/sources.json         │
   │   • .claude/research/{endpoint}/interview.json       │
   │                                                       │
   │ {'✓' if openapi_updated else '⏭'} OpenAPI Spec                                       │
   │   • {'Updated' if openapi_updated else 'Skipped (internal API)'}                                       │
   │                                                       │
   │ All documentation complete? [Y]                       │
   │ Need to add something? [n] ____                       │
   └───────────────────────────────────────────────────────┘

5. USE AskUserQuestion:
   question: "Documentation checklist complete?"
   options: [
     {{"value": "confirm", "label": "Yes, all documentation is done"}},
     {{"value": "add", "label": "No, I need to add [what]"}},
     {{"value": "skip", "label": "Skip docs for now (not recommended)"}}
   ]

6. If user says "add":
   • Ask what documentation is missing
   • Update the relevant files
   • LOOP BACK and show updated checklist

7. If user says "confirm":
   • Set documentation.user_confirmed = true
   • Set documentation.user_question_asked = true
   • Set documentation.checklist_shown = true
   • Set documentation.manifest_updated = true
   • Set documentation.research_cached = true
   • Set documentation.status = "complete"
   • Mark entire workflow as complete!

WHY: Documentation ensures next developer (or future Claude) has context."""
        }))
        sys.exit(0)

    # Documentation complete - check actual file existence for status
    cache_exists, cache_files = check_research_cache_exists(endpoint)
    manifest_updated = documentation.get("manifest_updated", False)
    openapi_updated = documentation.get("openapi_updated", False)

    print(json.dumps({
        "permissionDecision": "allow",
        "message": f"""✅ Documentation complete for {endpoint}.
Manifest updated: {manifest_updated}
Research cached: {cache_exists} ({', '.join(cache_files) if cache_files else 'no files'})
OpenAPI updated: {openapi_updated}
User confirmed documentation is complete."""
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
