#!/usr/bin/env python3
"""
Hook: PostToolUse (after test runs)
Purpose: Trigger Phase 10 (Verify) + Manifest Generation after tests pass

This hook detects when tests pass (TDD Green phase complete) and:
  1. Runs the programmatic manifest generation scripts
  2. Reminds Claude to re-research the original documentation
  3. Compares implemented features to documented features
  4. Requires user confirmation before proceeding

The goal is to:
  - Automatically generate api-tests-manifest.json from test files (programmatic, not LLM)
  - Catch cases where Claude implemented from memory instead of from researched docs

Triggers on: Bash commands containing "test" that exit successfully

Returns:
  - {"continue": true} with additionalContext prompting verification
"""
import json
import sys
import os
import subprocess
from datetime import datetime
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
# Scripts locations (try in order):
# 1. Installed in project: scripts/api-dev-tools/
# 2. In node_modules (if running from package)
# 3. Package root (development)
PROJECT_ROOT = Path(__file__).parent.parent.parent
SCRIPTS_LOCATIONS = [
    PROJECT_ROOT / "scripts" / "api-dev-tools",  # CLI-installed location
    PROJECT_ROOT / "node_modules" / "@hustle-together" / "api-dev-tools" / "scripts",
    Path(__file__).parent.parent.parent / "scripts",  # Development fallback
]


def run_manifest_scripts() -> dict:
    """
    Run the programmatic manifest generation scripts.

    These scripts are 100% deterministic - they parse source files,
    extract parameters from Zod schemas, and generate the manifest.
    NO LLM involvement.

    Returns dict with results of each script.
    """
    results = {
        "manifest_generated": False,
        "parameters_extracted": False,
        "results_collected": False,
        "errors": []
    }

    # Find the scripts directory (try multiple locations)
    scripts_dir = None
    for loc in SCRIPTS_LOCATIONS:
        if loc.exists():
            scripts_dir = loc
            break

    if scripts_dir is None:
        results["errors"].append("Scripts directory not found in any expected location")
        return results

    project_root = PROJECT_ROOT

    # Run generate-test-manifest.ts
    manifest_script = scripts_dir / "generate-test-manifest.ts"
    if manifest_script.exists():
        try:
            subprocess.run(
                ["npx", "tsx", str(manifest_script), str(project_root)],
                cwd=str(project_root),
                capture_output=True,
                text=True,
                timeout=60
            )
            results["manifest_generated"] = True
        except subprocess.TimeoutExpired:
            results["errors"].append("Manifest generation timed out")
        except Exception as e:
            results["errors"].append(f"Manifest generation failed: {e}")

    # Run extract-parameters.ts
    params_script = scripts_dir / "extract-parameters.ts"
    if params_script.exists():
        try:
            subprocess.run(
                ["npx", "tsx", str(params_script), str(project_root)],
                cwd=str(project_root),
                capture_output=True,
                text=True,
                timeout=60
            )
            results["parameters_extracted"] = True
        except subprocess.TimeoutExpired:
            results["errors"].append("Parameter extraction timed out")
        except Exception as e:
            results["errors"].append(f"Parameter extraction failed: {e}")

    # Run collect-test-results.ts (optional - only if tests were just run)
    results_script = scripts_dir / "collect-test-results.ts"
    if results_script.exists():
        try:
            subprocess.run(
                ["npx", "tsx", str(results_script), str(project_root)],
                cwd=str(project_root),
                capture_output=True,
                text=True,
                timeout=120  # Test collection can take longer
            )
            results["results_collected"] = True
        except subprocess.TimeoutExpired:
            results["errors"].append("Test results collection timed out")
        except Exception as e:
            results["errors"].append(f"Test results collection failed: {e}")

    return results


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    tool_output = input_data.get("tool_output", {})

    # Only trigger on Bash commands
    if tool_name != "Bash":
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if this is a test command
    command = tool_input.get("command", "")
    is_test_command = any(test_keyword in command.lower() for test_keyword in [
        "pnpm test", "npm test", "vitest", "jest", "pytest", "test:run"
    ])

    if not is_test_command:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if tests passed (exit code 0 or output indicates success)
    output_text = ""
    if isinstance(tool_output, str):
        output_text = tool_output
    elif isinstance(tool_output, dict):
        output_text = tool_output.get("output", tool_output.get("stdout", ""))

    # Look for success indicators
    tests_passed = any(indicator in output_text.lower() for indicator in [
        "tests passed", "all tests passed", "test suites passed",
        "✓", "passed", "0 failed", "pass"
    ]) and not any(fail in output_text.lower() for fail in [
        "failed", "error", "fail"
    ])

    if not tests_passed:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Tests passed - run manifest generation scripts
    manifest_output = run_manifest_scripts()

    # Tests passed - check state file
    if not STATE_FILE.exists():
        print(json.dumps({"continue": True}))
        sys.exit(0)

    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    phases = state.get("phases", {})
    tdd_green = phases.get("tdd_green", {})
    verify = phases.get("verify", {})

    # Check if we're in TDD Green phase
    if tdd_green.get("status") != "in_progress":
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if verify phase already done
    if verify.get("status") == "complete":
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Mark TDD Green as complete
    tdd_green["status"] = "complete"
    tdd_green["all_tests_passing"] = True
    tdd_green["completed_at"] = datetime.now().isoformat()

    # Start verify phase
    verify["status"] = "in_progress"
    verify["started_at"] = datetime.now().isoformat()

    # Update manifest_generation section in state
    if "manifest_generation" not in state:
        state["manifest_generation"] = {}

    state["manifest_generation"]["last_run"] = datetime.now().isoformat()
    state["manifest_generation"]["manifest_generated"] = manifest_output.get("manifest_generated", False)
    state["manifest_generation"]["parameters_extracted"] = manifest_output.get("parameters_extracted", False)
    state["manifest_generation"]["test_results_collected"] = manifest_output.get("results_collected", False)

    # Save state
    STATE_FILE.write_text(json.dumps(state, indent=2))

    # Build verification prompt
    endpoint = state.get("endpoint", "the endpoint")

    context_parts = []

    # Report manifest generation results
    if manifest_output.get("manifest_generated"):
        context_parts.append("## ✅ Manifest Generation Complete")
        context_parts.append("")
        context_parts.append("Programmatically generated from test files (no LLM):")
        if manifest_output.get("manifest_generated"):
            context_parts.append("  - ✓ api-tests-manifest.json")
        if manifest_output.get("parameters_extracted"):
            context_parts.append("  - ✓ parameter-matrix.json")
        if manifest_output.get("results_collected"):
            context_parts.append("  - ✓ test-results.json")
        if manifest_output.get("errors"):
            context_parts.append("")
            context_parts.append("⚠️ Some scripts had issues:")
            for err in manifest_output["errors"]:
                context_parts.append(f"  - {err}")
        context_parts.append("")
        context_parts.append("---")
        context_parts.append("")

    context_parts.append("## Phase 10: Implementation Verification Required")
    context_parts.append("")
    context_parts.append("Tests are passing. Before proceeding, you MUST verify your implementation:")
    context_parts.append("")
    context_parts.append("**Required Actions:**")
    context_parts.append("1. Re-read the original API documentation (use Context7 or WebSearch)")
    context_parts.append("2. Compare EVERY documented parameter/feature to your implementation")
    context_parts.append("3. Report any discrepancies in this format:")
    context_parts.append("")
    context_parts.append("```")
    context_parts.append("| Feature          | In Docs | Implemented | Status          |")
    context_parts.append("|------------------|---------|-------------|-----------------|")
    context_parts.append("| param_name       | Yes     | Yes         | Match           |")
    context_parts.append("| missing_param    | Yes     | No          | MISSING         |")
    context_parts.append("| extra_param      | No      | Yes         | EXTRA (OK)      |")
    context_parts.append("```")
    context_parts.append("")
    context_parts.append("**After comparison, ask the user:**")
    context_parts.append("- Fix gaps? [Y] - Loop back to Red phase")
    context_parts.append("- Skip (intentional omissions)? [n] - Document and proceed")
    context_parts.append("")
    context_parts.append("DO NOT proceed to Refactor until verification is complete.")

    output = {
        "continue": True,
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": "\n".join(context_parts)
        }
    }

    print(json.dumps(output))
    sys.exit(0)


if __name__ == "__main__":
    main()
