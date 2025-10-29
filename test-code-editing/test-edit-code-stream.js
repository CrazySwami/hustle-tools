/**
 * Test script for /api/edit-code-stream endpoint
 *
 * This tests the diff generation:
 * 1. Send current HTML code
 * 2. Send edit instruction
 * 3. Receive unified diff patch
 *
 * Run with: node test-edit-code-stream.js
 */

const fs = require('fs');
const path = require('path');

// Read sample files
const htmlContent = fs.readFileSync(path.join(__dirname, 'sample-html.html'), 'utf-8');
const cssContent = fs.readFileSync(path.join(__dirname, 'sample-css.css'), 'utf-8');

const testEditCodeStream = async () => {
  console.log('\n🧪 Testing /api/edit-code-stream endpoint...\n');

  const payload = {
    instruction: 'Remove the Premium card (the second card with class color-green)',
    fileType: 'html',
    currentCode: htmlContent,
    context: 'Remove the entire w-card div with color-green class',
    allFiles: {
      html: htmlContent,
      css: cssContent,
      js: ''
    }
  };

  console.log('📨 Request payload:');
  console.log('- Instruction:', payload.instruction);
  console.log('- File type:', payload.fileType);
  console.log('- Current code length:', payload.currentCode.length);
  console.log('- Context:', payload.context);

  try {
    const response = await fetch('http://localhost:3009/api/edit-code-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('\n📥 Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error:', error);
      return;
    }

    console.log('\n✅ Streaming unified diff:\n');
    console.log('─'.repeat(60));

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullDiff = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullDiff += chunk;
      process.stdout.write(chunk); // Show streaming output
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 Diff Statistics:');
    console.log('- Total characters:', fullDiff.length);
    console.log('- Lines added:', (fullDiff.match(/^\+/gm) || []).length);
    console.log('- Lines removed:', (fullDiff.match(/^-/gm) || []).length);
    console.log('- Hunks:', (fullDiff.match(/^@@/gm) || []).length);

    // Save diff to file for inspection
    const diffPath = path.join(__dirname, 'output-diff.patch');
    fs.writeFileSync(diffPath, fullDiff);
    console.log('\n💾 Diff saved to:', diffPath);

    console.log('\n✅ Test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test
testEditCodeStream();
