---
description: Creates a pull request using GitHub MCP
argument-hint: [optional-pr-title-and-description]
---

# Create Pull Request

## General Guidelines

### Output Style

- **Never explicitly mention TDD** in code, comments, commits, PRs, or issues
- Write natural, descriptive code without meta-commentary about the development process
- The code should speak for itself - TDD is the process, not the product

Create a pull request for the current branch using GitHub MCP tools.

## Workflow

Current branch status:
!`git status`

Recent commits:
!`git log --oneline -5`

Arguments: $ARGUMENTS

**Process:**

1. **Ensure Branch is Ready**:
   !`git status`
   - Commit all changes
   - Push to remote: `git push origin [branch-name]`

2. **Create PR**: Create a well-formatted pull request

   Title: conventional commits format, like `feat(#123): add user authentication`

   Description template:

   ```markdown
   <!--
     Are there any relevant issues / PRs / mailing lists discussions?
     Please reference them here.
   -->

   ## References

   - [links to github issues referenced in commit messages]

   ## Summary

   [Brief description of changes]

   ## Test Plan

   - [ ] Tests pass
   - [ ] Manual testing completed
   ```

3. **Set Base Branch**: Default to main unless specified otherwise

4. **Link Issues**: Reference related issues found in commit messages

## Use GitHub MCP Tools

1. Check current branch and ensure it's pushed
2. Create a well-formatted pull request with proper title and description
3. Set the base branch (default: main)
4. Include relevant issue references if found in commit messages


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