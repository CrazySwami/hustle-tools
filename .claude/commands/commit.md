---
description: Create a git commit following project standards
argument-hint: [optional-commit-description]
---

## General Guidelines

### Output Style

- **Never explicitly mention TDD** in code, comments, commits, PRs, or issues
- Write natural, descriptive code without meta-commentary about the development process
- The code should speak for itself - TDD is the process, not the product

Create a git commit following project standards

Include any of the following info if specified: $ARGUMENTS

## Process

1. Run `git status` and `git diff` to review changes
2. Run `git log --oneline -5` to see recent commit style
3. Stage relevant files with `git add`
4. Create commit with descriptive message
5. Verify with `git status`

## Example

```bash
git add <files>
git commit -m "feat(#123): add validation to user input form"
```


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