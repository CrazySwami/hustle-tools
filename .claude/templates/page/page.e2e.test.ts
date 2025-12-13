import { test, expect } from '@playwright/test';

/**
 * E2E Tests for __PAGE_NAME__ Page
 *
 * Created with Hustle UI Create workflow (v3.9.0)
 *
 * Run with: pnpm playwright test __PAGE_ROUTE__.spec.ts
 */
test.describe('__PAGE_NAME__ Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page before each test
    await page.goto('/__PAGE_ROUTE__');
  });

  // ===================================
  // Basic Rendering Tests
  // ===================================

  test('should load successfully', async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle(/__PAGE_TITLE__/);
  });

  test('should display page heading', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('__PAGE_TITLE__');
  });

  test('should display page description', async ({ page }) => {
    const description = page.getByText('__PAGE_DESCRIPTION__');
    await expect(description).toBeVisible();
  });

  // ===================================
  // Responsive Tests
  // ===================================

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/__PAGE_ROUTE__');

    // Verify main content is visible
    await expect(page.getByRole('main')).toBeVisible();

    // Verify no horizontal scroll
    const body = await page.locator('body');
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/__PAGE_ROUTE__');

    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/__PAGE_ROUTE__');

    await expect(page.getByRole('main')).toBeVisible();
  });

  // ===================================
  // Accessibility Tests
  // ===================================

  test('should have no accessibility violations', async ({ page }) => {
    // Note: Requires @axe-core/playwright
    // const results = await new AxeBuilder({ page }).analyze();
    // expect(results.violations).toEqual([]);

    // Basic accessibility checks
    // All images should have alt text
    const images = await page.getByRole('img').all();
    for (const img of images) {
      await expect(img).toHaveAttribute('alt');
    }

    // All buttons should have accessible names
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      const name = await button.getAttribute('aria-label') || await button.textContent();
      expect(name?.trim()).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  // ===================================
  // Performance Tests (TDD GATES)
  // These thresholds match .claude/performance-budgets.json
  // Tests FAIL if exceeded, triggering TDD loop-back
  // ===================================

  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/__PAGE_ROUTE__', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // THRESHOLD: Page load max 3000ms
    // If this fails, optimize: code splitting, lazy loading, reduce bundle
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have acceptable memory usage', async ({ page }) => {
    await page.goto('/__PAGE_ROUTE__');

    // Get Chromium-specific metrics
    const client = await page.context().newCDPSession(page);
    const metrics = await client.send('Performance.getMetrics');

    const jsHeapSize = metrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0;
    const domNodes = metrics.metrics.find(m => m.name === 'Nodes')?.value || 0;

    // THRESHOLD: Memory max 50MB
    // If this fails, check for: memory leaks, large state, unbounded lists
    expect(jsHeapSize).toBeLessThan(50 * 1024 * 1024);

    // THRESHOLD: DOM nodes max 1500
    // If this fails, check for: unnecessary renders, infinite lists without virtualization
    expect(domNodes).toBeLessThan(1500);
  });

  test('should not have layout thrashing', async ({ page }) => {
    await page.goto('/__PAGE_ROUTE__');

    const client = await page.context().newCDPSession(page);
    const metrics = await client.send('Performance.getMetrics');

    const layoutCount = metrics.metrics.find(m => m.name === 'LayoutCount')?.value || 0;
    const layoutDuration = metrics.metrics.find(m => m.name === 'LayoutDuration')?.value || 0;

    // THRESHOLD: Layout count max 10
    // If this fails, batch DOM updates, use CSS transforms instead of layout properties
    expect(layoutCount).toBeLessThan(10);

    // THRESHOLD: Layout duration max 100ms
    expect(layoutDuration * 1000).toBeLessThan(100);
  });

  test('should meet Core Web Vitals', async ({ page }) => {
    await page.goto('/__PAGE_ROUTE__');

    // Get paint timing
    const paintTiming = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      return {
        fcp: entries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
      };
    });

    // THRESHOLD: First Contentful Paint max 1500ms
    // If this fails, optimize critical rendering path
    expect(paintTiming.fcp).toBeLessThan(1500);

    // Get LCP via PerformanceObserver result (if available)
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry?.startTime || 0);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // Timeout fallback
        setTimeout(() => resolve(0), 3000);
      });
    });

    // THRESHOLD: Largest Contentful Paint max 2500ms
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2500);
    }
  });

  // ===================================
  // Feature-Specific Tests
  // ===================================

  // TODO: Add tests for specific page features
  // Example:
  // test('should display user data when logged in', async ({ page }) => {
  //   // Setup auth state
  //   // await page.context().addCookies([...]);
  //
  //   await page.goto('/__PAGE_ROUTE__');
  //   await expect(page.getByText('Welcome')).toBeVisible();
  // });

  // ===================================
  // Error Handling Tests
  // ===================================

  test('should handle errors gracefully', async ({ page }) => {
    // Intercept API calls to simulate errors (if applicable)
    // await page.route('/api/*', route => route.fulfill({ status: 500 }));

    await page.goto('/__PAGE_ROUTE__');

    // Page should still render without crashing
    await expect(page.getByRole('main')).toBeVisible();
  });
});
