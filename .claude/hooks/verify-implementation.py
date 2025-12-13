#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit (runs AFTER enforce-research and enforce-interview)
Purpose: Verify implementation matches interview requirements

This hook addresses these gaps:
1. AI uses exact user terminology when researching (not paraphrasing)
2. All changed files are tracked and verified
3. Test files use same patterns as production code

Returns:
  - {"permissionDecision": "allow"} - Let the tool run
  - {"permissionDecision": "deny", "reason": "..."} - Block with explanation
"""
import json
import sys
import re
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"


def extract_key_terms(text: str) -> list[str]:
    """Extract likely important terms from interview answers.

    These are terms that should appear in research and implementation:
    - Proper nouns (capitalized multi-word phrases)
    - Technical terms (SDK names, API names, etc.)
    - Specific patterns (e.g., "via X", "using X", "with X")
    """
    terms = []

    # Look for "via X", "using X", "with X" patterns
    via_patterns = re.findall(r'(?:via|using|with|through)\s+([A-Z][A-Za-z0-9\s]+?)(?:[,.\n]|$)', text)
    terms.extend(via_patterns)

    # Look for capitalized phrases (likely proper nouns/product names)
    # e.g., "Vercel AI Gateway", "OpenAI API"
    proper_nouns = re.findall(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+', text)
    terms.extend(proper_nouns)

    # Clean up and dedupe
    terms = [t.strip() for t in terms if len(t.strip()) > 3]
    return list(set(terms))


def check_research_used_exact_terms(state: dict) -> list[str]:
    """Verify research sources used the exact terms from interview.

    Gap 1 Fix: When user provides a term, use THAT EXACT TERM to search.
    """
    issues = []

    interview = state.get("phases", {}).get("interview", {})
    research = state.get("phases", {}).get("research_initial", {})
    deep_research = state.get("phases", {}).get("research_deep", {})

    questions = interview.get("questions", [])
    if isinstance(questions, list) and len(questions) > 0:
        # Extract key terms from all interview answers
        all_text = " ".join(str(q) for q in questions)
        key_terms = extract_key_terms(all_text)

        # Check if these terms appear in research sources
        research_sources = research.get("sources", []) + deep_research.get("sources", [])
        research_text = " ".join(str(s) for s in research_sources).lower()

        missing_terms = []
        for term in key_terms:
            # Check if term or close variant appears in research
            term_lower = term.lower()
            if term_lower not in research_text:
                # Check for partial matches (e.g., "AI Gateway" in "Vercel AI Gateway")
                words = term_lower.split()
                if not any(all(w in research_text for w in words) for _ in [1]):
                    missing_terms.append(term)

        if missing_terms:
            issues.append(
                f"⚠️ Gap 1 Warning: User-specified terms not found in research:\n"
                f"   Terms from interview: {missing_terms}\n"
                f"   These EXACT terms should have been searched."
            )

    return issues


def check_files_tracked(state: dict, file_path: str) -> list[str]:
    """Verify we're tracking all files being modified.

    Gap 2 Fix: Track files as they're modified, not after claiming completion.
    """
    issues = []

    files_created = state.get("files_created", [])
    files_modified = state.get("files_modified", [])
    all_tracked = files_created + files_modified

    # Normalize paths for comparison
    normalized_path = file_path.replace("\\", "/")

    # Check if this file is a test file
    is_test = ".test." in file_path or "/__tests__/" in file_path or ".spec." in file_path

    # For non-test files in api/ or lib/, they should be tracked
    is_trackable = ("/api/" in file_path or "/lib/" in file_path) and file_path.endswith(".ts")

    if is_trackable and not is_test:
        # Check if any tracked file matches this one
        found = False
        for tracked in all_tracked:
            if normalized_path.endswith(tracked) or tracked in normalized_path:
                found = True
                break

        # Don't block, but log that this file should be tracked
        if not found:
            state.setdefault("files_modified", []).append(normalized_path.split("/src/")[-1] if "/src/" in normalized_path else normalized_path)
            STATE_FILE.write_text(json.dumps(state, indent=2))

    return issues


def check_test_production_alignment(state: dict, file_path: str, content: str = "") -> list[str]:
    """Verify test files use same patterns as production code.

    Gap 5 Fix: Test files must use the same patterns as production code.
    """
    issues = []

    is_test = ".test." in file_path or "/__tests__/" in file_path or ".spec." in file_path

    if not is_test:
        return issues

    # Check interview for key configuration patterns
    interview = state.get("phases", {}).get("interview", {})
    questions = interview.get("questions", [])
    all_text = " ".join(str(q) for q in questions)

    # Look for environment variable patterns mentioned in interview
    env_patterns = re.findall(r'[A-Z_]+_(?:KEY|API_KEY|TOKEN|SECRET)', all_text)

    if env_patterns and content:
        # If interview mentions specific env vars, test should check those
        for pattern in env_patterns:
            if pattern in content:
                # Good - test is checking the right env var
                pass

        # Look for mismatches - e.g., checking OPENAI_API_KEY when we said "single gateway key"
        if "gateway" in all_text.lower() or "single key" in all_text.lower():
            # Interview mentioned gateway/single key - tests shouldn't check individual provider keys
            old_patterns = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY", "PERPLEXITY_API_KEY"]
            found_old = [p for p in old_patterns if p in content]

            if found_old and "AI_GATEWAY" not in content:
                issues.append(
                    f"⚠️ Gap 5 Warning: Test may be checking wrong environment variables.\n"
                    f"   Interview mentioned: gateway/single key pattern\n"
                    f"   Test checks: {found_old}\n"
                    f"   Consider: Should test check AI_GATEWAY_API_KEY instead?"
                )

    return issues


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")
    new_content = tool_input.get("content", "") or tool_input.get("new_string", "")

    # Only check for API/schema/lib files
    is_api_file = "/api/" in file_path and file_path.endswith(".ts")
    is_lib_file = "/lib/" in file_path and file_path.endswith(".ts")

    if not is_api_file and not is_lib_file:
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

    # Run verification checks
    all_issues = []

    # Check 1: Research used exact terms from interview
    all_issues.extend(check_research_used_exact_terms(state))

    # Check 2: Track this file
    all_issues.extend(check_files_tracked(state, file_path))

    # Check 5: Test/production alignment
    all_issues.extend(check_test_production_alignment(state, file_path, new_content))

    # If there are issues, warn but don't block (these are warnings)
    # The user can review these in the state file
    if all_issues:
        # Store warnings in state for later review
        state.setdefault("verification_warnings", []).extend(all_issues)
        STATE_FILE.write_text(json.dumps(state, indent=2))

    # Allow the operation - these are warnings, not blockers
    print(json.dumps({"permissionDecision": "allow"}))
    sys.exit(0)


if __name__ == "__main__":
    main()
