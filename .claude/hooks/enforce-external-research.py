#!/usr/bin/env python3
"""
Hook: UserPromptSubmit
Purpose: ALWAYS enforce research before answering technical questions

This hook runs BEFORE Claude processes the user's prompt. It aggressively
detects ANY technical question and requires comprehensive research using
BOTH Context7 AND multiple WebSearches before answering.

Philosophy: "ALWAYS research. Training data is NEVER trustworthy for technical info."

The hook triggers on:
- ANY mention of APIs, SDKs, libraries, packages, frameworks
- ANY technical "how to" or capability questions
- ANY code-related questions (functions, methods, parameters, types)
- ANY questions about tools, services, or platforms
- ANY request for implementation, editing, or changes

Returns:
  - Prints context to stdout (injected into conversation)
  - Exit 0 to allow the prompt to proceed
"""
import json
import sys
import re
from pathlib import Path
from datetime import datetime

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"

# ============================================================================
# AGGRESSIVE DETECTION PATTERNS
# ============================================================================

# Technical terms that ALWAYS trigger research
TECHNICAL_TERMS = [
    # Code/Development
    r"\b(?:function|method|class|interface|type|schema|model)\b",
    r"\b(?:parameter|argument|option|config|setting|property)\b",
    r"\b(?:import|export|require|module|package|library|dependency)\b",
    r"\b(?:api|sdk|framework|runtime|engine|platform)\b",
    r"\b(?:endpoint|route|url|path|request|response|header)\b",
    r"\b(?:database|query|table|collection|document|record)\b",
    r"\b(?:authentication|authorization|token|key|secret|credential)\b",
    r"\b(?:error|exception|bug|issue|problem|fix)\b",
    r"\b(?:test|spec|coverage|mock|stub|fixture)\b",
    r"\b(?:deploy|build|compile|bundle|publish|release)\b",
    r"\b(?:install|setup|configure|initialize|migrate)\b",
    r"\b(?:provider|service|client|server|handler|middleware)\b",
    r"\b(?:stream|async|await|promise|callback|event)\b",
    r"\b(?:component|widget|element|view|layout|template)\b",
    r"\b(?:state|store|reducer|action|context|hook)\b",
    r"\b(?:validate|parse|serialize|transform|convert)\b",

    # Package patterns
    r"@[\w-]+/[\w-]+",                      # @scope/package
    r"\b[\w-]+-(?:sdk|api|js|ts|py|go|rs)\b",  # something-sdk, something-api

    # Version patterns
    r"\bv?\d+\.\d+(?:\.\d+)?(?:-[\w.]+)?\b",  # v1.2.3, 2.0.0-beta

    # File patterns
    r"\b[\w-]+\.(?:ts|js|tsx|jsx|py|go|rs|json|yaml|yml|toml|env)\b",
]

# Question patterns that indicate asking about functionality
QUESTION_PATTERNS = [
    # Direct questions
    r"\b(?:what|which|where|when|why|how)\b",
    r"\b(?:can|could|would|should|will|does|do|is|are)\b.*\?",

    # Requests
    r"\b(?:show|tell|explain|describe|list|find|get|give)\b",
    r"\b(?:help|need|want|looking for|trying to)\b",

    # Actions
    r"\b(?:create|make|build|add|implement|write|generate)\b",
    r"\b(?:update|change|modify|edit|fix|refactor|improve)\b",
    r"\b(?:delete|remove|drop|clear|reset)\b",
    r"\b(?:connect|integrate|link|sync|merge)\b",
    r"\b(?:debug|trace|log|monitor|track)\b",

    # Comparisons
    r"\b(?:difference|compare|versus|vs|between|or)\b",
    r"\b(?:better|best|recommended|preferred|alternative)\b",
]

# Phrases that ALWAYS require research (no exceptions)
ALWAYS_RESEARCH_PHRASES = [
    r"how (?:to|do|does|can|should|would)",
    r"what (?:is|are|does|can|should)",
    r"(?:does|can|will|should) .+ (?:support|have|handle|work|do)",
    r"(?:list|show|get|find) (?:all|available|supported)",
    r"example (?:of|for|using|with|code)",
    r"(?:implement|add|create|build|write|generate) .+",
    r"(?:update|change|modify|edit|fix) .+",
    r"(?:configure|setup|install|deploy) .+",
    r"(?:error|issue|problem|bug|not working)",
    r"(?:api|sdk|library|package|module|framework)",
    r"(?:documentation|docs|reference|guide)",
]

# Exclusion patterns - things that DON'T need research
EXCLUDE_PATTERNS = [
    r"^(?:hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure)[\s!?.]*$",
    r"^(?:good morning|good afternoon|good evening|goodbye|bye)[\s!?.]*$",
    r"^(?:please|sorry|excuse me)[\s!?.]*$",
    r"^(?:\d+[\s+\-*/]\d+|calculate|math).*$",  # Simple math
]

# ============================================================================
# DETECTION LOGIC
# ============================================================================

def is_excluded(prompt: str) -> bool:
    """Check if prompt is a simple greeting or non-technical."""
    prompt_clean = prompt.strip().lower()

    # Very short prompts that are just greetings
    if len(prompt_clean) < 20:
        for pattern in EXCLUDE_PATTERNS:
            if re.match(pattern, prompt_clean, re.IGNORECASE):
                return True

    return False


def detect_technical_question(prompt: str) -> dict:
    """
    Aggressively detect if the prompt is technical and requires research.

    Returns:
        {
            "detected": bool,
            "terms": list of detected terms,
            "patterns_matched": list of pattern types,
            "confidence": "critical" | "high" | "medium" | "low" | "none"
        }
    """
    if is_excluded(prompt):
        return {
            "detected": False,
            "terms": [],
            "patterns_matched": [],
            "confidence": "none",
        }

    prompt_lower = prompt.lower()
    detected_terms = []
    patterns_matched = []

    # Check for ALWAYS_RESEARCH_PHRASES first (highest priority)
    for pattern in ALWAYS_RESEARCH_PHRASES:
        if re.search(pattern, prompt_lower, re.IGNORECASE):
            patterns_matched.append("always_research")
            # Extract the matched phrase
            match = re.search(pattern, prompt_lower, re.IGNORECASE)
            if match:
                detected_terms.append(match.group(0)[:50])

    # Check technical terms
    for pattern in TECHNICAL_TERMS:
        matches = re.findall(pattern, prompt_lower, re.IGNORECASE)
        if matches:
            detected_terms.extend(matches[:3])  # Limit per pattern
            patterns_matched.append("technical_term")

    # Check question patterns
    for pattern in QUESTION_PATTERNS:
        if re.search(pattern, prompt_lower, re.IGNORECASE):
            patterns_matched.append("question_pattern")
            break

    # Deduplicate
    detected_terms = list(dict.fromkeys(detected_terms))[:10]
    patterns_matched = list(set(patterns_matched))

    # Determine confidence - MUCH more aggressive
    if "always_research" in patterns_matched:
        confidence = "critical"
    elif "technical_term" in patterns_matched and "question_pattern" in patterns_matched:
        confidence = "high"
    elif "technical_term" in patterns_matched:
        confidence = "high"  # Technical terms alone = high
    elif "question_pattern" in patterns_matched and len(prompt) > 30:
        confidence = "medium"  # Questions longer than 30 chars
    elif len(prompt) > 50:
        confidence = "low"  # Longer prompts default to low (still triggers)
    else:
        confidence = "none"

    # AGGRESSIVE: Trigger on anything except "none"
    detected = confidence != "none"

    return {
        "detected": detected,
        "terms": detected_terms,
        "patterns_matched": patterns_matched,
        "confidence": confidence,
    }


def check_active_workflow() -> bool:
    """Check if there's an active API development workflow."""
    if not STATE_FILE.exists():
        return False

    try:
        state = json.loads(STATE_FILE.read_text())
        phases = state.get("phases", {})

        for phase_key, phase_data in phases.items():
            if isinstance(phase_data, dict):
                status = phase_data.get("status", "")
                if status in ["in_progress", "pending", "complete"]:
                    # If ANY phase has been touched, we're in a workflow
                    return True

        return False
    except (json.JSONDecodeError, Exception):
        return False


def log_detection(prompt: str, detection: dict, injected: bool) -> None:
    """Log this detection for debugging/auditing."""
    try:
        if STATE_FILE.exists():
            state = json.loads(STATE_FILE.read_text())
        else:
            state = {"prompt_detections": []}

        if "prompt_detections" not in state:
            state["prompt_detections"] = []

        state["prompt_detections"].append({
            "timestamp": datetime.now().isoformat(),
            "prompt_preview": prompt[:100] + "..." if len(prompt) > 100 else prompt,
            "detection": detection,
            "injected": injected,
        })

        # Keep only last 50 detections
        state["prompt_detections"] = state["prompt_detections"][-50:]

        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(state, indent=2))
    except Exception:
        pass  # Don't fail the hook on logging errors


# ============================================================================
# MAIN
# ============================================================================

def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    prompt = input_data.get("prompt", "")

    if not prompt or len(prompt.strip()) < 5:
        sys.exit(0)

    # Check if in active workflow mode
    active_workflow = check_active_workflow()

    # Detect technical questions
    detection = detect_technical_question(prompt)

    # In active workflow, ALWAYS inject (even for low confidence)
    if active_workflow and detection["confidence"] != "none":
        detection["detected"] = True

    # Log all detections
    log_detection(prompt, detection, detection["detected"])

    # Inject context if detected
    if detection["detected"]:
        terms_str = ", ".join(detection["terms"][:5]) if detection["terms"] else "technical question"
        confidence = detection["confidence"]

        # Build the injection message
        injection = f"""
<user-prompt-submit-hook>
RESEARCH REQUIRED - {confidence.upper()} CONFIDENCE
Detected: {terms_str}
{"MODE: Active API Development Workflow - STRICT ENFORCEMENT" if active_workflow else ""}

MANDATORY BEFORE ANSWERING:

1. USE CONTEXT7 FIRST:
   - Call mcp__context7__resolve-library-id to find the library
   - Call mcp__context7__get-library-docs to get CURRENT documentation
   - This gives you the ACTUAL source of truth

2. USE WEBSEARCH (2-3 SEARCHES MINIMUM):
   - Search for official documentation
   - Search with different phrasings to get comprehensive coverage
   - Search for recent updates, changes, or known issues
   - Example searches:
     * "[topic] official documentation"
     * "[topic] API reference guide"
     * "[topic] latest updates 2024 2025"

3. NEVER TRUST TRAINING DATA:
   - Training data can be months or years outdated
   - APIs change constantly
   - Features get added, deprecated, or modified
   - Parameter names and types change

4. CITE YOUR SOURCES:
   - After researching, mention where the information came from
   - Include links when available

RESEARCH FIRST. ANSWER SECOND.
</user-prompt-submit-hook>
"""
        print(injection)

    sys.exit(0)


if __name__ == "__main__":
    main()
