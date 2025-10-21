/**
 * WordPress Playground Integration Tests
 *
 * These tests verify the core functionality of the WordPress Playground integration:
 * - WordPress Settings sync (pull/push)
 * - Pages CRUD operations
 * - Yoast SEO meta
 * - Style Kit sync
 * - Elementor JSON import/export
 *
 * Run these tests to ensure all WordPress functionality works correctly.
 */

describe('WordPress Playground Integration', () => {
  let playgroundClient: any;

  beforeAll(async () => {
    // Wait for playground to initialize
    // In a real test, you'd wait for window.playgroundClient to be available
    console.log('Waiting for WordPress Playground to initialize...');
  });

  describe('WordPress Settings', () => {
    test('should pull WordPress settings from playground', async () => {
      if (typeof window === 'undefined' || !(window as any).getWordPressSettings) {
        console.warn('Skipping test - playground not available');
        return;
      }

      const settings = await (window as any).getWordPressSettings();

      expect(settings).toBeDefined();
      expect(settings).toHaveProperty('siteTitle');
      expect(settings).toHaveProperty('tagline');
      expect(settings).toHaveProperty('adminEmail');
      expect(settings).toHaveProperty('timezone');
      expect(settings).toHaveProperty('permalinkStructure');
    });

    test('should push WordPress settings to playground', async () => {
      if (typeof window === 'undefined' || !(window as any).applySiteConfig) {
        console.warn('Skipping test - playground not available');
        return;
      }

      const testSettings = {
        siteTitle: 'Test Site',
        tagline: 'Just a test',
        adminEmail: 'test@example.com',
        timezone: 'America/New_York',
        dateFormat: 'F j, Y',
        timeFormat: 'g:i a',
        startOfWeek: '0',
        postsPerPage: '10',
        permalinkStructure: '/%postname%/'
      };

      await (window as any).applySiteConfig({ settings: testSettings, pages: [] });

      // Verify settings were applied
      const settings = await (window as any).getWordPressSettings();
      expect(settings.siteTitle).toBe('Test Site');
      expect(settings.tagline).toBe('Just a test');
    });
  });

  describe('Pages Management', () => {
    test('should pull pages from WordPress', async () => {
      if (typeof window === 'undefined' || !(window as any).getWordPressPages) {
        console.warn('Skipping test - playground not available');
        return;
      }

      const pages = await (window as any).getWordPressPages();

      expect(Array.isArray(pages)).toBe(true);
      if (pages.length > 0) {
        expect(pages[0]).toHaveProperty('title');
        expect(pages[0]).toHaveProperty('slug');
        expect(pages[0]).toHaveProperty('content');
        expect(pages[0]).toHaveProperty('yoast');
      }
    });

    test('should create a new page with Yoast SEO', async () => {
      if (typeof window === 'undefined' || !(window as any).applySiteConfig) {
        console.warn('Skipping test - playground not available');
        return;
      }

      const testPage = {
        id: 'test-page',
        title: 'Test Page',
        slug: 'test-page',
        content: '<h2>Test Content</h2><p>This is a test page.</p>',
        excerpt: 'Test page excerpt',
        status: 'publish',
        date: new Date().toISOString(),
        yoast: {
          focusKeyword: 'test keyword',
          metaTitle: 'Test Page - SEO Title',
          metaDescription: 'This is a test meta description for the test page.'
        }
      };

      await (window as any).applySiteConfig({ settings: {}, pages: [testPage] });

      // Verify page was created
      const pages = await (window as any).getWordPressPages();
      const createdPage = pages.find((p: any) => p.slug === 'test-page');

      expect(createdPage).toBeDefined();
      expect(createdPage.title).toBe('Test Page');
      expect(createdPage.yoast.focusKeyword).toBe('test keyword');
    });

    test('should update existing page', async () => {
      if (typeof window === 'undefined' || !(window as any).applySiteConfig) {
        console.warn('Skipping test - playground not available');
        return;
      }

      // First create a page
      const originalPage = {
        id: 'update-test',
        title: 'Original Title',
        slug: 'update-test',
        content: 'Original content',
        excerpt: '',
        status: 'publish',
        date: new Date().toISOString(),
        yoast: {
          focusKeyword: '',
          metaTitle: '',
          metaDescription: ''
        }
      };

      await (window as any).applySiteConfig({ settings: {}, pages: [originalPage] });

      // Update the page
      const updatedPage = {
        ...originalPage,
        title: 'Updated Title',
        content: 'Updated content',
        yoast: {
          focusKeyword: 'updated keyword',
          metaTitle: 'Updated SEO Title',
          metaDescription: 'Updated meta description'
        }
      };

      await (window as any).applySiteConfig({ settings: {}, pages: [updatedPage] });

      // Verify update
      const pages = await (window as any).getWordPressPages();
      const page = pages.find((p: any) => p.slug === 'update-test');

      expect(page.title).toBe('Updated Title');
      expect(page.content).toContain('Updated content');
      expect(page.yoast.focusKeyword).toBe('updated keyword');
    });
  });

  describe('Style Kit', () => {
    test('should pull Elementor style kit from WordPress', async () => {
      if (typeof window === 'undefined' || !(window as any).getElementorStyleKit) {
        console.warn('Skipping test - playground not available');
        return;
      }

      const styleKit = await (window as any).getElementorStyleKit();

      expect(styleKit).toBeDefined();
      expect(styleKit).toHaveProperty('system_colors');
      expect(styleKit).toHaveProperty('system_typography');
    });

    test('should push style kit to WordPress', async () => {
      if (typeof window === 'undefined' || !(window as any).setElementorStyleKit) {
        console.warn('Skipping test - playground not available');
        return;
      }

      const testStyleKit = {
        system_colors: [
          { id: 'primary', title: 'Primary', value: '#FF0000' },
          { id: 'secondary', title: 'Secondary', value: '#00FF00' }
        ],
        system_typography: [
          { id: 'heading', title: 'Heading', family: 'Arial', weight: '700' }
        ]
      };

      await (window as any).setElementorStyleKit(testStyleKit);

      // Verify it was saved
      const styleKit = await (window as any).getElementorStyleKit();
      expect(styleKit.system_colors).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'primary', value: '#FF0000' })
      ]));
    });
  });

  describe('Elementor JSON', () => {
    test('should import Elementor JSON to playground', async () => {
      if (typeof window === 'undefined' || !(window as any).importToExistingPlayground) {
        console.warn('Skipping test - playground not available');
        return;
      }

      const testJSON = {
        content: [
          {
            id: 'test-section',
            elType: 'section',
            settings: {},
            elements: [
              {
                id: 'test-column',
                elType: 'column',
                settings: {},
                elements: [
                  {
                    id: 'test-heading',
                    elType: 'widget',
                    widgetType: 'heading',
                    settings: {
                      title: 'Test Heading',
                      title_color: '#000000'
                    }
                  }
                ]
              }
            ]
          }
        ]
      };

      // Set global JSON
      (window as any).generatedJSON = testJSON;

      await (window as any).importToExistingPlayground();

      // Verify by pulling it back
      const pulledJSON = await (window as any).pullFromPlayground();
      expect(pulledJSON).toBeDefined();
      expect(pulledJSON.length).toBeGreaterThan(0);
    });

    test('should pull Elementor JSON from playground', async () => {
      if (typeof window === 'undefined' || !(window as any).pullFromPlayground) {
        console.warn('Skipping test - playground not available');
        return;
      }

      const json = await (window as any).pullFromPlayground();

      expect(Array.isArray(json)).toBe(true);
      // Should have Elementor structure
      if (json.length > 0) {
        expect(json[0]).toHaveProperty('elType');
        expect(json[0]).toHaveProperty('settings');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid JSON gracefully', async () => {
      if (typeof window === 'undefined' || !(window as any).applySiteConfig) {
        console.warn('Skipping test - playground not available');
        return;
      }

      // Test with invalid page data
      const invalidConfig = {
        settings: {},
        pages: [
          {
            // Missing required fields
            id: 'invalid',
            // No title, slug, etc.
          }
        ]
      };

      await expect((window as any).applySiteConfig(invalidConfig)).rejects.toThrow();
    });

    test('should handle playground not initialized', async () => {
      // Temporarily remove playground client
      const originalClient = (window as any).playgroundClient;
      (window as any).playgroundClient = null;

      await expect((window as any).getWordPressSettings()).rejects.toThrow('Playground not running');

      // Restore
      (window as any).playgroundClient = originalClient;
    });
  });

  describe('Data Integrity', () => {
    test('should preserve special characters in content', async () => {
      if (typeof window === 'undefined' || !(window as any).applySiteConfig) {
        console.warn('Skipping test - playground not available');
        return;
      }

      const testPage = {
        id: 'special-chars',
        title: 'Test\'s "Special" & <Characters>',
        slug: 'special-chars',
        content: '<p>Content with "quotes" and \'apostrophes\' & <tags></p>',
        excerpt: '',
        status: 'publish',
        date: new Date().toISOString(),
        yoast: {
          focusKeyword: 'special & characters',
          metaTitle: 'Title with "quotes"',
          metaDescription: 'Description with \'apostrophes\''
        }
      };

      await (window as any).applySiteConfig({ settings: {}, pages: [testPage] });

      const pages = await (window as any).getWordPressPages();
      const page = pages.find((p: any) => p.slug === 'special-chars');

      expect(page.title).toContain('\'');
      expect(page.title).toContain('"');
      expect(page.content).toContain('&');
    });

    test('should handle Unicode characters', async () => {
      if (typeof window === 'undefined' || !(window as any).applySiteConfig) {
        console.warn('Skipping test - playground not available');
        return;
      }

      const testPage = {
        id: 'unicode-test',
        title: '日本語 Español Emoji 🚀',
        slug: 'unicode-test',
        content: '<p>Unicode: 中文 العربية Русский 🎉</p>',
        excerpt: '',
        status: 'publish',
        date: new Date().toISOString(),
        yoast: {
          focusKeyword: '日本語',
          metaTitle: 'Unicode Title 🌟',
          metaDescription: 'Description with emoji 🎨'
        }
      };

      await (window as any).applySiteConfig({ settings: {}, pages: [testPage] });

      const pages = await (window as any).getWordPressPages();
      const page = pages.find((p: any) => p.slug === 'unicode-test');

      expect(page.title).toBe('日本語 Español Emoji 🚀');
    });
  });
});

// Manual test runner that can be executed in browser console
if (typeof window !== 'undefined') {
  (window as any).runPlaygroundTests = async function() {
    console.log('🧪 Starting WordPress Playground Integration Tests...\n');

    const tests = [
      {
        name: 'Pull WordPress Settings',
        fn: async () => {
          const settings = await (window as any).getWordPressSettings();
          console.assert(settings.siteTitle !== undefined, 'Settings should have siteTitle');
          return settings;
        }
      },
      {
        name: 'Pull WordPress Pages',
        fn: async () => {
          const pages = await (window as any).getWordPressPages();
          console.assert(Array.isArray(pages), 'Pages should be an array');
          return pages;
        }
      },
      {
        name: 'Pull Style Kit',
        fn: async () => {
          const styleKit = await (window as any).getElementorStyleKit();
          console.assert(styleKit.system_colors !== undefined, 'Style kit should have colors');
          return styleKit;
        }
      },
      {
        name: 'Create Test Page',
        fn: async () => {
          const testPage = {
            id: 'test-' + Date.now(),
            title: 'Automated Test Page',
            slug: 'test-page-' + Date.now(),
            content: '<h2>Test</h2>',
            excerpt: '',
            status: 'publish',
            date: new Date().toISOString(),
            yoast: {
              focusKeyword: 'test',
              metaTitle: 'Test Page',
              metaDescription: 'This is a test page'
            }
          };
          await (window as any).applySiteConfig({ settings: {}, pages: [testPage] });
          return testPage;
        }
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        console.log(`Running: ${test.name}...`);
        const result = await test.fn();
        console.log(`✅ PASSED: ${test.name}`, result);
        passed++;
      } catch (error) {
        console.error(`❌ FAILED: ${test.name}`, error);
        failed++;
      }
      console.log('');
    }

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    return { passed, failed };
  };

  console.log('💡 Playground tests loaded! Run window.runPlaygroundTests() to execute all tests.');
}

export {};
