# WordPress Playground Integration Testing

This document explains how to test all the WordPress Playground functionality programmatically.

## 🎯 What Gets Tested

The test suite verifies:

1. **WordPress Settings**
   - Pull settings from WordPress
   - Push settings to WordPress
   - Verify settings persistence

2. **Pages Management**
   - Pull pages from WordPress
   - Create new pages
   - Update existing pages
   - Delete pages
   - Yoast SEO metadata

3. **Style Kit**
   - Pull Elementor colors & typography
   - Push style kit changes
   - Verify changes persist

4. **Elementor JSON**
   - Import JSON to WordPress
   - Export JSON from WordPress
   - Verify structure integrity

5. **Data Integrity**
   - Special characters handling
   - Unicode support
   - HTML content preservation

## 🚀 Running Tests

### Option 1: Browser Console (Easiest)

1. Open http://localhost:3002/elementor-editor
2. Wait for WordPress Playground to load (you'll see it auto-start)
3. Open browser console (F12)
4. Run: `runPlaygroundTests()`

This will execute all 11 tests and display results.

### Option 2: Manual Testing Checklist

If you prefer manual testing, follow this checklist:

#### WordPress Settings
- [ ] Go to Site Content → Settings tab
- [ ] Click "Pull from WP" - verify settings populate
- [ ] Change site title and tagline
- [ ] Click "Push to WP"
- [ ] Go to WordPress admin → Settings → General
- [ ] Verify changes appeared

#### Pages
- [ ] Go to Site Content → Pages tab
- [ ] Click "Pull from WP" - verify pages appear in table
- [ ] Click "Add New" - create a test page
- [ ] Fill in title, slug, content, Yoast SEO fields
- [ ] Click "Push to WP"
- [ ] Go to WordPress admin → Pages
- [ ] Verify new page exists with Yoast meta

#### Style Kit
- [ ] Go to Style Kit tab
- [ ] Click "Pull from WP" - verify colors/typography load
- [ ] Change a color value
- [ ] Click "Push to WP"
- [ ] Go to WordPress admin → Elementor → Site Settings → Global Colors
- [ ] Verify color changed

#### Elementor JSON
- [ ] Go to JSON Editor tab
- [ ] Make changes to JSON
- [ ] Click "Update & Open" in Playground tab
- [ ] Verify changes appear in Elementor editor
- [ ] Make changes in Elementor visual editor
- [ ] Click "Pull Changes" in Playground tab
- [ ] Verify JSON updated

## 📊 Test Output Example

```
🧪 ===== WordPress Playground Integration Tests =====

📋 Running tests...

▶️  Running: Pull WordPress Settings
   Settings: { siteTitle: 'My WordPress Site', tagline: 'Just another WordPress site', timezone: 'America/New_York' }
✅ PASSED: Pull WordPress Settings

▶️  Running: Push WordPress Settings
   ✓ Settings applied successfully
✅ PASSED: Push WordPress Settings

▶️  Running: Pull WordPress Pages
   Found 5 pages
   First page: { title: 'Home', slug: 'home', hasYoast: true }
✅ PASSED: Pull WordPress Pages

... (more tests)

============================================================
📊 TEST RESULTS
============================================================
Total Tests:  11
✅ Passed:     11
❌ Failed:     0

✅ Passed Tests:
   1. Pull WordPress Settings
   2. Push WordPress Settings
   3. Pull WordPress Pages
   4. Create Page with Yoast SEO
   5. Update Existing Page
   6. Pull Elementor Style Kit
   7. Push Elementor Style Kit
   8. Import Elementor JSON
   9. Pull Elementor JSON
   10. Handle Special Characters in Content
   11. Handle Unicode Characters

============================================================
🎉 All tests passed! (100.0%)
```

## 🔧 Troubleshooting

### Tests fail with "Playground not running"
- Make sure WordPress Playground has fully loaded
- Wait a few seconds after page load
- Check browser console for playground initialization errors

### Tests fail with "function not found"
- Check that `/playground.js` and `/playground-tests.js` are loaded
- Look in browser Network tab to verify files loaded
- Refresh the page and try again

### Settings/Pages don't sync
- Check browser console for PHP errors
- Verify playground is connected (green indicator)
- Try manually testing each function:
  - `await getWordPressSettings()`
  - `await getWordPressPages()`
  - etc.

## 🎓 Adding New Tests

To add a new test, edit `/public/playground-tests.js`:

```javascript
// Add inside runPlaygroundTests function
await test('Your Test Name', async () => {
    // Your test code here
    const result = await window.yourFunction();
    assert(result, 'Result should be defined');
    console.log('   ✓ Your test passed');
});
```

## 📝 Notes

- Tests create test data (pages with "Test" in title, "test-" slugs)
- You may want to clean up test data periodically
- Tests are non-destructive - they won't delete real content
- All test pages are clearly labeled as "Test" or "Automated Test"

## 🚀 Future Enhancements

Potential additions:
- Automated CI/CD integration with Playwright
- Performance benchmarking
- Stress tests (bulk page creation)
- Error recovery tests
- Cross-browser compatibility tests
