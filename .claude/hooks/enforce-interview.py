#!/usr/bin/env python3
"""
Hook: PreToolUse for Write/Edit
Purpose: Block proceeding to schema/TDD if interview has no USER answers

This hook ensures Claude actually asks the user questions and records
their answers, rather than self-answering the interview.

v1.8.0 MAJOR UPDATE: Now requires STRUCTURED questions with multiple-choice
options derived from research phase findings.

It checks:
  1. Research phase is complete (questions must be based on research)
  2. Interview status is "complete"
  3. Questions used AskUserQuestion tool with STRUCTURED OPTIONS
  4. At least MIN_STRUCTURED_QUESTIONS have multiple-choice or typed options
  5. Answers don't look auto-generated (contain user-specific details)

The goal: Questions like Claude Code shows - with numbered options and
"Type something" at the end, all based on research findings.

Returns:
  - {"permissionDecision": "allow"} - Let the tool run
  - {"permissionDecision": "deny", "reason": "..."} - Block with explanation
"""
import json
import sys
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"

# Minimum questions required for a valid interview
MIN_QUESTIONS = 5  # Increased - need comprehensive interview

# Minimum questions that MUST have structured options (multiple-choice)
MIN_STRUCTURED_QUESTIONS = 3

# Phrases that indicate self-answered (not real user input)
SELF_ANSWER_INDICATORS = [
    "based on common",
    "self-answered",
    "assumed",
    "typical use case",
    "standard implementation",
    "common pattern",
    "i'll assume",
    "assuming",
    "probably",
    "most likely",
    "default to",
    "usually",
]


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # Enforce for ANY file in /api/ directory (not just route.ts)
    # This forces Claude to stop and interview before ANY API work
    is_api_file = "/api/" in file_path and file_path.endswith(".ts")
    is_schema_file = "/schemas/" in file_path and file_path.endswith(".ts")

    # Skip test files - those are allowed during TDD
    is_test_file = ".test." in file_path or "/__tests__/" in file_path or ".spec." in file_path

    if is_test_file:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    if not is_schema_file and not is_api_file:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    # Check if state file exists
    if not STATE_FILE.exists():
        print(json.dumps({
            "permissionDecision": "deny",
            "reason": """❌ API workflow not started.

Run /api-create [endpoint-name] to begin the interview-driven workflow."""
        }))
        sys.exit(0)

    # Load state
    try:
        state = json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        print(json.dumps({"permissionDecision": "allow"}))
        sys.exit(0)

    phases = state.get("phases", {})
    research = phases.get("research_initial", {})
    interview = phases.get("interview", {})
    interview_status = interview.get("status", "not_started")
    interview_desc = interview.get("description", "").lower()
    questions = interview.get("questions", [])
    research_queries = state.get("research_queries", [])

    # Check 0: Research must be complete FIRST (questions based on research)
    research_status = research.get("status", "not_started")
    if research_status != "complete":
        sources_count = len(research.get("sources", []))
        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: Research phase must complete BEFORE interview.

Research status: {research_status}
Sources consulted: {sources_count}
Research queries: {len(research_queries)}

═══════════════════════════════════════════════════════════
⚠️  COMPLETE RESEARCH FIRST - THEN ASK QUESTIONS
═══════════════════════════════════════════════════════════

The interview questions MUST be based on research findings:
1. Use Context7 to get SDK/API documentation
2. Use WebSearch (2-3 searches) for official docs
3. THEN generate interview questions with STRUCTURED OPTIONS
   based on what you discovered

Example: If research found 5 available models, ask:
  "Which model should this endpoint use?"
  1. gpt-4o (fastest, cheapest)
  2. claude-sonnet-4-20250514 (best reasoning)
  3. gemini-pro (multimodal)
  4. Type something else...

Research INFORMS the options. No research = no good options."""
        }))
        sys.exit(0)

    # Check 1: Interview must be complete
    if interview_status != "complete":
        # Build example based on actual research
        research_based_example = _build_research_based_example(research_queries)

        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: Interview phase not complete.

Current status: {interview_status}
AskUserQuestion calls: {interview.get('user_question_count', 0)}
Structured questions: {interview.get('structured_question_count', 0)}

═══════════════════════════════════════════════════════════
⚠️  USE STRUCTURED QUESTIONS WITH OPTIONS
═══════════════════════════════════════════════════════════

Based on your research, ask questions using AskUserQuestion with
the 'options' parameter to provide multiple-choice selections:

{research_based_example}

REQUIRED FORMAT for AskUserQuestion:
- question: "Your question text"
- options: [
    {{"value": "option1", "label": "Option 1 description"}},
    {{"value": "option2", "label": "Option 2 description"}},
    {{"value": "custom", "label": "Type something..."}}
  ]

You need at least {MIN_STRUCTURED_QUESTIONS} structured questions with options.
Current: {interview.get('structured_question_count', 0)}

DO NOT:
❌ Ask open-ended questions without options
❌ Make up options not based on research
❌ Skip the AskUserQuestion tool
❌ Self-answer questions"""
        }))
        sys.exit(0)

    # Check 2: Must have minimum questions
    if len(questions) < MIN_QUESTIONS:
        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ Interview incomplete - not enough questions asked.

Questions recorded: {len(questions)}
Minimum required: {MIN_QUESTIONS}

You must ask the user more questions about their requirements.
Use AskUserQuestion with structured options based on your research."""
        }))
        sys.exit(0)

    # Check 3: Verify AskUserQuestion tool was actually used
    user_question_count = interview.get("user_question_count", 0)
    tool_used_count = sum(1 for q in questions if q.get("tool_used", False))

    if tool_used_count < MIN_QUESTIONS:
        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ Interview not conducted properly.

AskUserQuestion tool uses tracked: {tool_used_count}
Minimum required: {MIN_QUESTIONS}

You MUST use the AskUserQuestion tool to ask the user directly.
Do NOT make up answers or mark the interview as complete without
actually asking the user and receiving their responses."""
        }))
        sys.exit(0)

    # Check 4: Verify structured questions were used
    structured_count = interview.get("structured_question_count", 0)
    questions_with_options = sum(1 for q in questions if q.get("has_options", False))
    actual_structured = max(structured_count, questions_with_options)

    if actual_structured < MIN_STRUCTURED_QUESTIONS:
        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ Not enough STRUCTURED questions with options.

Structured questions (with options): {actual_structured}
Minimum required: {MIN_STRUCTURED_QUESTIONS}

You MUST use AskUserQuestion with the 'options' parameter to
provide multiple-choice answers based on your research.

Example:
  AskUserQuestion(
    question="Which AI provider should this endpoint support?",
    options=[
      {{"value": "openai", "label": "OpenAI (GPT-4o)"}},
      {{"value": "anthropic", "label": "Anthropic (Claude)"}},
      {{"value": "google", "label": "Google (Gemini)"}},
      {{"value": "all", "label": "All of the above"}},
      {{"value": "custom", "label": "Type something else..."}}
    ]
  )

This gives the user clear choices based on what you researched."""
        }))
        sys.exit(0)

    # Check 5: Look for self-answer indicators
    for indicator in SELF_ANSWER_INDICATORS:
        if indicator in interview_desc:
            print(json.dumps({
                "permissionDecision": "deny",
                "reason": f"""❌ Interview appears to be self-answered.

Detected: "{indicator}" in interview description.

You MUST actually ask the user questions using AskUserQuestion
with structured options. Self-answering defeats the purpose.

Reset the interview and ask with options based on research."""
            }))
            sys.exit(0)

    # Check 6: FINAL USER CONFIRMATION - must confirm interview is complete
    user_question_asked_final = interview.get("user_question_asked", False)
    user_completed = interview.get("user_completed", False)
    phase_exit_confirmed = interview.get("phase_exit_confirmed", False)
    decisions = interview.get("decisions", {})

    if not user_completed or not user_question_asked_final or not phase_exit_confirmed:
        decision_summary = _build_decision_summary(decisions)
        missing = []
        if not user_question_asked_final:
            missing.append("Final confirmation question (AskUserQuestion not used)")
        if not user_completed:
            missing.append("User hasn't confirmed interview complete")
        if not phase_exit_confirmed:
            missing.append("Phase exit confirmation (user must explicitly approve to proceed)")

        print(json.dumps({
            "permissionDecision": "deny",
            "reason": f"""❌ BLOCKED: Interview needs FINAL USER CONFIRMATION.

Questions asked: {len(questions)}
Structured questions: {actual_structured}
User final confirmation: {user_completed}
Phase exit confirmed: {phase_exit_confirmed}

MISSING:
{chr(10).join(f"  • {m}" for m in missing)}

═══════════════════════════════════════════════════════════
⚠️  GET USER CONFIRMATION BEFORE PROCEEDING
═══════════════════════════════════════════════════════════

REQUIRED STEPS:

1. SHOW interview summary to user:
   ┌───────────────────────────────────────────────────────┐
   │ INTERVIEW COMPLETE                                    │
   │                                                       │
   │ Your decisions:                                       │
{chr(10).join(f"   │   • {line:<49} │" for line in decision_summary.split(chr(10))[:8]) if decision_summary else "   │   (no decisions recorded yet)                      │"}
   │                                                       │
   │ These will guide the schema, tests, and implementation│
   │                                                       │
   │ All correct? [Y]                                      │
   │ Change an answer? [n] ____                            │
   └───────────────────────────────────────────────────────┘

2. USE AskUserQuestion:
   question: "Interview decisions correct? Ready to proceed?"
   options: [
     {{"value": "confirm", "label": "Yes, proceed to schema creation"}},
     {{"value": "change", "label": "No, I want to change [which question]"}},
     {{"value": "add", "label": "Add another question about [topic]"}}
   ]

3. If user says "change" or "add":
   • Ask which question/topic
   • Re-ask with AskUserQuestion
   • Update decisions
   • LOOP BACK and show updated summary

4. If user says "confirm":
   • Set interview.user_question_asked = true
   • Set interview.user_completed = true
   • Set interview.status = "complete"

WHY: User must approve their decisions before they drive implementation."""
        }))
        sys.exit(0)

    if decisions:
        # Build a reminder of what the user decided
        decision_summary = _build_decision_summary(decisions)

        # Allow but inject context about user decisions
        print(json.dumps({
            "permissionDecision": "allow",
            "message": f"""✅ Interview complete. REMEMBER THE USER'S DECISIONS:

{decision_summary}

Your implementation MUST align with these choices.
The state file tracks these for consistency verification."""
        }))
    else:
        print(json.dumps({"permissionDecision": "allow"}))

    sys.exit(0)


def _build_decision_summary(decisions: dict) -> str:
    """Build a human-readable summary of user decisions from the interview."""
    if not decisions:
        return "No key decisions recorded."

    lines = []
    decision_labels = {
        "provider": "AI Provider",
        "purpose": "Primary Purpose",
        "response_format": "Response Format",
        "required_params": "Required Parameters",
        "optional_params": "Optional Parameters",
        "error_handling": "Error Handling",
        "api_key_handling": "API Key Handling",
        "external_services": "External Services",
    }

    for key, data in decisions.items():
        label = decision_labels.get(key, key.replace("_", " ").title())
        response = data.get("response", "")
        value = data.get("value", "")

        if value:
            lines.append(f"• {label}: {value}")
        elif response:
            # Truncate long responses
            short_response = response[:80] + "..." if len(response) > 80 else response
            lines.append(f"• {label}: {short_response}")

    return "\n".join(lines) if lines else "No key decisions recorded."


def _build_research_based_example(research_queries: list) -> str:
    """Build an example question based on actual research queries."""
    if not research_queries:
        return """Example (generic - do research first!):
  "What is the main use case for this endpoint?"
  1. Data retrieval
  2. Data transformation
  3. AI processing
  4. Type something..."""

    # Extract terms from research to suggest relevant options
    all_terms = []
    for query in research_queries[-5:]:  # Last 5 queries
        terms = query.get("terms", [])
        all_terms.extend(terms)

    # Deduplicate and get top terms
    unique_terms = list(dict.fromkeys(all_terms))[:4]

    if unique_terms:
        options_example = "\n  ".join([
            f"{i+1}. {term.title()}" for i, term in enumerate(unique_terms)
        ])
        return f"""Example based on your research:
  "Which of these should be the primary focus?"
  {options_example}
  {len(unique_terms)+1}. Type something else..."""

    return """Example:
  "What capability is most important?"
  1. Option based on research finding 1
  2. Option based on research finding 2
  3. Option based on research finding 3
  4. Type something..."""


if __name__ == "__main__":
    main()
