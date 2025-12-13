---
description: Guide for creating new slash commands
argument-hint: <command-name> <description>
---

## General Guidelines

### Output Style

- **Never explicitly mention TDD** in code, comments, commits, PRs, or issues
- Write natural, descriptive code without meta-commentary about the development process
- The code should speak for itself - TDD is the process, not the product

# Slash Command Creator Guide

## How This Command Works

The `/add-command` command shows this guide for creating new slash commands. It includes:

- Command structure and syntax
- Common patterns and examples
- Security restrictions and limitations
- Frontmatter options

**Note for AI**: When creating commands, you CAN use bash tools like `Bash(mkdir:*)`, `Bash(ls:*)`, `Bash(git status:*)` in the `allowed-tools` frontmatter of NEW commands - but ONLY for operations within the current project directory. This command itself doesn't need bash tools since it's just documentation.

## Command Locations

- **Personal**: `~/.claude/commands/` (available across all projects)
- **Project**: `.claude/commands/` (shared with team, shows "(project)")

## Basic Structure

```markdown
---
allowed-tools: Read, Glob, Grep, Bash(git status:*), Task
description: Brief description of what this command does
argument-hint: [required-arg] [optional-arg]
---

# Command Title

Your command instructions here.

Arguments: $ARGUMENTS

File reference: @path/to/file.js

Bash command output: (exclamation)git status(backticks)
```

## ⚠️ Security Restrictions

**Bash Commands (exclamation prefix)**: Limited to current working directory only.

- ✅ Works: `! + backtick + git status + backtick` (in project dir)
- ❌ Blocked: `! + backtick + ls /outside/project + backtick` (outside project)  
- ❌ Blocked: `! + backtick + pwd + backtick` (if referencing dirs outside project)

**File References (`@` prefix)**: No directory restrictions.

- ✅ Works: `@/path/to/system/file.md`
- ✅ Works: `@../other-project/file.js`

## Common Patterns

### Simple Command

```bash
echo "Review this code for bugs and suggest fixes" > ~/.claude/commands/review.md
```

### Command with Arguments

**Note for AI**: The example below uses a fullwidth dollar sign (＄, U+FF04) to prevent interpolation in this documentation. When creating actual commands, use the regular `$` character.

```markdown
Fix issue ＄ARGUMENTS following our coding standards
```

### Command with File References

```markdown
Compare @src/old.js with @src/new.js and explain differences
```

### Command with Bash Output (Project Directory Only)

```markdown
---
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*)
---
Current status: (!)git status(`)
Current branch: (!)git branch --show-current(`)
Recent commits: (!)git log --oneline -5(`)

Create commit for these changes.
```

**Note**: Only works with commands in the current project directory.

### Namespaced Command

**Note for AI**: The example below uses a fullwidth dollar sign (＄, U+FF04) to prevent interpolation in this documentation. When creating actual commands, use the regular `$` character.

```bash
mkdir -p ~/.claude/commands/ai
echo "Ask GPT-5 about: ＄ARGUMENTS" > ~/.claude/commands/ai/gpt5.md
# Creates: /ai:gpt5
```

## Frontmatter Options

- `allowed-tools`: Tools this command can use
  - **Important**: Intrusive tools like `Write`, `Edit`, `NotebookEdit` should NEVER be allowed in commands unless the user explicitly requests them. These tools modify files and should only be used when the command's purpose is to make changes.
  - ✅ Safe for most commands: `Read`, `Glob`, `Grep`, `Bash(git status:*)`, `Task`, `AskUserQuestion`
- `description`: Brief description (shows in /help)
- `argument-hint`: Help text for arguments
- `model`: Specific model to use

## Best Practices

### Safe Commands (No Security Issues)

```markdown
# System prompt editor (file reference only)  
(@)path/to/system/prompt.md

Edit your system prompt above.
```

### Project-Specific Commands (Bash OK)

```markdown
---
allowed-tools: Bash(git status:*), Bash(npm list:*)
---
Current git status: (!)git status(`)
Package info: (!)npm list --depth=0(`)

Review project state and suggest next steps.
```

### Cross-Directory File Access (Use @ not !)

```markdown
# Compare config files
Compare (@)path/to/system.md with (@)project/config.md

Show differences and suggest improvements.
```

## Usage

After creating: `/<command-name> [arguments]`

Example: `/review` or `/ai:gpt5 "explain this code"`


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