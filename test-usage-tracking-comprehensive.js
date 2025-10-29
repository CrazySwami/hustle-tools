// Node.js test script to verify usage tracking
// Run with: node test-usage-tracking-comprehensive.js

const API_URL = 'http://localhost:3002';

console.log('🧪 Comprehensive Usage Tracking Test\n');
console.log('Testing both /api/chat and /api/chat-elementor\n');
console.log('=' .repeat(60) + '\n');

async function testEndpoint(endpoint, testName) {
  console.log(`\n📡 Testing: ${testName}`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   ${'-'.repeat(50)}`);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'test usage tracking'
          }
        ],
        model: 'anthropic/claude-haiku-4-5-20251001',
      })
    });

    console.log(`   ✅ Response status: ${response.status}`);

    if (!response.ok) {
      console.log(`   ❌ Error: ${response.statusText}`);
      return { success: false, error: response.statusText };
    }

    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let usageData = null;
    let chunkCount = 0;
    let finishReason = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            chunkCount++;

            // Look for usage data
            if (json.usage) {
              usageData = json.usage;
              console.log(`   💰 USAGE DATA FOUND:`, JSON.stringify(usageData, null, 2));
            }

            // Look for finish reason
            if (json.finishReason) {
              finishReason = json.finishReason;
              console.log(`   🏁 Finish reason: ${finishReason}`);
            }

            // Log chunk types for debugging
            if (json.type && chunkCount % 10 === 0) {
              console.log(`   📦 Chunk ${chunkCount}: type=${json.type}`);
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
      }
    }

    console.log(`   📊 Total chunks: ${chunkCount}`);

    if (usageData) {
      console.log(`   ✅ SUCCESS: Usage data found!`);
      console.log(`   📈 promptTokens: ${usageData.promptTokens || 0}`);
      console.log(`   📈 completionTokens: ${usageData.completionTokens || 0}`);
      return { success: true, usage: usageData };
    } else {
      console.log(`   ❌ FAILURE: No usage data in stream`);
      return { success: false, error: 'No usage data' };
    }

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const results = {
    chatElementor: null,
    chat: null,
  };

  // Test Elementor chat endpoint
  results.chatElementor = await testEndpoint('/api/chat-elementor', 'Elementor Chat API');

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test regular chat endpoint
  results.chat = await testEndpoint('/api/chat', 'Regular Chat API');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 TEST SUMMARY:\n');

  console.log(`   Elementor Chat: ${results.chatElementor.success ? '✅ PASS' : '❌ FAIL'}`);
  if (results.chatElementor.success) {
    console.log(`      Usage: ${JSON.stringify(results.chatElementor.usage)}`);
  } else {
    console.log(`      Error: ${results.chatElementor.error}`);
  }

  console.log(`\n   Regular Chat: ${results.chat.success ? '✅ PASS' : '❌ FAIL'}`);
  if (results.chat.success) {
    console.log(`      Usage: ${JSON.stringify(results.chat.usage)}`);
  } else {
    console.log(`      Error: ${results.chat.error}`);
  }

  console.log('\n' + '='.repeat(60));

  const allPassed = results.chatElementor.success && results.chat.success;
  console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'}\n`);

  if (!allPassed) {
    console.log('💡 TROUBLESHOOTING:');
    console.log('   1. Check if sendUsage: true is set in toUIMessageStreamResponse()');
    console.log('   2. Verify API is calling streamText() and returning result');
    console.log('   3. Check if AI Gateway is configured correctly');
    console.log('   4. Look at server logs for errors\n');
  }

  return allPassed;
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
