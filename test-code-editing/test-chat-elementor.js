/**
 * Test script for /api/chat-elementor endpoint
 *
 * This tests the full flow:
 * 1. AI receives request to edit code
 * 2. AI calls getEditorContent tool
 * 3. AI calls editCodeWithDiff tool
 * 4. System returns tool results
 *
 * Run with: node test-chat-elementor.js
 */

const fs = require('fs');
const path = require('path');

// Read sample files
const htmlContent = fs.readFileSync(path.join(__dirname, 'sample-html.html'), 'utf-8');
const cssContent = fs.readFileSync(path.join(__dirname, 'sample-css.css'), 'utf-8');

const testChatElementor = async () => {
  console.log('\n🧪 Testing /api/chat-elementor endpoint...\n');

  const payload = {
    messages: [
      {
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Remove the last card (Premium card) from the HTML'
          }
        ]
      }
    ],
    model: 'anthropic/claude-haiku-4-5-20251001',
    currentSection: {
      name: 'Pricing Cards',
      html: htmlContent,
      css: cssContent,
      js: ''
    }
  };

  console.log('📨 Request payload:');
  console.log('- Model:', payload.model);
  console.log('- Message:', payload.messages[0].parts[0].text);
  console.log('- Current section:', {
    name: payload.currentSection.name,
    htmlLength: payload.currentSection.html.length,
    cssLength: payload.currentSection.css.length
  });

  try {
    const response = await fetch('http://localhost:3009/api/chat-elementor', {
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

    console.log('\n✅ Response received (streaming):\n');

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (!line.startsWith('0:')) continue;

        try {
          const json = JSON.parse(line.slice(2)); // Remove "0:" prefix

          // Log different types of data
          if (json.type === 'text-delta') {
            process.stdout.write(json.textDelta);
          } else if (json.type === 'tool-call') {
            console.log('\n\n🔧 Tool call:', json.toolName);
            console.log('   Args:', JSON.stringify(json.args, null, 2));
          } else if (json.type === 'tool-result') {
            console.log('\n✅ Tool result:', json.toolName);
            console.log('   Result:', JSON.stringify(json.result, null, 2).substring(0, 200) + '...');
          }
        } catch (e) {
          // Ignore parse errors for non-JSON lines
        }
      }
    }

    console.log('\n\n✅ Test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test
testChatElementor();
