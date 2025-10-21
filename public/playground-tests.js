/**
 * WordPress Playground Browser Tests
 *
 * Run these tests in the browser console to verify functionality:
 *
 * 1. Open http://localhost:3002/elementor-editor
 * 2. Wait for playground to load
 * 3. Open browser console
 * 4. Run: runPlaygroundTests()
 *
 * This will test all WordPress integration features.
 */

window.runPlaygroundTests = async function() {
    console.log('\n🧪 ===== WordPress Playground Integration Tests =====\n');

    const results = {
        passed: [],
        failed: [],
        total: 0
    };

    // Helper to run a test
    async function test(name, fn) {
        results.total++;
        try {
            console.log(`▶️  Running: ${name}`);
            await fn();
            console.log(`✅ PASSED: ${name}\n`);
            results.passed.push(name);
        } catch (error) {
            console.error(`❌ FAILED: ${name}`, error);
            results.failed.push({ name, error: error.message });
        }
    }

    // Helper to assert
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    console.log('📋 Running tests...\n');

    // TEST 1: WordPress Settings - Pull
    await test('Pull WordPress Settings', async () => {
        if (!window.getWordPressSettings) {
            throw new Error('getWordPressSettings function not found');
        }

        const settings = await window.getWordPressSettings();
        assert(settings, 'Settings should be defined');
        assert(settings.siteTitle !== undefined, 'Settings should have siteTitle');
        assert(settings.tagline !== undefined, 'Settings should have tagline');
        assert(settings.adminEmail !== undefined, 'Settings should have adminEmail');

        console.log('   Settings:', {
            siteTitle: settings.siteTitle,
            tagline: settings.tagline,
            timezone: settings.timezone
        });
    });

    // TEST 2: WordPress Settings - Push
    await test('Push WordPress Settings', async () => {
        if (!window.applySiteConfig) {
            throw new Error('applySiteConfig function not found');
        }

        const testSettings = {
            siteTitle: 'Test Site ' + Date.now(),
            tagline: 'Automated Test Tagline',
            adminEmail: 'test@example.com',
            timezone: 'America/New_York',
            dateFormat: 'F j, Y',
            timeFormat: 'g:i a',
            startOfWeek: '0',
            postsPerPage: '10',
            permalinkStructure: '/%postname%/'
        };

        await window.applySiteConfig({ settings: testSettings, pages: [] });

        // Verify it was applied
        const settings = await window.getWordPressSettings();
        assert(settings.siteTitle === testSettings.siteTitle,
            `Site title should be "${testSettings.siteTitle}", got "${settings.siteTitle}"`);

        console.log('   ✓ Settings applied successfully');
    });

    // TEST 3: Pages - Pull
    await test('Pull WordPress Pages', async () => {
        if (!window.getWordPressPages) {
            throw new Error('getWordPressPages function not found');
        }

        const pages = await window.getWordPressPages();
        assert(Array.isArray(pages), 'Pages should be an array');

        console.log(`   Found ${pages.length} pages`);
        if (pages.length > 0) {
            console.log('   First page:', {
                title: pages[0].title,
                slug: pages[0].slug,
                hasYoast: !!pages[0].yoast
            });
        }
    });

    // TEST 4: Pages - Create
    await test('Create Page with Yoast SEO', async () => {
        const timestamp = Date.now();
        const testPage = {
            id: `test-${timestamp}`,
            title: `Test Page ${timestamp}`,
            slug: `test-page-${timestamp}`,
            content: '<h2>Test Heading</h2><p>This is test content created by automated tests.</p>',
            excerpt: 'Test excerpt for automated test page',
            status: 'publish',
            date: new Date().toISOString(),
            yoast: {
                focusKeyword: 'test keyword',
                metaTitle: 'Test Page SEO Title ' + timestamp,
                metaDescription: 'This is a test meta description for the automated test page. It should be between 150-160 characters long for optimal SEO.'
            }
        };

        await window.applySiteConfig({ settings: {}, pages: [testPage] });

        // Verify page was created
        const pages = await window.getWordPressPages();
        const createdPage = pages.find(p => p.slug === testPage.slug);

        assert(createdPage, `Page with slug "${testPage.slug}" should exist`);
        assert(createdPage.title === testPage.title, 'Page title should match');
        assert(createdPage.yoast, 'Page should have Yoast data');
        assert(createdPage.yoast.focusKeyword === testPage.yoast.focusKeyword, 'Yoast focus keyword should match');

        console.log('   ✓ Page created with Yoast SEO data');
    });

    // TEST 5: Pages - Update
    await test('Update Existing Page', async () => {
        const pages = await window.getWordPressPages();
        if (pages.length === 0) {
            throw new Error('No pages to update - create a page first');
        }

        const pageToUpdate = pages[0];
        const updatedContent = `Updated content at ${Date.now()}`;

        pageToUpdate.content = updatedContent;
        pageToUpdate.yoast.metaDescription = 'Updated meta description from automated tests';

        await window.applySiteConfig({ settings: {}, pages: [pageToUpdate] });

        // Verify update
        const updatedPages = await window.getWordPressPages();
        const updatedPage = updatedPages.find(p => p.slug === pageToUpdate.slug);

        assert(updatedPage, 'Updated page should exist');
        assert(updatedPage.content.includes(updatedContent), 'Content should be updated');

        console.log('   ✓ Page updated successfully');
    });

    // TEST 6: Style Kit - Pull
    await test('Pull Elementor Style Kit', async () => {
        if (!window.getElementorStyleKit) {
            throw new Error('getElementorStyleKit function not found');
        }

        const styleKit = await window.getElementorStyleKit();
        assert(styleKit, 'Style kit should be defined');
        assert(styleKit.system_colors !== undefined, 'Style kit should have system_colors');
        assert(styleKit.system_typography !== undefined, 'Style kit should have system_typography');

        console.log('   Style Kit:', {
            systemColors: Array.isArray(styleKit.system_colors) ? styleKit.system_colors.length : 0,
            systemTypography: Array.isArray(styleKit.system_typography) ? styleKit.system_typography.length : 0
        });
    });

    // TEST 7: Style Kit - Push
    await test('Push Elementor Style Kit', async () => {
        if (!window.setElementorStyleKit) {
            throw new Error('setElementorStyleKit function not found');
        }

        const testStyleKit = {
            system_colors: [
                { id: 'test_primary', title: 'Test Primary', value: '#FF5733' },
                { id: 'test_secondary', title: 'Test Secondary', value: '#33FF57' }
            ],
            system_typography: [
                { id: 'test_heading', title: 'Test Heading', family: 'Arial', weight: '700' }
            ]
        };

        await window.setElementorStyleKit(testStyleKit);

        // Verify it was saved
        const styleKit = await window.getElementorStyleKit();
        const hasTestColor = styleKit.system_colors?.some(c => c.id === 'test_primary');

        assert(hasTestColor, 'Test color should be in style kit');

        console.log('   ✓ Style kit updated successfully');
    });

    // TEST 8: Elementor JSON - Import
    await test('Import Elementor JSON', async () => {
        if (!window.importToExistingPlayground || !window.generatedJSON) {
            throw new Error('Import functions not found');
        }

        const testJSON = {
            content: [
                {
                    id: 'test-section-' + Date.now(),
                    elType: 'section',
                    settings: {
                        layout: 'boxed'
                    },
                    elements: [
                        {
                            id: 'test-column',
                            elType: 'column',
                            settings: {
                                _column_size: 100
                            },
                            elements: [
                                {
                                    id: 'test-widget',
                                    elType: 'widget',
                                    widgetType: 'heading',
                                    settings: {
                                        title: 'Test Heading from Automated Test',
                                        title_color: '#000000',
                                        typography_font_size: { size: 32, unit: 'px' }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        // Set the JSON
        window.generatedJSON = testJSON;

        // Import it
        await window.importToExistingPlayground();

        console.log('   ✓ Elementor JSON imported');
    });

    // TEST 9: Elementor JSON - Pull
    await test('Pull Elementor JSON', async () => {
        if (!window.pullFromPlayground) {
            throw new Error('pullFromPlayground function not found');
        }

        const json = await window.pullFromPlayground();
        assert(Array.isArray(json), 'Pulled JSON should be an array');

        if (json.length > 0) {
            assert(json[0].elType, 'JSON elements should have elType');
            assert(json[0].settings, 'JSON elements should have settings');
        }

        console.log(`   ✓ Pulled ${json.length} Elementor elements`);
    });

    // TEST 10: Special Characters
    await test('Handle Special Characters in Content', async () => {
        const testPage = {
            id: `special-${Date.now()}`,
            title: `Test's "Quoted" & <Special> Characters`,
            slug: `special-test-${Date.now()}`,
            content: '<p>Content with "quotes", \'apostrophes\', & ampersands</p>',
            excerpt: 'Test excerpt',
            status: 'publish',
            date: new Date().toISOString(),
            yoast: {
                focusKeyword: 'special & characters',
                metaTitle: 'Title with "quotes" & \'apostrophes\'',
                metaDescription: 'Description with special characters: <>&"\''
            }
        };

        await window.applySiteConfig({ settings: {}, pages: [testPage] });

        const pages = await window.getWordPressPages();
        const page = pages.find(p => p.slug === testPage.slug);

        assert(page, 'Page with special characters should exist');
        assert(page.title.includes('"'), 'Title should preserve quotes');
        assert(page.title.includes('\''), 'Title should preserve apostrophes');

        console.log('   ✓ Special characters handled correctly');
    });

    // TEST 11: Unicode Characters
    await test('Handle Unicode Characters', async () => {
        const testPage = {
            id: `unicode-${Date.now()}`,
            title: `日本語 Español 🚀 Emoji`,
            slug: `unicode-test-${Date.now()}`,
            content: '<p>Unicode test: 中文 العربية Русский 🎉🎨🌟</p>',
            excerpt: 'Unicode excerpt',
            status: 'publish',
            date: new Date().toISOString(),
            yoast: {
                focusKeyword: '日本語',
                metaTitle: 'Unicode Title 🌟',
                metaDescription: 'Description with emoji 🎨 and 中文'
            }
        };

        await window.applySiteConfig({ settings: {}, pages: [testPage] });

        const pages = await window.getWordPressPages();
        const page = pages.find(p => p.slug === testPage.slug);

        assert(page, 'Page with unicode should exist');
        assert(page.title.includes('🚀'), 'Title should preserve emoji');
        assert(page.title.includes('日本語'), 'Title should preserve Japanese');

        console.log('   ✓ Unicode characters handled correctly');
    });

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests:  ${results.total}`);
    console.log(`✅ Passed:     ${results.passed.length}`);
    console.log(`❌ Failed:     ${results.failed.length}`);

    if (results.passed.length > 0) {
        console.log('\n✅ Passed Tests:');
        results.passed.forEach((name, i) => {
            console.log(`   ${i + 1}. ${name}`);
        });
    }

    if (results.failed.length > 0) {
        console.log('\n❌ Failed Tests:');
        results.failed.forEach((fail, i) => {
            console.log(`   ${i + 1}. ${fail.name}`);
            console.log(`      Error: ${fail.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));

    const successRate = ((results.passed.length / results.total) * 100).toFixed(1);
    if (results.failed.length === 0) {
        console.log(`🎉 All tests passed! (${successRate}%)`);
    } else {
        console.log(`⚠️  Success Rate: ${successRate}%`);
    }

    return results;
};

console.log('💡 WordPress Playground Tests Loaded!');
console.log('📝 To run all tests, execute: runPlaygroundTests()');
