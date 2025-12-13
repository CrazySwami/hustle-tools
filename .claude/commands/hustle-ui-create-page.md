---
description: Create Next.js pages with 13-phase interview-driven workflow
argument-hint: [page-name]
---

# Hustle UI Create - Page Mode

**Version:** 3.10.0
**13-phase workflow for creating Next.js App Router pages**

You are creating a page using the Hustle Together interview-driven workflow.

## Pre-Flight Check

Before starting, verify state file exists:
```bash
cat .claude/api-dev-state.json 2>/dev/null || echo "Creating new state file"
```

Initialize state for page creation:
```json
{
  "workflow": "ui-create-page",
  "element_name": "[page-name]",
  "element_type": "page"
}
```

---

# Phase 1: DISAMBIGUATION

**Goal:** Clarify page type and purpose

Ask the user:
```
Phase 1: DISAMBIGUATION

What type of page is this?

  A) Landing Page - Marketing/showcase page with hero, features, CTA
  B) Dashboard - Data display with metrics, charts, tables
  C) Form Page - User input form (create, edit, settings)
  D) List/Grid - Display collection of items (search, filter, paginate)
  E) Detail Page - Single item view (profile, product, article)
  F) Auth Page - Login, register, password reset
  G) Other - [describe]

Please select A-G:
```

**Wait for user response.**

Update state:
```json
{
  "phases": {
    "disambiguation": {
      "status": "complete",
      "page_type": "[landing|dashboard|form|list|detail|auth|other]"
    }
  }
}
```

---

# Phase 2: SCOPE

**Goal:** Confirm understanding of page purpose and route structure

Based on the page name and type, present your understanding:

```
Phase 2: SCOPE CONFIRMATION

Based on your input, here's my understanding:

Page: [Name]
Type: [Landing/Dashboard/Form/List/Detail/Auth]
Route: /[name] (or /[name]/[id] for detail pages)

Purpose: [Your understanding of what this page does]

Expected Sections:
- [Section 1]
- [Section 2]
- [Section 3]

Data Requirements:
- [Data source 1]
- [Data source 2]

Does this match your expectations?
  A) Yes, proceed
  B) No, let me clarify

Please select A or B:
```

**Wait for user response. Loop back if B selected.**

Update state with `phases.scope.status = "complete"`

---

# Phase 3: DESIGN RESEARCH

**Goal:** Research Next.js App Router patterns and check brand guide

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
  A) Yes, use brand guide (default)
  B) No, use different reference [provide URL or description]

Please select A or B:
```

**Wait for user response.**

### Step 3b: Next.js Pattern Research

Perform 2-3 targeted searches based on page type:

**For Landing Pages:**
1. `Next.js 15 landing page best practices`
2. `shadcn landing page components hero section`
3. `responsive landing page layout App Router`

**For Dashboards:**
1. `Next.js 15 dashboard layout App Router`
2. `shadcn dashboard components data table`
3. `Recharts React charts dashboard`

**For Form Pages:**
1. `Next.js 15 server actions form handling`
2. `react-hook-form zod validation`
3. `shadcn form components`

**For List Pages:**
1. `Next.js 15 pagination App Router`
2. `shadcn data table filtering sorting`
3. `server-side pagination searchParams`

**For Detail Pages:**
1. `Next.js 15 dynamic routes [id] App Router`
2. `generateStaticParams ISR`
3. `optimistic updates detail page`

Use Context7 for Next.js and ShadCN documentation.

Document findings in state:
```json
{
  "phases": {
    "design_research": {
      "status": "complete",
      "brand_guide_applied": true,
      "sources": ["source1", "source2"],
      "patterns_found": ["pattern1", "pattern2"]
    }
  }
}
```

---

# Phase 4: INTERVIEW

**Goal:** Deep dive into page requirements

Ask 5-10 questions based on research findings. Questions should be GENERATED from research, not templates.

**Example questions for Dashboard page:**

```
Phase 4: INTERVIEW

Based on my research, I have some questions about your [Page]:

Q1: Data Fetching Strategy
    How should data be fetched?
    A) Server Components - Fetch on server (recommended for static data)
    B) Client Components - Fetch with SWR/TanStack Query (real-time updates)
    C) Hybrid - Server for initial, client for updates

Q2: Layout Structure
    What layout should this page use?
    A) Full width - No sidebar, content spans full width
    B) Sidebar layout - Fixed sidebar with scrollable content
    C) Nested layout - Inherit from parent layout

Q3: Authentication
    What authentication is required?
    A) Public - No auth required
    B) Protected - Must be logged in
    C) Role-based - Specific roles only

Q4: SEO Requirements
    What SEO metadata is needed?
    A) Basic - Title and description
    B) Full - Open Graph, Twitter cards, JSON-LD
    C) None - Dashboard/internal page

Q5: [Research-derived question about specific feature]

Q6: [Research-derived question about specific feature]
```

**Wait for all answers before proceeding.**

Store all decisions in state:
```json
{
  "phases": {
    "interview": {
      "status": "complete",
      "decisions": {
        "data_fetching": "server",
        "layout": "sidebar",
        "auth": "protected",
        "seo": "basic"
      }
    }
  }
}
```

---

# Phase 5: PAGE ANALYSIS

**Goal:** Check registry for reusable components

Check existing components in registry:

```bash
cat .claude/registry.json | jq '.components'
```

Also check for existing pages with similar patterns:

```bash
cat .claude/registry.json | jq '.pages'
```

Present findings:
```
Phase 5: PAGE ANALYSIS

Existing Components Available:

From Registry:
  - Button (primary, secondary, destructive)
  - Card (header, content, footer)
  - DataTable (sorting, filtering, pagination)
  - Modal (confirm, form, custom)

Your [Page] could use:
  - [Component 1] - for [purpose]
  - [Component 2] - for [purpose]
  - [Component 3] - for [purpose]

Would you like to use these existing components?
  A) Yes, use all recommended
  B) Some - let me specify which
  C) None - create new components

Please select:
```

**Wait for user response.**

Update state with selected components list.

---

# Phase 6: DATA SCHEMA

**Goal:** Define TypeScript interfaces for page data

Based on interview decisions, create data schemas:

```typescript
// src/app/[name]/_types/index.ts

// API Response Types
export interface [Name]PageData {
  /** Page title */
  title: string;

  /** Main content items */
  items: [Name]Item[];

  /** Pagination info */
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface [Name]Item {
  id: string;
  // ... other fields based on interview
}

// Form Data Types (if applicable)
export interface [Name]FormData {
  // ... form fields based on interview
}

// Search/Filter Types (if applicable)
export interface [Name]Filters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  // ... other filters
}
```

Present to user:
```
Phase 6: DATA SCHEMA

Here are the TypeScript interfaces I've created:

[Show interfaces]

Do these schemas look correct?
  A) Yes, proceed
  B) No, needs changes [specify]

Please select:
```

**Wait for approval before proceeding.**

---

# Phase 7: ENVIRONMENT

**Goal:** Verify API routes and required packages

### Check API Routes

```bash
ls -la src/app/api/v2/ 2>/dev/null | head -20
```

If page requires API routes that don't exist:
```
Phase 7: ENVIRONMENT CHECK

API Routes Required:
  GET /api/v2/[name]     - [Exists/Missing]
  POST /api/v2/[name]    - [Exists/Missing]
  PUT /api/v2/[name]/:id - [Exists/Missing]

Missing routes found! Options:
  A) Create them now using /api-create
  B) Skip - I'll create them later
  C) Use different API - [specify]

Please select:
```

### Check Auth Configuration

```bash
grep -r "middleware" src/ 2>/dev/null | head -5
cat middleware.ts 2>/dev/null | head -20
```

### Check Required Packages

```bash
cat package.json | jq '.dependencies, .devDependencies' | grep -E "next-auth|@tanstack|swr|recharts|@playwright"
```

Report status:
```
Environment Check:
  API Routes: [X/Y available]
  Auth Config: [Configured/Not configured]
  Playwright: [Installed/Not installed]

Ready to proceed with TDD?
```

---

# Phase 8: TDD RED

**Goal:** Write failing Playwright E2E tests

### Create Test File

```typescript
// src/app/[name]/__tests__/[name].e2e.test.ts

import { test, expect } from '@playwright/test';

test.describe('[Name] Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/[name]');
  });

  // Basic Rendering Tests
  test('page loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/[Name]/);
    await expect(page.locator('h1')).toContainText('[Expected Title]');
  });

  test('displays main content section', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  // Data Display Tests (for List/Dashboard)
  test('displays data items', async ({ page }) => {
    await expect(page.locator('[data-testid="item-card"]')).toHaveCount.greaterThan(0);
  });

  // Form Tests (for Form pages)
  test('form validation works', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.getByText('Required field')).toBeVisible();
  });

  test('form submission works', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Success')).toBeVisible();
  });

  // Navigation Tests
  test('navigation works correctly', async ({ page }) => {
    await page.click('a[href="/[name]/details"]');
    await expect(page).toHaveURL(/\/[name]\/details/);
  });

  // Responsive Tests
  test('mobile layout works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  // Auth Tests (if protected)
  test('redirects to login when unauthenticated', async ({ page }) => {
    // Clear auth state
    await page.context().clearCookies();
    await page.goto('/[name]');
    await expect(page).toHaveURL(/\/login/);
  });

  // Performance Tests
  test('page loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/[name]');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 second budget
  });
});
```

### Run Tests (Expect Failure)

```bash
pnpm playwright test src/app/[name]
```

**Tests MUST fail at this point (page doesn't exist yet).**

Update state: `phases.tdd_red.status = "complete"`

---

# Phase 9: TDD GREEN

**Goal:** Implement page to pass tests

### Create Page Structure

```
src/app/[name]/
├── page.tsx           # Main page component
├── layout.tsx         # Optional layout
├── loading.tsx        # Loading state
├── error.tsx          # Error boundary
├── _components/       # Page-specific components
│   ├── [Name]Header.tsx
│   ├── [Name]Content.tsx
│   └── [Name]Sidebar.tsx
├── _types/
│   └── index.ts       # TypeScript interfaces
├── _lib/
│   └── actions.ts     # Server actions (if needed)
└── __tests__/
    └── [name].e2e.test.ts
```

### Create Main Page

```typescript
// src/app/[name]/page.tsx

import { Metadata } from 'next';
import { [Name]Header } from './_components/[Name]Header';
import { [Name]Content } from './_components/[Name]Content';

export const metadata: Metadata = {
  title: '[Name] | Your App',
  description: '[Page description from interview]',
};

// Server Component - data fetching
async function get[Name]Data() {
  const res = await fetch(`${process.env.API_URL}/api/v2/[name]`, {
    cache: 'no-store', // or 'force-cache' based on interview
  });
  return res.json();
}

export default async function [Name]Page() {
  const data = await get[Name]Data();

  return (
    <main className="container mx-auto py-8">
      <[Name]Header />
      <[Name]Content data={data} />
    </main>
  );
}
```

### Create Loading State

```typescript
// src/app/[name]/loading.tsx

import { Skeleton } from '@/components/ui/skeleton';

export default function [Name]Loading() {
  return (
    <main className="container mx-auto py-8">
      <Skeleton className="h-12 w-64 mb-8" />
      <div className="grid gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </main>
  );
}
```

### Create Error Boundary

```typescript
// src/app/[name]/error.tsx

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function [Name]Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container mx-auto py-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={() => reset()}>Try again</Button>
    </main>
  );
}
```

### Run Tests (Expect Pass)

```bash
pnpm playwright test src/app/[name]
```

**All tests MUST pass before proceeding.**

Update state: `phases.tdd_green.status = "complete"`

---

# Phase 10: VERIFY (4-STEP MANDATORY)

**Goal:** Comprehensive verification across 4 dimensions

### Step 1: Responsive Check

Run Playwright at different viewports:

```bash
pnpm playwright test src/app/[name] --project=mobile --project=tablet --project=desktop
```

```
Step 1: Responsive Check

  Desktop (1920px):  [Checking...]
  Tablet (768px):    [Checking...]
  Mobile (375px):    [Checking...]
```

### Step 2: Data Flow Check

Verify data flows correctly from API to UI:

```
Step 2: Data Flow Check

  API Response:      [Valid JSON]
  Server Component:  [Data received]
  Client Render:     [Data displayed]
  Error Handling:    [Error boundary works]
  Loading State:     [Skeleton shows]
```

### Step 3: All Tests Passed

```
Step 3: Test Results

  E2E tests:         [X/X passed]
  Navigation tests:  [X/X passed]
  Form tests:        [X/X passed] (if applicable)
  Auth tests:        [X/X passed] (if applicable)
```

### Step 4: Performance Metrics

Check page performance:

```bash
pnpm lighthouse http://localhost:3000/[name] --output json
```

```
Step 4: Performance Metrics

  First Contentful Paint:   [< 1.8s]
  Largest Contentful Paint: [< 2.5s]
  Time to Interactive:      [< 3.8s]
  Total Blocking Time:      [< 200ms]
  Cumulative Layout Shift:  [< 0.1]
```

**Present 4-step results:**
```
Phase 10: VERIFICATION (4-Step)

Step 1: Responsive Check
  Desktop (1920px)  - Renders correctly
  Tablet (768px)    - Renders correctly
  Mobile (375px)    - Renders correctly

Step 2: Data Flow Check
  API → Server → Client flow verified
  Error boundary tested
  Loading state works

Step 3: All Tests Passed
  E2E tests: 15/15 passed
  Coverage: Core user flows covered

Step 4: Performance Metrics
  LCP: 1.2s (Good)
  FCP: 0.8s (Good)
  CLS: 0.02 (Good)

All 4 checks passed!

Any issues to fix?
  A) No, all good - proceed
  B) Yes, need to fix [specify]
```

**Wait for user response. Loop back if issues found.**

---

# Phase 11: TDD REFACTOR

**Goal:** Clean up code while tests pass

Refactoring checklist:
- [ ] Extract repeated components to `_components/`
- [ ] Move data fetching to dedicated functions
- [ ] Extract server actions to `_lib/actions.ts`
- [ ] Optimize images with next/image
- [ ] Add proper error boundaries
- [ ] Implement proper loading states
- [ ] Extract types to `_types/`

Run tests after each refactor:
```bash
pnpm playwright test src/app/[name]
```

---

# Phase 12: DOCUMENTATION

**Goal:** Complete all documentation

### Page Documentation

Create or update:
```typescript
// src/app/[name]/README.md (optional)

# [Name] Page

## Route
`/[name]`

## Purpose
[From interview]

## Data Requirements
- API: `/api/v2/[name]`
- Auth: [Protected/Public]

## Components Used
- [Component 1]
- [Component 2]

## Testing
```bash
pnpm playwright test src/app/[name]
```
```

### Registry Entry

Update `.claude/registry.json`:
```json
{
  "pages": {
    "[name]": {
      "name": "[Name]",
      "description": "[From interview]",
      "route": "/[name]",
      "file": "src/app/[name]/page.tsx",
      "type": "[landing|dashboard|form|list|detail|auth]",
      "tests": "src/app/[name]/__tests__/",
      "components_used": ["Button", "Card", "DataTable"],
      "data_sources": ["/api/v2/[name]"],
      "auth_required": true,
      "seo": {
        "title": "[Name] | App",
        "description": "[Description]"
      },
      "status": "complete",
      "created_at": "[date]"
    }
  }
}
```

Present checklist:
```
Phase 12: DOCUMENTATION

  Page README:      [Complete]
  Route documented: [Complete]
  Registry updated: [Complete]
  SEO metadata:     [Complete]

Documentation complete?
  A) Yes, proceed to completion
  B) No, need changes
```

---

# Phase 13: COMPLETION

**Goal:** Final output and showcase integration

### Update UI Showcase

Page is auto-added to UI Showcase via registry update hook.

### Final Output

```
[Name] page complete!

Created Files:
  - src/app/[name]/page.tsx
  - src/app/[name]/layout.tsx (if needed)
  - src/app/[name]/loading.tsx
  - src/app/[name]/error.tsx
  - src/app/[name]/_components/[Name]Header.tsx
  - src/app/[name]/_components/[Name]Content.tsx
  - src/app/[name]/_types/index.ts
  - src/app/[name]/__tests__/[name].e2e.test.ts

Route: /[name]
Auth: [Protected/Public]

Tests: All 15 E2E tests passed
Performance: LCP 1.2s, FCP 0.8s (within budget)

Registry: Added to .claude/registry.json

Would you like to create another page or component?
```

### Showcase Redirect

```
Your page has been added to the showcase!

View it at: http://localhost:3000/ui-showcase

The page preview card shows:
  - Screenshot
  - Route link
  - Data sources
  - Components used

Run `pnpm dev` and navigate to /ui-showcase to see it.
```

Update state: `phases.completion.status = "complete"`

---

# State File Structure

```json
{
  "version": "3.10.0",
  "workflow": "ui-create-page",
  "active_element": "[name]",
  "elements": {
    "[name]": {
      "type": "page",
      "status": "in_progress",
      "started_at": "2025-12-12T15:30:00Z",
      "ui_config": {
        "mode": "page",
        "page_type": "dashboard",
        "route": "/[name]",
        "auth_required": true,
        "data_fetching": "server",
        "layout": "sidebar",
        "seo_level": "full"
      },
      "phases": {
        "disambiguation": { "status": "complete", "page_type": "dashboard" },
        "scope": { "status": "complete" },
        "design_research": { "status": "complete", "brand_guide_applied": true },
        "interview": { "status": "complete", "decisions": {} },
        "page_analysis": { "status": "complete", "components_selected": [] },
        "data_schema": { "status": "complete", "schema_file": "..." },
        "environment_check": { "status": "complete", "api_routes_verified": true },
        "tdd_red": { "status": "complete", "tests_written": 15 },
        "tdd_green": { "status": "complete", "tests_passed": 15 },
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

# Hooks That Enforce This Workflow

| Phase | Hook | Purpose |
|-------|------|---------|
| 1 | `enforce-ui-disambiguation.py` | Validates page type selection |
| 3 | `enforce-brand-guide.py` | Ensures brand guide is checked |
| 4 | `enforce-ui-interview.py` | Injects interview decisions |
| 5 | `enforce-page-components.py` | Checks registry for components |
| 6 | `enforce-page-data-schema.py` | Validates data types defined |
| 7 | `check-api-routes.py` | Verifies required API routes |
| 8 | `check-playwright-setup.py` | Ensures Playwright is configured |
| 10 | `verify-after-green.py` | Triggers 4-step verification |
| 12 | `update-registry.py` | Adds page to registry |
| 12 | `update-ui-showcase.py` | Updates showcase |
| 13 | `api-workflow-check.py` | Blocks if incomplete |

---

# Key Principles

1. **ALWAYS ask user** - Never proceed without explicit response
2. **Brand guide first** - Check and apply before implementation
3. **Component reuse** - Check registry before creating new components
4. **4-Step verification** - All 4 checks MUST pass
5. **Playwright E2E** - Full page tests, not unit tests
6. **Performance budget** - LCP < 2.5s, FCP < 1.8s
7. **Showcase link guaranteed** - Always output at completion

---

**Version:** 3.10.0
**Last Updated:** 2025-12-12
