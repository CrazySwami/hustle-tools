#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Block writing if environment not verified WITH USER READINESS CONFIRMATION

Phase 7 requires:
  1. Check required API keys based on endpoint/interview
  2. Report found/missing keys to user
  3. USE AskUserQuestion: "Ready for testing? [Y/n]"
  4. Only proceed to TDD when user confirms readiness

Returns:
  - {"permissionDecision": "allow"} - Let the tool run
  - {"permissionDecision": "deny", "reason": "..."} - Block with explanation
"""
import json
import os
import sys
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"

# Common API key patterns to check
COMMON_KEY_PATTERNS = {
    "openai": ["OPENAI_API_KEY", "NEXT_PUBLIC_OPENAI_API_KEY"],
    "anthropic": ["ANTHROPIC_API_KEY", "NEXT_PUBLIC_ANTHROPIC_API_KEY"],
    "google": ["GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
    "brandfetch": ["BRANDFETCH_API_KEY"],
    "firecrawl": ["FIRECRAWL_API_KEY"],
    "brave": ["BRAVE_SEARCH_API_KEY"],
    "perplexity": ["PERPLEXITY_API_KEY"],
    "exa": ["EXA_API_KEY"],
    "cartesia": ["CARTESIA_API_KEY"],
    "elevenlabs": ["ELEVENLABS_API_KEY"],
    "unsplash": ["UNSPLASH_ACCESS_KEY"],
    "pexels": ["PEXELS_API_KEY"],
    "supabase": ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
}


def check_env_keys(required_keys: list) -> tuple[list, list]:
    """Check which keys exist and which are missing."""
    found = []
    missing = []

    for key in required_keys:
        if os.environ.get(key):
            found.append(key)
        else:
            missing.append(key)

    return found, missing


def infer_required_keys(endpoint: str, external_services: list) -> list:
    """Infer required API keys from endpoint name and external services."""
    required = []

    # Check endpoint name against common patterns
    endpoint_lower = endpoint.lower()
    for service, keys in COMMON_KEY_PATTERNS.items():
        if service in endpoint_lower:
            required.extend(keys)

    # Check external services list
    for service in external_services:
        service_lower = service.lower()
        for pattern, keys in COMMON_KEY_PATTERNS.items():
            if pattern in service_lower:
                required.extend(keys)

    return list(set(required))  # Deduplicate


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # Only enforce for API route files (not tests - tests should fail if keys missing)
    is_api_file = "/api/" in file_path and file_path.endswith(".ts")
    is_route_file = file_path.endswith("route.ts")

    if not is_api_file or not is_route_file:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Skip test files
    if ".test." in file_path or "/__tests__/" in file_path or ".spec." in file_path:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Check if state file exists
    if not STATE_FILE.exists():
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Load state
    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    endpoint = state.get("endpoint")
    if not endpoint:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    phases = state.get("phases", {})
    schema_creation = phases.get("schema_creation", {})
    environment_check = phases.get("environment_check", {})

    # Only enforce after schema creation
    if schema_creation.get("status") != "complete":
        # Let earlier hooks handle this
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    env_status = environment_check.get("status", "not_started")
    keys_required = environment_check.get("keys_required", [])
    keys_found = environment_check.get("keys_found", [])
    keys_missing = environment_check.get("keys_missing", [])
    user_question_asked = environment_check.get("user_question_asked", False)
    user_ready = environment_check.get("user_ready", False)
    env_shown = environment_check.get("env_shown", False)
    phase_exit_confirmed = environment_check.get("phase_exit_confirmed", False)

    # Check if environment check is complete
    if env_status != "complete" or not phase_exit_confirmed:
        # Infer required keys if not already set
        if not keys_required:
            interview = phases.get("interview", {})
            decisions = interview.get("decisions", {})
            external_services = decisions.get("external_services", {}).get("value", [])
            if isinstance(external_services, str):
                external_services = [external_services]
            keys_required = infer_required_keys(endpoint, external_services)

        # Check current environment
        if keys_required:
            found, missing = check_env_keys(keys_required)
        else:
            found, missing = [], []

        # Check what's missing for user checkpoint
        missing_steps = []
        if not env_shown:
            missing_steps.append("Environment status not shown to user")
        if not user_question_asked:
            missing_steps.append("User readiness question (AskUserQuestion not used)")
        if not user_ready:
            missing_steps.append("User hasn't confirmed readiness for TDD")
        if not phase_exit_confirmed:
            missing_steps.append("Phase exit confirmation (user must explicitly approve to proceed)")

        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: Environment check (Phase 7) not complete.

Current status: {env_status}
Required keys: {len(keys_required)}
Found: {len(found)}
Missing: {len(missing)}
User shown env: {env_shown}
User question asked: {user_question_asked}
User ready: {user_ready}
Phase exit confirmed: {phase_exit_confirmed}

MISSING:
{chr(10).join(f"  • {m}" for m in missing_steps)}

═══════════════════════════════════════════════════════════
⚠️  GET USER READINESS CONFIRMATION
═══════════════════════════════════════════════════════════

REQUIRED STEPS:

1. Check API keys and SHOW status to user:
   ┌───────────────────────────────────────────────────────┐
   │ ENVIRONMENT CHECK                                     │
   │                                                       │
   │ Required for {endpoint}:                              │
   │                                                       │
   │ API Keys:                                             │
{chr(10).join(f"   │   {'✓' if k in found else '❌'} {k:<40} │" for k in keys_required) if keys_required else "   │   No API keys required                          │"}
   │                                                       │
   │ Testing Setup:                                        │
   │   • Schema file ready                                 │
   │   • Test patterns defined                             │
   │   • Mock data prepared (if needed)                    │
   │                                                       │
   │ Ready to begin TDD? [Y]                               │
   │ Need to fix something? [n]                            │
   └───────────────────────────────────────────────────────┘

2. USE AskUserQuestion:
   question: "Environment looks ready. Start TDD?"
   options: [
     {{"value": "ready", "label": "Yes, ready to write tests"}},
     {{"value": "fix_keys", "label": "No, need to set up API keys first"}},
     {{"value": "fix_other", "label": "No, need to fix something else"}}
   ]

3. If user says "fix_keys" or "fix_other":
   • Help them resolve the issue
   • Re-check environment
   • LOOP BACK and show updated status

4. If user says "ready":
   • Set environment_check.user_ready = true
   • Set environment_check.user_question_asked = true
   • Set environment_check.env_shown = true
   • Set environment_check.keys_found = [list]
   • Set environment_check.keys_missing = [list]
   • Set environment_check.status = "complete"

{'API KEY ISSUES:' if missing else ''}
{chr(10).join(f"  ❌ {k}" for k in missing) if missing else ''}

WHY: Verify environment before writing tests that depend on it."""
        }))
        sys.exit(0)

    # Environment check complete
    if keys_missing and not user_ready:
        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ Missing keys noted but user hasn't confirmed readiness.
Use AskUserQuestion to confirm user is ready to proceed with missing keys:
{chr(10).join(f"  ⚠️ {k}" for k in keys_missing[:3])}"""
        }))
        sys.exit(0)

    print(json.dumps({
        "permissionDecision": "allow",
        "message": f"""✅ Environment check complete.
User confirmed ready for TDD.
Keys found: {len(keys_found)}
Keys missing (acknowledged): {len(keys_missing)}"""
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
