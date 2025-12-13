---
description: Create implementation plan from feature/requirement with PRD-style discovery and TDD acceptance criteria
argument-hint: <feature/requirement description or GitHub issue URL/number>
---

# Plan: PRD-Informed Task Planning for TDD

Create structured implementation plan that bridges product thinking (PRD) with test-driven development.

## General Guidelines

### Output Style

- **Never explicitly mention TDD** in code, comments, commits, PRs, or issues
- Write natural, descriptive code without meta-commentary about the development process
- The code should speak for itself - TDD is the process, not the product

## Input

$ARGUMENTS

(If no input provided, check conversation context)

## Input Processing

The input can be one of:

1. **GitHub Issue URL** (e.g., `https://github.com/owner/repo/issues/123`)
2. **GitHub Issue Number** (e.g., `#123` or `123`)
3. **Feature Description** (e.g., "Add user authentication")
4. **Empty** - use conversation context

### GitHub Issue Integration

If input looks like a GitHub issue:

**Step 1: Extract Issue Number**

- From URL: extract owner/repo/number
- From number: try to infer repo from git remote
- From branch name: check patterns like `issue-123`, `123-feature`, `feature/123`

**Step 2: Fetch Issue**
Try GitHub MCP first:

- If available: use `mcp__github__issue_read` to fetch issue details
- If not available: show message and try `gh issue view <number>`

```
GitHub MCP not configured!
See: https://github.com/modelcontextprotocol/servers/tree/main/src/github
Trying GitHub CLI fallback...
```

**Step 3: Use Issue as Discovery Input**

- Title → Feature name
- Description → Problem statement and context
- Labels → Type/priority hints
- Comments → Additional requirements and discussion
- Linked issues → Dependencies

Extract from GitHub issue:

- Problem statement and context
- Acceptance criteria (if present)
- Technical notes (if present)
- Related issues/dependencies

## Process

## Discovery Phase

Understand the requirement by asking (use AskUserQuestion if needed):

**Problem Statement**

- What problem does this solve?
- Who experiences this problem?
- What's the current pain point?

**Desired Outcome**

- What should happen after this is built?
- How will users interact with it?
- What does success look like?

**Scope & Constraints**

- What's in scope vs. out of scope?
- Any technical constraints?
- Dependencies on other systems/features?

**Context Check**

- Search codebase for related features/modules
- Check for existing test files that might be relevant

## Key Principles

**From PRD World:**

- Start with user problems, not solutions
- Define success criteria upfront
- Understand constraints and scope

**From TDD World:**

- Make acceptance criteria test-ready
- Break work into small, testable pieces
- Each task should map to test(s)

## Integration with Other Commands

- **Before /plan**: Use `/spike` if you need technical exploration first
- **After /plan**: Use `/red` to start TDD on first task


## 🛡 Project Rules (Injected into every command)

1. **NO BROKEN BUILDS:**
   - Run `pnpm test` before every `/commit`
   - Ensure all tests pass
   - Fix any type errors immediately

2. **API DEVELOPMENT:**
   - All new APIs MUST have Zod request/response schemas
   - All APIs MUST be documented in both:
     - OpenAPI spec ([src/lib/openapi/](src/lib/openapi/))
     - API test manifest ([src/app/api-test/api-tests-manifest.json](src/app/api-test/api-tests-manifest.json))
   - Test ALL parameters and edge cases
   - Include code examples and real-world outputs

3. **TDD WORKFLOW:**
   - ALWAYS use /red → /green → /refactor cycle
   - NEVER write implementation without failing test first
   - Use /cycle for feature development
   - Use characterization tests for refactoring

4. **API KEY MANAGEMENT:**
   - Support three loading methods:
     - Server environment variables
     - NEXT_PUBLIC_ variables (client-side)
     - Custom headers (X-OpenAI-Key, X-Anthropic-Key, etc.)
   - Never hardcode API keys
   - Always validate key availability before use

5. **COMPREHENSIVE TESTING:**
   - When researching APIs, read actual implementation code
   - Discover ALL possible parameters (not just documented ones)
   - Test with various parameter combinations
   - Document custom headers, query params, request/response schemas
   - Include validation rules and testing notes

6. **NO UI BLOAT:**
   - This is an API project with minimal frontend
   - Only keep necessary test/documentation interfaces
   - Delete unused components immediately
   - No unnecessary UI libraries or features

7. **DOCUMENTATION:**
   - If you change an API, you MUST update:
     - OpenAPI spec
     - api-tests-manifest.json
     - Code examples
     - Testing notes
   - Document expected behavior and edge cases
   - Include real-world output examples