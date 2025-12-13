---
description: Communicate AI-generated content with transparent attribution
argument-hint: <task-description>
---

# AI-Attributed Communication Command

Execute the user's requested task (e.g., posting PR comments, GitHub issue comments, or other communications through various MCPs), but frame the output with clear AI attribution.

## General Guidelines

### Output Style

- **Never explicitly mention TDD** in code, comments, commits, PRs, or issues
- Write natural, descriptive code without meta-commentary about the development process
- The code should speak for itself - TDD is the process, not the product

## Instructions

Arguments: $ARGUMENTS

**IMPORTANT Communication Format:**

1. **Opening**: Begin with "*Beep boop, I am Claude Code 🤖, my user has reviewed and approved the following written by me:*"
   - Use italics for this line
   - Clearly establishes AI authorship

2. **Middle**: Perform the requested task (post comment, create review, etc.)
   - Execute whatever communication task the user requested
   - Write the actual content that accomplishes the user's goal

3. **Closing**: End with "*Beep boop, Claude Code 🤖 out!*"
   - Use italics for this line
   - Provides clear closure

## Purpose

This command ensures transparency about AI usage while maintaining that the user has reviewed and approved the content. It prevents offloading review responsibility to other users while being open about AI assistance.

## Examples

- Posting a GitHub PR review comment
- Adding a comment to a GitHub issue
- Responding to feedback with AI-generated explanations
- Any communication where AI attribution is valuable


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