#!/usr/bin/env python3
"""
Hook: PostToolUse for WebSearch, WebFetch, Context7 MCP, AskUserQuestion
Purpose: Track all research activity and turn counts in the state file

This hook runs AFTER Claude uses research tools (WebSearch, WebFetch, Context7).
It logs each research action to api-dev-state.json for:
  - Auditing what research was done
  - Verifying prerequisites before allowing implementation
  - Providing visibility to the user
  - Tracking turn counts for periodic re-grounding

Version: 3.6.7

Updated in v3.6.7:
  - Support multi-API state structure
  - Populate .claude/research/index.json for freshness tracking

Returns:
  - {"continue": true} - Always continues (logging only, no blocking)
"""
import json
import sys
from datetime import datetime
from pathlib import Path

# State file is in .claude/ directory (sibling to hooks/)
STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
RESEARCH_DIR = Path(__file__).parent.parent / "research"
RESEARCH_INDEX = RESEARCH_DIR / "index.json"

# Re-grounding interval (also used by periodic-reground.py)
REGROUND_INTERVAL = 7


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


def update_research_index(endpoint, source_entry):
    """Update the research index.json with new research activity."""
    RESEARCH_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing index
    if RESEARCH_INDEX.exists():
        try:
            index = json.loads(RESEARCH_INDEX.read_text())
        except json.JSONDecodeError:
            index = {"version": "3.6.7", "apis": {}}
    else:
        index = {"version": "3.6.7", "apis": {}}

    if "apis" not in index:
        index["apis"] = {}

    # Update endpoint entry
    now = datetime.now().isoformat()
    if endpoint not in index["apis"]:
        index["apis"][endpoint] = {
            "last_updated": now,
            "freshness_days": 0,
            "source_count": 0,
            "sources": []
        }

    entry = index["apis"][endpoint]
    entry["last_updated"] = now
    entry["freshness_days"] = 0
    entry["source_count"] = entry.get("source_count", 0) + 1

    # Add source summary (keep last 10)
    sources = entry.get("sources", [])
    source_summary = {
        "type": source_entry.get("type", "unknown"),
        "timestamp": now
    }
    if source_entry.get("query"):
        source_summary["query"] = source_entry.get("query", "")[:100]
    if source_entry.get("url"):
        source_summary["url"] = source_entry.get("url", "")[:200]
    if source_entry.get("library"):
        source_summary["library"] = source_entry.get("library", "")

    sources.append(source_summary)
    entry["sources"] = sources[-10:]  # Keep last 10

    # Save index
    RESEARCH_INDEX.write_text(json.dumps(index, indent=2))
    return True


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        # Can't parse, just continue
        print(json.dumps({"continue": True}))
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    tool_output = input_data.get("tool_output", {})

    # Track research tools AND user questions
    research_tools = ["WebSearch", "WebFetch", "mcp__context7"]
    is_research_tool = any(t in tool_name for t in research_tools)
    is_user_question = tool_name == "AskUserQuestion"

    if not is_research_tool and not is_user_question:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Load or create state file
    if STATE_FILE.exists():
        try:
            state = json.loads(STATE_FILE.read_text())
        except json.JSONDecodeError:
            state = create_initial_state()
    else:
        state = create_initial_state()

    # ========================================
    # TURN COUNTING (for periodic re-grounding)
    # ========================================
    # Increment turn count on every tracked tool use
    turn_count = state.get("turn_count", 0) + 1
    state["turn_count"] = turn_count
    state["last_turn_timestamp"] = datetime.now().isoformat()

    # Get phases
    phases = state.setdefault("phases", {})

    # Handle AskUserQuestion separately - track in interview phase
    if is_user_question:
        interview = phases.setdefault("interview", {
            "status": "not_started",
            "questions": [],
            "user_question_count": 0,
            "structured_question_count": 0,
            "decisions": {}  # Track key decisions for consistency checking
        })

        # Track the question
        questions = interview.setdefault("questions", [])
        user_count = interview.get("user_question_count", 0) + 1
        interview["user_question_count"] = user_count

        # Check if this question has structured options (multiple-choice)
        options = tool_input.get("options", [])
        has_options = len(options) > 0

        # Track structured questions count
        if has_options:
            structured_count = interview.get("structured_question_count", 0) + 1
            interview["structured_question_count"] = structured_count

        # IMPORTANT: Capture the user's response from tool_output
        # PostToolUse runs AFTER the tool completes, so we have the response
        user_response = None
        selected_value = None

        # tool_output contains the user's response
        if isinstance(tool_output, str):
            user_response = tool_output
        elif isinstance(tool_output, dict):
            user_response = tool_output.get("response", tool_output.get("result", str(tool_output)))

        # Try to match response to an option value
        if has_options and user_response:
            response_lower = user_response.lower().strip()
            for opt in options:
                opt_value = opt.get("value", "").lower()
                opt_label = opt.get("label", "").lower()
                # Check if response matches value or label
                if opt_value in response_lower or response_lower in opt_label or opt_label in response_lower:
                    selected_value = opt.get("value")
                    break

        question_entry = {
            "question": tool_input.get("question", ""),
            "timestamp": datetime.now().isoformat(),
            "tool_used": True,  # Proves AskUserQuestion was actually called
            "has_options": has_options,
            "options_count": len(options),
            "options": [opt.get("label", opt.get("value", "")) for opt in options[:5]] if options else [],
            "user_response": user_response[:500] if user_response else None,  # Capture actual response
            "selected_value": selected_value  # Matched option value if applicable
        }
        questions.append(question_entry)

        # Track key decisions in a summary dict for easy reference during implementation
        decisions = interview.setdefault("decisions", {})
        question_text = tool_input.get("question", "").lower()

        # Categorize common decision types
        if "provider" in question_text or "ai provider" in question_text:
            decisions["provider"] = {"response": user_response, "value": selected_value}
        elif "purpose" in question_text or "primary purpose" in question_text:
            decisions["purpose"] = {"response": user_response, "value": selected_value}
        elif "format" in question_text or "response format" in question_text:
            decisions["response_format"] = {"response": user_response, "value": selected_value}
        elif "parameter" in question_text and "required" in question_text:
            decisions["required_params"] = {"response": user_response, "value": selected_value}
        elif "parameter" in question_text and "optional" in question_text:
            decisions["optional_params"] = {"response": user_response, "value": selected_value}
        elif "error" in question_text:
            decisions["error_handling"] = {"response": user_response, "value": selected_value}
        elif "api key" in question_text or "key" in question_text:
            decisions["api_key_handling"] = {"response": user_response, "value": selected_value}
        elif "service" in question_text or "external" in question_text:
            decisions["external_services"] = {"response": user_response, "value": selected_value}

        # Update interview status
        if interview.get("status") == "not_started":
            interview["status"] = "in_progress"
            interview["started_at"] = datetime.now().isoformat()

        interview["last_activity"] = datetime.now().isoformat()

        # ========================================
        # CRITICAL: Set user_question_asked flags
        # This is what the enforcement hooks check!
        # ========================================
        interview["user_question_asked"] = True

        # Also update the CURRENT phase based on workflow state
        # Determine which phase we're in and set its user_question_asked flag
        current_phase = _determine_current_phase(phases)
        if current_phase and current_phase in phases:
            phases[current_phase]["user_question_asked"] = True
            # If user responded, also track that
            if user_response:
                phases[current_phase]["last_user_response"] = user_response[:200]
                phases[current_phase]["last_question_timestamp"] = datetime.now().isoformat()

            # ========================================
            # CRITICAL: Detect phase exit confirmations
            # This prevents Claude from self-answering
            # ========================================
            question_text = tool_input.get("question", "").lower()
            question_type = _detect_question_type(question_text, options)
            phases[current_phase]["last_question_type"] = question_type

            # If this is an exit confirmation question AND user responded affirmatively
            if question_type == "exit_confirmation":
                # Check if user's response indicates approval/confirmation
                if user_response and _is_affirmative_response(user_response, options):
                    phases[current_phase]["phase_exit_confirmed"] = True

        # Log for visibility
        if has_options:
            interview["last_structured_question"] = {
                "question": tool_input.get("question", "")[:100],
                "options_count": len(options),
                "user_response": user_response[:100] if user_response else None,
                "selected_value": selected_value,
                "timestamp": datetime.now().isoformat()
            }

        # Save and exit
        STATE_FILE.write_text(json.dumps(state, indent=2))
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Get or create research phase (for research tools)
    research = phases.setdefault("research_initial", {
        "status": "in_progress",
        "sources": [],
        "started_at": datetime.now().isoformat()
    })

    # Update status if not started
    if research.get("status") == "not_started":
        research["status"] = "in_progress"
        research["started_at"] = datetime.now().isoformat()

    # Get sources list
    sources = research.setdefault("sources", [])

    # Create source entry based on tool type
    timestamp = datetime.now().isoformat()

    if "context7" in tool_name.lower():
        source_entry = {
            "type": "context7",
            "tool": tool_name,
            "input": sanitize_input(tool_input),
            "timestamp": timestamp,
            "success": True
        }
        # Extract library info if available
        if "libraryName" in tool_input:
            source_entry["library"] = tool_input["libraryName"]
        if "libraryId" in tool_input:
            source_entry["library_id"] = tool_input["libraryId"]

    elif tool_name == "WebSearch":
        source_entry = {
            "type": "websearch",
            "query": tool_input.get("query", ""),
            "timestamp": timestamp,
            "success": True
        }

    elif tool_name == "WebFetch":
        source_entry = {
            "type": "webfetch",
            "url": tool_input.get("url", ""),
            "timestamp": timestamp,
            "success": True
        }

    else:
        # Generic research tool
        source_entry = {
            "type": "other",
            "tool": tool_name,
            "timestamp": timestamp,
            "success": True
        }

    # Add to sources list
    sources.append(source_entry)

    # v3.6.7: Update research index.json for freshness tracking
    endpoint, _ = get_active_endpoint(state)
    if endpoint:
        update_research_index(endpoint, source_entry)

    # Also add to research_queries for prompt verification
    research_queries = state.setdefault("research_queries", [])
    query_entry = {
        "timestamp": timestamp,
        "tool": tool_name,
    }

    # Extract query/term based on tool type
    if tool_name == "WebSearch":
        query_entry["query"] = tool_input.get("query", "")
        query_entry["terms"] = extract_terms(tool_input.get("query", ""))
    elif tool_name == "WebFetch":
        query_entry["url"] = tool_input.get("url", "")
        query_entry["terms"] = extract_terms_from_url(tool_input.get("url", ""))
    elif "context7" in tool_name.lower():
        query_entry["library"] = tool_input.get("libraryName", tool_input.get("libraryId", ""))
        query_entry["terms"] = [tool_input.get("libraryName", "").lower()]

    research_queries.append(query_entry)

    # Keep only last 50 queries
    state["research_queries"] = research_queries[-50:]

    # Update last activity timestamp
    research["last_activity"] = timestamp
    research["source_count"] = len(sources)

    # Check if we have enough sources to consider research "complete"
    # More robust criteria:
    # - At least 2 sources total (prevents single accidental search from completing)
    # - At least one of: Context7 docs fetch, WebFetch of docs page
    # - At least one search (WebSearch or Context7 resolve)
    context7_count = sum(1 for s in sources if s.get("type") == "context7")
    websearch_count = sum(1 for s in sources if s.get("type") == "websearch")
    webfetch_count = sum(1 for s in sources if s.get("type") == "webfetch")
    total_sources = len(sources)

    # Minimum threshold: 2+ sources with at least one being docs-related
    has_docs = webfetch_count >= 1 or context7_count >= 1
    has_search = websearch_count >= 1 or context7_count >= 1
    sufficient = total_sources >= 2 and has_docs and has_search

    # Auto-complete research if sufficient sources
    if sufficient:
        if research.get("status") == "in_progress":
            research["status"] = "complete"
            research["completed_at"] = timestamp
            research["completion_reason"] = "sufficient_sources"
            research["completion_summary"] = {
                "total_sources": total_sources,
                "context7_calls": context7_count,
                "web_searches": websearch_count,
                "doc_fetches": webfetch_count
            }

    # Save state file
    STATE_FILE.write_text(json.dumps(state, indent=2))

    # Return success
    print(json.dumps({"continue": True}))
    sys.exit(0)


def _detect_question_type(question_text: str, options: list) -> str:
    """
    Detect the type of question being asked.
    Returns: 'exit_confirmation', 'data_collection', 'clarification', or 'unknown'
    """
    question_lower = question_text.lower()

    # Exit confirmation patterns - questions asking to proceed/continue/move to next phase
    exit_patterns = [
        "proceed",
        "continue",
        "ready to",
        "move to",
        "is this correct",
        "all correct",
        "looks correct",
        "approve",
        "approved",
        "confirm",
        "complete",
        "shall i",
        "should i proceed",
        "does this match",
        "ready for",
        "start tdd",
        "start tests",
        "begin",
        "next phase",
        "move on",
        "go ahead"
    ]

    # Check options for exit-like labels
    option_labels = [opt.get("label", "").lower() for opt in options] if options else []
    exit_option_patterns = [
        "yes", "proceed", "continue", "approve", "confirm",
        "ready", "looks good", "correct", "done", "complete"
    ]

    # If question matches exit patterns
    for pattern in exit_patterns:
        if pattern in question_lower:
            return "exit_confirmation"

    # If options suggest it's an exit confirmation
    for opt_label in option_labels:
        for pattern in exit_option_patterns:
            if pattern in opt_label:
                return "exit_confirmation"

    # Data collection - asking for choices about implementation
    data_patterns = [
        "which", "what", "how should", "prefer", "want",
        "format", "handling", "strategy", "method"
    ]
    for pattern in data_patterns:
        if pattern in question_lower:
            return "data_collection"

    # Clarification - asking for more info
    clarify_patterns = [
        "clarify", "explain", "more detail", "what do you mean"
    ]
    for pattern in clarify_patterns:
        if pattern in question_lower:
            return "clarification"

    return "unknown"


def _is_affirmative_response(response: str, options: list) -> bool:
    """
    Check if the user's response indicates approval/confirmation.
    """
    response_lower = response.lower().strip()

    # Direct affirmative words
    affirmative_words = [
        "yes", "y", "proceed", "continue", "approve", "confirm",
        "correct", "ready", "go", "ok", "okay", "looks good",
        "sounds good", "perfect", "great", "fine", "done",
        "all good", "looks correct", "is correct", "all correct"
    ]

    for word in affirmative_words:
        if word in response_lower:
            return True

    # Check if response matches an affirmative option
    if options:
        for opt in options:
            opt_label = opt.get("label", "").lower()
            opt_value = opt.get("value", "").lower()

            # If response matches an option that sounds affirmative
            if opt_label in response_lower or response_lower in opt_label:
                for aff in affirmative_words:
                    if aff in opt_label:
                        return True

    # Check for negative responses (to avoid false positives)
    negative_words = ["no", "change", "modify", "add more", "not yet", "wait"]
    for word in negative_words:
        if word in response_lower:
            return False

    return False


def _determine_current_phase(phases: dict) -> str:
    """Determine which phase is currently active based on status."""
    # Phase order - return first incomplete phase
    phase_order = [
        "disambiguation",
        "scope",
        "research_initial",
        "interview",
        "research_deep",
        "schema_creation",
        "environment_check",
        "tdd_red",
        "tdd_green",
        "verify",
        "tdd_refactor",
        "documentation"
    ]

    for phase_name in phase_order:
        phase = phases.get(phase_name, {})
        status = phase.get("status", "not_started")
        if status != "complete":
            return phase_name

    # All complete, return documentation
    return "documentation"


def create_initial_state():
    """Create initial state structure (v3.0.0)"""
    return {
        "version": "3.0.0",
        "created_at": datetime.now().isoformat(),
        "endpoint": None,
        "library": None,
        "session_id": None,
        "turn_count": 0,
        "last_turn_timestamp": None,
        "research_queries": [],
        "prompt_detections": [],
        "phases": {
            "disambiguation": {
                "status": "not_started",
                "clarified": None,
                "search_variations": [],
                "description": "Pre-research disambiguation to clarify ambiguous requests"
            },
            "scope": {
                "status": "not_started",
                "confirmed": False,
                "description": "Initial scope understanding and confirmation"
            },
            "research_initial": {
                "status": "not_started",
                "sources": [],
                "summary_approved": False,
                "description": "Context7/WebSearch research for live documentation"
            },
            "interview": {
                "status": "not_started",
                "questions": [],
                "user_question_count": 0,
                "structured_question_count": 0,
                "decisions": {},
                "description": "Structured interview about requirements (generated FROM research)"
            },
            "research_deep": {
                "status": "not_started",
                "sources": [],
                "proposed_searches": [],
                "approved_searches": [],
                "skipped_searches": [],
                "description": "Deep dive based on interview answers (adaptive, not shotgun)"
            },
            "schema_creation": {
                "status": "not_started",
                "schema_file": None,
                "schema_approved": False,
                "description": "Zod schema creation from research"
            },
            "environment_check": {
                "status": "not_started",
                "keys_verified": [],
                "keys_missing": [],
                "confirmed": False,
                "description": "API key and environment verification"
            },
            "tdd_red": {
                "status": "not_started",
                "test_file": None,
                "test_count": 0,
                "test_matrix_approved": False,
                "description": "Write failing tests first"
            },
            "tdd_green": {
                "status": "not_started",
                "implementation_file": None,
                "all_tests_passing": False,
                "description": "Minimal implementation to pass tests"
            },
            "verify": {
                "status": "not_started",
                "gaps_found": 0,
                "gaps_fixed": 0,
                "intentional_omissions": [],
                "re_research_done": False,
                "description": "Re-research after Green to verify implementation matches docs"
            },
            "tdd_refactor": {
                "status": "not_started",
                "description": "Code cleanup while keeping tests green"
            },
            "documentation": {
                "status": "not_started",
                "files_updated": [],
                "manifest_updated": False,
                "openapi_updated": False,
                "research_cached": False,
                "description": "Update manifests, OpenAPI, cache research"
            }
        },
        "verification": {
            "all_sources_fetched": False,
            "schema_matches_docs": False,
            "tests_cover_params": False,
            "all_tests_passing": False,
            "coverage_percent": None,
            "post_green_verification": False
        },
        "research_index": {},
        "reground_history": []
    }


def sanitize_input(tool_input):
    """Remove potentially sensitive data from input before logging"""
    sanitized = {}
    for key, value in tool_input.items():
        # Skip API keys or tokens
        if any(sensitive in key.lower() for sensitive in ["key", "token", "secret", "password"]):
            sanitized[key] = "[REDACTED]"
        else:
            sanitized[key] = value
    return sanitized


def extract_terms(query: str) -> list:
    """Extract searchable terms from a query string."""
    import re
    # Remove common words and extract meaningful terms
    stop_words = {"the", "a", "an", "is", "are", "was", "were", "be", "been",
                  "how", "to", "do", "does", "what", "which", "for", "and", "or",
                  "in", "on", "at", "with", "from", "this", "that", "it"}

    # Extract words
    words = re.findall(r'\b[\w@/-]+\b', query.lower())

    # Filter and return
    terms = [w for w in words if w not in stop_words and len(w) > 2]
    return terms[:10]  # Limit to 10 terms


def extract_terms_from_url(url: str) -> list:
    """Extract meaningful terms from a URL."""
    import re
    from urllib.parse import urlparse

    try:
        parsed = urlparse(url)
        # Get domain parts and path parts
        domain_parts = parsed.netloc.replace("www.", "").split(".")
        path_parts = [p for p in parsed.path.split("/") if p]

        # Combine and filter
        all_parts = domain_parts + path_parts
        terms = []
        for part in all_parts:
            # Split by common separators
            sub_parts = re.split(r'[-_.]', part.lower())
            terms.extend(sub_parts)

        # Filter short/common terms
        stop_terms = {"com", "org", "io", "dev", "api", "docs", "www", "http", "https"}
        terms = [t for t in terms if t not in stop_terms and len(t) > 2]
        return terms[:10]
    except Exception:
        return []


if __name__ == "__main__":
    main()
