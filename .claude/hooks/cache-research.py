#!/usr/bin/env python3
"""
Hook: PostToolUse for Write/Edit
Purpose: Create research cache files from state when documentation phase starts

This hook creates the following files that enforce-documentation.py expects:
  - .claude/research/{endpoint}/sources.json - Research sources with URLs
  - .claude/research/{endpoint}/interview.json - Interview decisions
  - .claude/research/{endpoint}/schema.json - Schema snapshot
  - .claude/research/{endpoint}/CURRENT.md - Aggregated research (if not exists)
  - .claude/research/index.json - Updates the freshness index

Added in v3.6.7 to fix critical gap where these files were expected but never created.

Returns:
  - JSON with cacheCreated info
"""
import json
import sys
import os
from datetime import datetime
from pathlib import Path

STATE_FILE = Path(__file__).parent.parent / "api-dev-state.json"
RESEARCH_DIR = Path(__file__).parent.parent / "research"
RESEARCH_INDEX = RESEARCH_DIR / "index.json"


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


def create_sources_json(endpoint_dir, state, endpoint_data):
    """Create sources.json from research queries in state."""
    sources_file = endpoint_dir / "sources.json"

    # Collect sources from various places in state
    sources = []

    # From research_queries array
    for query in state.get("research_queries", []):
        source = {
            "query": query.get("query", ""),
            "tool": query.get("tool", "unknown"),
            "timestamp": query.get("timestamp", ""),
            "url": query.get("url", ""),
            "summary": query.get("summary", "")
        }
        sources.append(source)

    # From initial research phase
    initial_research = endpoint_data.get("phases", {}).get("research_initial", {})
    for src in initial_research.get("sources", []):
        if isinstance(src, dict):
            sources.append(src)
        elif isinstance(src, str):
            sources.append({"url": src, "summary": ""})

    # From deep research phase
    deep_research = endpoint_data.get("phases", {}).get("research_deep", {})
    for src in deep_research.get("sources", []):
        if isinstance(src, dict):
            sources.append(src)
        elif isinstance(src, str):
            sources.append({"url": src, "summary": ""})

    # Deduplicate by URL
    seen_urls = set()
    unique_sources = []
    for src in sources:
        url = src.get("url", src.get("query", ""))
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_sources.append(src)

    data = {
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "endpoint": endpoint_data.get("endpoint", state.get("endpoint", "")),
        "source_count": len(unique_sources),
        "sources": unique_sources
    }

    sources_file.write_text(json.dumps(data, indent=2))
    return True


def create_interview_json(endpoint_dir, endpoint_data):
    """Create interview.json from interview decisions in state."""
    interview_file = endpoint_dir / "interview.json"

    interview = endpoint_data.get("phases", {}).get("interview", {})
    decisions = interview.get("decisions", {})
    questions = interview.get("questions", [])

    data = {
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "question_count": len(questions),
        "decision_count": len(decisions),
        "questions": questions,
        "decisions": decisions
    }

    interview_file.write_text(json.dumps(data, indent=2))
    return True


def create_schema_json(endpoint_dir, endpoint_data, state):
    """Create schema.json from schema creation phase in state."""
    schema_json_file = endpoint_dir / "schema.json"

    schema_phase = endpoint_data.get("phases", {}).get("schema_creation", {})
    schema_file = schema_phase.get("schema_file", schema_phase.get("file", ""))
    fields_count = schema_phase.get("fields_count", 0)

    # Try to read actual schema file if it exists
    schema_content = None
    if schema_file:
        schema_path = Path(schema_file)
        if schema_path.exists():
            try:
                schema_content = schema_path.read_text()
            except IOError:
                pass

    data = {
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "schema_file": schema_file,
        "fields_count": fields_count,
        "schema_content": schema_content
    }

    schema_json_file.write_text(json.dumps(data, indent=2))
    return True


def create_current_md(endpoint_dir, endpoint, endpoint_data, state):
    """Create CURRENT.md if it doesn't exist."""
    current_md = endpoint_dir / "CURRENT.md"

    # Only create if doesn't exist (don't overwrite manual research)
    if current_md.exists():
        return False

    # Build aggregated research content
    lines = [
        f"# Research: {endpoint}",
        "",
        f"*Generated: {datetime.now().isoformat()}*",
        "",
        "## Sources",
        ""
    ]

    # Add sources
    sources_file = endpoint_dir / "sources.json"
    if sources_file.exists():
        try:
            sources = json.loads(sources_file.read_text())
            for src in sources.get("sources", []):
                url = src.get("url", "")
                summary = src.get("summary", "")
                if url:
                    lines.append(f"- {url}")
                    if summary:
                        lines.append(f"  - {summary}")
        except (json.JSONDecodeError, IOError):
            pass

    lines.extend(["", "## Interview Decisions", ""])

    # Add interview decisions
    interview_file = endpoint_dir / "interview.json"
    if interview_file.exists():
        try:
            interview = json.loads(interview_file.read_text())
            for key, value in interview.get("decisions", {}).items():
                response = value.get("response", value.get("value", "N/A"))
                lines.append(f"- **{key}**: {response}")
        except (json.JSONDecodeError, IOError):
            pass

    lines.extend(["", "## Schema", ""])

    # Add schema info
    schema_file = endpoint_dir / "schema.json"
    if schema_file.exists():
        try:
            schema = json.loads(schema_file.read_text())
            lines.append(f"- File: `{schema.get('schema_file', 'N/A')}`")
            lines.append(f"- Fields: {schema.get('fields_count', 0)}")
        except (json.JSONDecodeError, IOError):
            pass

    current_md.write_text("\n".join(lines))
    return True


def update_research_index(endpoint):
    """Update the research index with this endpoint."""
    RESEARCH_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing index or create new
    if RESEARCH_INDEX.exists():
        try:
            index = json.loads(RESEARCH_INDEX.read_text())
        except json.JSONDecodeError:
            index = {"version": "3.6.7", "apis": {}}
    else:
        index = {"version": "3.6.7", "apis": {}}

    # Ensure apis object exists
    if "apis" not in index:
        index["apis"] = {}

    # Update this endpoint's entry
    now = datetime.now().isoformat()
    index["apis"][endpoint] = {
        "last_updated": now,
        "freshness_days": 0,
        "cache_path": f".claude/research/{endpoint}/",
        "files": ["sources.json", "interview.json", "schema.json", "CURRENT.md"]
    }

    RESEARCH_INDEX.write_text(json.dumps(index, indent=2))
    return True


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    tool_result = input_data.get("tool_result", {})
    file_path = tool_input.get("file_path", "")

    # Only trigger on Write/Edit to documentation-related files
    if tool_name not in ["Write", "Edit"]:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Check if this is a documentation-related write
    is_manifest = "api-tests-manifest.json" in file_path
    is_readme = file_path.endswith("README.md") and "/api/" in file_path
    is_state = "api-dev-state.json" in file_path

    # Also trigger when documentation phase is in progress
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

    # Check if documentation phase is in progress or we're writing doc files
    doc_phase = endpoint_data.get("phases", {}).get("documentation", {})
    doc_status = doc_phase.get("status", "not_started")

    if doc_status not in ["in_progress", "complete"] and not is_manifest and not is_readme:
        print(json.dumps({"continue": True}))
        sys.exit(0)

    # Create research cache directory
    endpoint_dir = RESEARCH_DIR / endpoint
    endpoint_dir.mkdir(parents=True, exist_ok=True)

    # Create cache files
    files_created = []

    sources_created = create_sources_json(endpoint_dir, state, endpoint_data)
    if sources_created:
        files_created.append("sources.json")

    interview_created = create_interview_json(endpoint_dir, endpoint_data)
    if interview_created:
        files_created.append("interview.json")

    schema_created = create_schema_json(endpoint_dir, endpoint_data, state)
    if schema_created:
        files_created.append("schema.json")

    current_created = create_current_md(endpoint_dir, endpoint, endpoint_data, state)
    if current_created:
        files_created.append("CURRENT.md")

    # Update index
    index_updated = update_research_index(endpoint)
    if index_updated:
        files_created.append("index.json")

    # Update state to indicate research is cached
    if files_created:
        doc_phase["research_cached"] = True
        STATE_FILE.write_text(json.dumps(state, indent=2))

    output = {
        "hookSpecificOutput": {
            "cacheCreated": True,
            "endpoint": endpoint,
            "files": files_created,
            "cacheDir": str(endpoint_dir)
        }
    }

    print(json.dumps(output))
    sys.exit(0)


if __name__ == "__main__":
    main()
