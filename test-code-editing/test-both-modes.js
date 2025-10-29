/**
 * Test Both Edit Modes: Diff vs Full Generation
 *
 * The /api/edit-code-stream endpoint has TWO modes:
 *
 * 1. EDIT MODE (currentCode exists):
 *    - Generates UNIFIED DIFF PATCH only
 *    - Only shows changed lines with context
 *    - Efficient - saves tokens
 *    - Example: "Change button color to red"
 *
 * 2. GENERATION MODE (currentCode is empty):
 *    - Generates COMPLETE NEW FILE
 *    - Full code from scratch
 *    - Used for creating new content
 *    - Example: "Create a hero section"
 */

const fs = require('fs');
const path = require('path');

const htmlContent = fs.readFileSync(path.join(__dirname, 'sample-html.html'), 'utf-8');
const cssContent = fs.readFileSync(path.join(__dirname, 'sample-css.css'), 'utf-8');

const API_BASE = 'http://localhost:3009';

// Test 1: EDIT MODE - Should return DIFF PATCH
async function testEditMode() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST: EDIT MODE (Existing Code → Unified Diff Patch)');
  console.log('='.repeat(70));
  console.log('\nScenario: Editing existing HTML to remove a card');
  console.log('Expected: Unified diff with @@ markers, - for deletions, + for additions\n');

  const payload = {
    instruction: 'Remove the Premium card (second w-card)',
    fileType: 'html',
    currentCode: htmlContent, // ✅ Code exists → EDIT MODE
    context: 'Remove the w-card with color-green class',
    allFiles: {
      html: htmlContent,
      css: cssContent,
      js: ''
    }
  };

  console.log('📨 Request:');
  console.log('   Mode: EDIT MODE (currentCode provided, length:', htmlContent.length, ')');
  console.log('   Instruction:', payload.instruction);

  try {
    const response = await fetch(`${API_BASE}/api/edit-code-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('\n📥 Response:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullOutput = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullOutput += chunk;
    }

    console.log('\n📄 Output Preview (first 500 chars):');
    console.log('─'.repeat(70));
    console.log(fullOutput.substring(0, 500));
    console.log('─'.repeat(70));

    // Verify it's a diff
    const isDiff = fullOutput.includes('@@') && fullOutput.includes('---') && fullOutput.includes('+++');
    const hasMinusLines = fullOutput.split('\n').some(line => line.startsWith('-'));
    const hasPlusLines = fullOutput.split('\n').some(line => line.startsWith('+'));

    console.log('\n✅ Verification:');
    console.log('   Contains @@ markers:', isDiff ? '✓' : '✗');
    console.log('   Contains - (deletions):', hasMinusLines ? '✓' : '✗');
    console.log('   Contains + (additions):', hasPlusLines ? '✓' : '✗');
    console.log('   Output length:', fullOutput.length, 'chars');

    if (isDiff) {
      const deletions = fullOutput.split('\n').filter(l => l.startsWith('-')).length;
      const additions = fullOutput.split('\n').filter(l => l.startsWith('+')).length;
      console.log('   Lines deleted:', deletions);
      console.log('   Lines added:', additions);
    }

    if (isDiff && hasMinusLines) {
      console.log('\n🎉 SUCCESS: EDIT MODE working - generated unified diff!');
      return true;
    } else {
      console.log('\n❌ FAIL: Expected diff format, got full file instead');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Test 2: GENERATION MODE - Should return FULL FILE
async function testGenerationMode() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST: GENERATION MODE (Empty Code → Full File)');
  console.log('='.repeat(70));
  console.log('\nScenario: Creating new CSS from scratch');
  console.log('Expected: Complete CSS file with all selectors and rules\n');

  const payload = {
    instruction: 'Create CSS for a hero section with gradient background, centered text, and a call-to-action button',
    fileType: 'css',
    currentCode: '', // ❌ Empty → GENERATION MODE
    context: 'Modern design with blue gradient and responsive layout',
    allFiles: {
      html: '<div class="hero"><h1>Welcome</h1><button class="cta">Get Started</button></div>',
      css: '', // Empty!
      js: ''
    }
  };

  console.log('📨 Request:');
  console.log('   Mode: GENERATION MODE (currentCode is empty)');
  console.log('   Instruction:', payload.instruction);

  try {
    const response = await fetch(`${API_BASE}/api/edit-code-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('\n📥 Response:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullOutput = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullOutput += chunk;
    }

    console.log('\n📄 Output Preview (first 500 chars):');
    console.log('─'.repeat(70));
    console.log(fullOutput.substring(0, 500));
    console.log('─'.repeat(70));

    // Verify it's a complete file (not a diff)
    const isDiff = fullOutput.includes('@@') && fullOutput.includes('---');
    const hasSelectors = fullOutput.includes('.hero') || fullOutput.includes('.cta');
    const hasRules = fullOutput.includes('{') && fullOutput.includes('}');

    console.log('\n✅ Verification:');
    console.log('   Is diff format:', isDiff ? '✗ (should be full file)' : '✓');
    console.log('   Contains CSS selectors:', hasSelectors ? '✓' : '✗');
    console.log('   Contains CSS rules:', hasRules ? '✓' : '✗');
    console.log('   Output length:', fullOutput.length, 'chars');

    if (hasSelectors) {
      const selectorCount = (fullOutput.match(/\.[a-z-]+\s*{/g) || []).length;
      console.log('   CSS selectors found:', selectorCount);
    }

    if (!isDiff && hasSelectors && hasRules) {
      console.log('\n🎉 SUCCESS: GENERATION MODE working - generated complete CSS!');
      return true;
    } else {
      console.log('\n❌ FAIL: Expected full CSS file, got diff or invalid format');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Test 3: EDIT MODE with CSS - Change specific property
async function testEditModeCss() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST: EDIT MODE for CSS (Targeted Property Change)');
  console.log('='.repeat(70));
  console.log('\nScenario: Changing button background color in existing CSS');
  console.log('Expected: Small diff showing only the color change\n');

  const payload = {
    instruction: 'Change the button background color from #3b82f6 to #ef4444 (red)',
    fileType: 'css',
    currentCode: cssContent, // ✅ Code exists → EDIT MODE
    context: 'Update .w-button background property',
    allFiles: {
      html: htmlContent,
      css: cssContent,
      js: ''
    }
  };

  console.log('📨 Request:');
  console.log('   Mode: EDIT MODE (currentCode provided, length:', cssContent.length, ')');
  console.log('   Instruction:', payload.instruction);

  try {
    const response = await fetch(`${API_BASE}/api/edit-code-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('\n📥 Response:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullOutput = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullOutput += chunk;
    }

    console.log('\n📄 Full Diff Output:');
    console.log('─'.repeat(70));
    console.log(fullOutput);
    console.log('─'.repeat(70));

    const isDiff = fullOutput.includes('@@');
    const hasColorChange = fullOutput.includes('#ef4444') || fullOutput.includes('red');

    console.log('\n✅ Verification:');
    console.log('   Is diff format:', isDiff ? '✓' : '✗');
    console.log('   Contains color change:', hasColorChange ? '✓' : '✗');
    console.log('   Output length:', fullOutput.length, 'chars (should be small)');

    if (isDiff && fullOutput.length < 500) {
      console.log('   ✓ Small targeted diff (efficient!)');
    }

    if (isDiff && hasColorChange) {
      console.log('\n🎉 SUCCESS: EDIT MODE for CSS working - small targeted diff!');
      return true;
    } else {
      console.log('\n❌ FAIL: Expected small diff with color change');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  EDIT MODES TEST: Diff vs Full Generation                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('\nTesting /api/edit-code-stream with both modes:');
  console.log('  1. EDIT MODE (existing code) → Unified diff patch');
  console.log('  2. GENERATION MODE (empty code) → Full file\n');

  const results = {
    editModeHtml: false,
    generationModeCss: false,
    editModeCss: false,
  };

  results.editModeHtml = await testEditMode();
  await new Promise(r => setTimeout(r, 2000));

  results.generationModeCss = await testGenerationMode();
  await new Promise(r => setTimeout(r, 2000));

  results.editModeCss = await testEditModeCss();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  console.log('\nResults:');
  console.log('  ', results.editModeHtml ? '✅' : '❌', 'EDIT MODE (HTML) - Unified diff');
  console.log('  ', results.generationModeCss ? '✅' : '❌', 'GENERATION MODE (CSS) - Full file');
  console.log('  ', results.editModeCss ? '✅' : '❌', 'EDIT MODE (CSS) - Targeted change');

  console.log('\n' + '─'.repeat(70));
  console.log(`Total: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);

  if (passed === total) {
    console.log('\n🎉 BOTH MODES WORKING PERFECTLY!');
    console.log('   ✓ Edit mode generates efficient diffs');
    console.log('   ✓ Generation mode creates complete files');
  } else {
    console.log('\n⚠️  Some modes not working as expected');
  }

  console.log('\n' + '='.repeat(70) + '\n');

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
