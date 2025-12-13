---
description: Create UI components or pages with 13-phase interview-driven workflow
argument-hint: [component-name]
---

# Hustle UI Create

**Version:** 3.9.0
**13-phase workflow for creating UI components and pages**

You are creating a UI element using the Hustle Together interview-driven workflow.

## Pre-Flight Check

Before starting, verify state file exists:
```bash
cat .claude/api-dev-state.json 2>/dev/null || echo "Creating new state file"
```

## Mode Selection

**MANDATORY: Ask user before proceeding:**

```
What would you like to create?

  A) Component - Isolated reusable UI component
     - Creates component in src/components/[Name]/
     - Adds to UI Showcase page
     - Tests via Storybook + Vitest

  B) Page - Full page that may use existing components
     - Creates page in src/app/[name]/
     - Selects components from registry
     - Tests via Playwright E2E

Please select A or B:
```

**Wait for user response. Do not proceed without explicit selection.**

Set `mode` based on response: "component" or "page"

---

# Component Mode (13 Phases)

## Phase 1: DISAMBIGUATION

**Goal:** Clarify component type and scope

Ask the user:
```
Phase 1: DISAMBIGUATION

What type of component is this?

  A) Atom - Basic building block (Button, Input, Icon, Badge)
  B) Molecule - Simple group of atoms (FormField, Card, SearchBar)
  C) Organism - Complex section (Header, Sidebar, DataTable, Modal)

Please select A, B, or C:
```

**Wait for user response.**

Update state:
```json
{
  "workflow": "ui-create-component",
  "element_name": "[component-name]",
  "element_type": "component",
  "ui_config": {
    "component_type": "[atom|molecule|organism]"
  },
  "phases": {
    "disambiguation": {
      "status": "complete",
      "component_type": "[selected]"
    }
  }
}
```

---

## Phase 2: SCOPE

**Goal:** Confirm understanding of component purpose

Based on the component name and type, present your understanding:

```
Phase 2: SCOPE CONFIRMATION

Based on your input, here's my understanding:

Component: [Name]
Type: [Atom/Molecule/Organism]
Purpose: [Your understanding of what this component does]

Expected Features:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Does this match your expectations?
  A) Yes, proceed
  B) No, let me clarify

Please select A or B:
```

**Wait for user response. Loop back if B selected.**

Update state with `phases.scope.status = "complete"`

---

## Phase 3: DESIGN RESEARCH

**Goal:** Research design patterns AND check brand guide

### Step 3a: Brand Guide Check

```
Phase 3: DESIGN RESEARCH

I found your brand guide at .claude/BRAND_GUIDE.md

If you need to update your brand guide, NOW is the time!
   1. Open .claude/BRAND_GUIDE.md
   2. Make your changes
   3. Save the file
   4. Then select option A below

Should I use the project brand guide?
  A) Yes, use brand guide (default) - I will apply these styles
  B) No, use different reference [provide URL or description]

Please select A or B:
```

**Wait for user response.**

If A: Read `.claude/BRAND_GUIDE.md` and note key values (colors, spacing, border-radius)
If B: Ask for URL or description

### Step 3b: Design Pattern Research

Perform 2-3 targeted searches:
1. `[component-name] component best practices accessibility`
2. `shadcn [component-name] implementation`
3. `radix [component-name] primitive`

Use Context7 for ShadCN/Radix documentation.

Document findings in state:
```json
{
  "phases": {
    "design_research": {
      "status": "complete",
      "brand_guide_applied": true,
      "sources": ["source1", "source2"]
    }
  }
}
```

---

## Phase 4: INTERVIEW

**Goal:** Deep dive into component requirements

Ask 5-10 questions based on research findings. Questions should be GENERATED from research, not template.

**Example questions (customize based on research):**

```
Phase 4: INTERVIEW

Based on my research, I have some questions about your [Component]:

Q1: Design System Base
    Which design system should I use?
    A) ShadCN - Use shadcn/ui components
    B) Radix - Use Radix primitives directly
    C) Custom - Build from scratch

Q2: Variants
    Which visual variants does this component need? (select all)
    [ ] Size (sm, md, lg)
    [ ] Color (primary, secondary, destructive)
    [ ] State (disabled, loading, error)

Q3: Accessibility Level
    What accessibility standard should we meet?
    A) WCAG 2.1 AA (standard)
    B) WCAG 2.1 AAA (enhanced)
    C) Basic (keyboard nav + aria labels only)

Q4: [Research-derived question about specific feature]

Q5: [Research-derived question about specific feature]
```

**Wait for all answers before proceeding.**

Store all decisions in state:
```json
{
  "phases": {
    "interview": {
      "status": "complete",
      "decisions": {
        "design_system": "shadcn",
        "variants": ["size", "color"],
        "accessibility": "wcag2aa"
      }
    }
  }
}
```

---

## Phase 5: COMPONENT ANALYSIS

**Goal:** Check for existing ShadCN components to use

If design system is ShadCN, check `src/components/ui/`:

```bash
ls -la src/components/ui/ 2>/dev/null || echo "No existing ShadCN components"
```

If components found:
```
Phase 5: COMPONENT ANALYSIS

Existing ShadCN Components Found:

  src/components/ui/
  ├── button.tsx
  ├── input.tsx
  ├── label.tsx
  └── card.tsx

Your [Component] could use: [Input, Label]

Would you like to use these existing components?
  A) Yes, use these (recommended)
  B) No, create new ones
  C) Some - let me specify

Please select:
```

**Wait for user response.**

Also check registry for custom components:
```bash
cat .claude/registry.json | jq '.components'
```

Update state with dependencies list.

---

## Phase 6: PROPS SCHEMA

**Goal:** Create TypeScript interface from interview answers

Based on interview decisions, create props interface:

```typescript
// src/components/[Name]/[Name].types.ts

export interface [Name]Props {
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'destructive';

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Loading state */
  loading?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Children content */
  children: React.ReactNode;

  /** Additional class names */
  className?: string;
}
```

Present to user:
```
Phase 6: PROPS SCHEMA

Here's the TypeScript interface I've created:

[Show interface]

Does this schema look correct?
  A) Yes, proceed
  B) No, needs changes [specify]

Please select:
```

**Wait for approval before proceeding.**

---

## Phase 7: ENVIRONMENT

**Goal:** Verify required packages and Storybook setup

Check for required packages:
```bash
cat package.json | jq '.dependencies, .devDependencies' | grep -E "radix|shadcn|class-variance|clsx|tailwind"
```

Check Storybook:
```bash
ls -la .storybook/ 2>/dev/null || echo "Storybook not configured"
```

If Storybook not found:
```
Phase 7: ENVIRONMENT CHECK

Storybook is not configured in this project.

Would you like me to initialize Storybook?
  A) Yes, run: npx storybook@latest init
  B) No, skip Storybook stories

Please select:
```

Report status:
```
Environment Check:
  Packages: [radix, class-variance-authority, clsx]
  Storybook: [Configured/Not configured]
  Tailwind: [Found/Not found]

Ready to proceed with TDD?
```

---

## Phase 8: TDD RED

**Goal:** Write failing tests and Storybook stories

### Create Test File

```typescript
// src/components/[Name]/__tests__/[Name].test.tsx

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { [Name] } from '../[Name]';

describe('[Name]', () => {
  it('renders children correctly', () => {
    render(<[Name]>Test Content</[Name]>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(<[Name] variant="primary">Test</[Name]>);
    expect(container.firstChild).toHaveClass('...');
  });

  it('handles disabled state', () => {
    render(<[Name] disabled>Test</[Name]>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading indicator when loading', () => {
    render(<[Name] loading>Test</[Name]>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
```

### Create Storybook Story

```typescript
// src/components/[Name]/[Name].stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { [Name] } from './[Name]';

const meta: Meta<typeof [Name]> = {
  title: 'Components/[Name]',
  component: [Name],
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'destructive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Primary [Name]' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary [Name]' },
};

export const Loading: Story = {
  args: { loading: true, children: 'Loading...' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};
```

### Run Tests (Expect Failure)

```bash
pnpm test src/components/[Name]
```

**Tests MUST fail at this point (component doesn't exist yet).**

Update state: `phases.tdd_red.status = "complete"`

---

## Phase 9: TDD GREEN

**Goal:** Implement component to pass tests

### Create Component Files

```typescript
// src/components/[Name]/[Name].tsx

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { [Name]Props } from './[Name].types';

const [name]Variants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export function [Name]({
  variant,
  size,
  loading,
  disabled,
  className,
  children,
  ...props
}: [Name]Props) {
  return (
    <button
      className={cn([name]Variants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}
```

### Create Barrel Export

```typescript
// src/components/[Name]/index.ts

export { [Name] } from './[Name]';
export type { [Name]Props } from './[Name].types';
```

### Run Tests (Expect Pass)

```bash
pnpm test src/components/[Name]
```

**All tests MUST pass before proceeding.**

Update state: `phases.tdd_green.status = "complete"`

---

## Phase 10: VERIFY (4-STEP MANDATORY)

**Goal:** Comprehensive verification across 4 dimensions

### Step 1: Responsive Check

Run Storybook at different viewports or use Playwright:

```
Step 1: Responsive Check

  Desktop (1920px):  [Checking...]
  Tablet (768px):    [Checking...]
  Mobile (375px):    [Checking...]
```

Verify component renders correctly at all sizes.

### Step 2: Brand Guide Match

Compare implementation to `.claude/BRAND_GUIDE.md`:

```
Step 2: Brand Guide Match

  Colors:        [Matches brand guide]
  Typography:    [Matches brand guide]
  Spacing:       [Matches brand guide]
  Border Radius: [Matches brand guide]
  Focus Ring:    [Matches brand guide]
```

### Step 3: All Tests Passed

```
Step 3: Test Results

  Unit tests:        [X/X passed]
  Storybook stories: [X/X render]
  A11y audit:        [WCAG 2.1 AA compliant]
```

Run accessibility audit:
```bash
pnpm dlx @axe-core/cli http://localhost:6006/iframe.html?id=components-[name]--primary
```

### Step 4: Performance Metrics

Log memory and re-renders:

```
Step 4: Performance Metrics

  Memory usage:           [X MB]
  Re-renders on mount:    [X]
  Re-renders on change:   [X]
  Bundle size impact:     [+X KB]
```

**Present 4-step results:**
```
Phase 10: VERIFICATION (4-Step)

Step 1: Responsive Check
  Desktop (1920px)  - Renders correctly
  Tablet (768px)    - Renders correctly
  Mobile (375px)    - Renders correctly

Step 2: Brand Guide Match
  Colors match .claude/BRAND_GUIDE.md
  Typography matches
  Spacing matches
  Border radius matches

Step 3: All Tests Passed
  Unit tests: 8/8 passed
  Storybook stories: 4/4 render
  A11y audit: WCAG 2.1 AA compliant

Step 4: Performance Metrics
  Memory usage: 2.1 MB
  Re-renders on mount: 1 (optimal)
  Re-renders on prop change: 1 (optimal)

All 4 checks passed!

Any issues to fix?
  A) No, all good - proceed
  B) Yes, need to fix [specify]
```

**Wait for user response. Loop back if issues found.**

---

## Phase 11: TDD REFACTOR

**Goal:** Clean up code while tests pass

Refactoring checklist:
- [ ] Extract repeated logic to custom hooks
- [ ] Optimize re-renders with useMemo/useCallback if needed
- [ ] Clean up unused imports
- [ ] Ensure consistent code style
- [ ] Add JSDoc comments to exported functions

Run tests after each refactor:
```bash
pnpm test src/components/[Name]
```

---

## Phase 12: DOCUMENTATION

**Goal:** Complete all documentation

### Storybook Autodocs

Ensure `tags: ['autodocs']` is set in story meta.

### JSDoc Comments

Add to component file:
```typescript
/**
 * [Name] component - [Brief description]
 *
 * @example
 * ```tsx
 * <[Name] variant="primary" size="md">
 *   Click me
 * </[Name]>
 * ```
 */
```

### Registry Entry

Update `.claude/registry.json`:
```json
{
  "components": {
    "[name]": {
      "name": "[Name]",
      "description": "[From interview]",
      "file": "src/components/[Name]/[Name].tsx",
      "story": "src/components/[Name]/[Name].stories.tsx",
      "tests": "src/components/[Name]/__tests__/",
      "props_interface": "[Name]Props",
      "variants": ["primary", "secondary"],
      "accessibility": "wcag2aa",
      "responsive": true,
      "status": "complete",
      "created_at": "[date]"
    }
  }
}
```

Present checklist:
```
Phase 12: DOCUMENTATION

  Storybook autodocs: [Complete]
  JSDoc comments:     [Complete]
  Types exported:     [Complete]
  Registry updated:   [Complete]

Documentation complete?
  A) Yes, proceed to completion
  B) No, need changes
```

---

## Phase 13: COMPLETION

**Goal:** Final output and continuation prompt

### Update UI Showcase

If first component, create showcase page. Otherwise, component is auto-added via registry.

### Final Output

```
[Name] component complete!

Created Files:
  - src/components/[Name]/[Name].tsx
  - src/components/[Name]/[Name].types.ts
  - src/components/[Name]/[Name].stories.tsx
  - src/components/[Name]/__tests__/[Name].test.tsx
  - src/components/[Name]/index.ts

Tests: All passed (ran during Phase 8-9)
A11y: WCAG 2.1 AA compliant
Brand: Matches .claude/BRAND_GUIDE.md

Registry: Added to .claude/registry.json

Would you like to create another component or page?
```

### Showcase Redirect

After successful component/page creation, output:

```
Your [component|page] has been added to the showcase!

View it at: http://localhost:3000/ui-showcase

Or run `pnpm dev` and navigate to /ui-showcase to:
  - Preview your component with live editing (Sandpack)
  - Test different variants and props
  - View at different viewport sizes
```

For Sandpack live editing, install: `pnpm add @codesandbox/sandpack-react`

Update state: `phases.completion.status = "complete"`

---

# Page Mode (13 Phases)

Similar flow with these differences:

- **Phase 5:** Select components FROM registry instead of checking ShadCN
- **Phase 6:** Create page data schema (API responses, form data)
- **Phase 7:** Check API routes and auth configuration
- **Phase 8:** Write Playwright E2E tests instead of Storybook stories
- **Phase 9:** Create page in `src/app/[name]/page.tsx`
- **Phase 10:** Run full Playwright E2E tests

See full page mode documentation in `/hustle-ui-create-page.md` (if implementing page mode).

---

## State File Structure

```json
{
  "version": "3.9.0",
  "workflow": "ui-create-component",
  "active_element": "[name]",
  "elements": {
    "[name]": {
      "type": "component",
      "status": "in_progress",
      "started_at": "2025-12-12T15:30:00Z",
      "ui_config": {
        "mode": "component",
        "component_type": "atom",
        "design_system": "shadcn",
        "variants": ["size", "color"],
        "accessibility_level": "wcag2aa",
        "use_brand_guide": true
      },
      "phases": {
        "disambiguation": { "status": "complete" },
        "scope": { "status": "complete" },
        "design_research": { "status": "complete", "brand_guide_applied": true },
        "interview": { "status": "complete", "decisions": {} },
        "component_analysis": { "status": "complete", "dependencies": [] },
        "props_schema": { "status": "complete", "schema_file": "..." },
        "environment_check": { "status": "complete" },
        "tdd_red": { "status": "complete", "tests_failed": true },
        "tdd_green": { "status": "complete", "tests_passed": true },
        "verify": { "status": "complete", "four_step_passed": true },
        "tdd_refactor": { "status": "complete" },
        "documentation": { "status": "complete" },
        "completion": { "status": "complete" }
      }
    }
  }
}
```

---

## Key Principles

1. **ALWAYS ask user** - Never proceed without explicit response
2. **Brand guide first** - Check and apply before implementation
3. **ShadCN detection** - Reuse existing components when available
4. **4-Step verification** - All 4 checks MUST pass
5. **Tests run automatically** - LLM executes tests, user sees results
6. **Showcase link guaranteed** - Always output at completion

---

**Version:** 3.9.0
**Last Updated:** 2025-12-12
