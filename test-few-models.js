// Quick test for a few key models
// Run with: node test-few-models.js

const API_URL = 'http://localhost:3001/api/chat';  // Use /api/chat (not chat-elementor)

// Test a few key models
const TEST_MODELS = [
  'anthropic/claude-haiku-4-5-20251001',
  'anthropic/claude-sonnet-4-5-20250929',
  'openai/gpt-4o-mini',
  'google/gemini-1.5-flash',
];

console.log('🧪 Quick Model Usage Test\n');

async function testModel(modelId) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
        model: modelId,
        enableTools: false,  // Disable tools for faster response
      })
    });

    if (!response.ok) {
      return { model: modelId, status: 'ERROR', error: `HTTP ${response.status}` };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let metadata = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          if (json.type === 'finish' && json.messageMetadata) {
            metadata = json.messageMetadata;
          }
        } catch (e) {}
      }
    }

    if (!metadata) {
      return { model: modelId, status: 'NO_METADATA' };
    }

    const cost = (metadata.promptTokens * 1.00 + metadata.completionTokens * 5.00) / 1000000;

    return {
      model: modelId,
      status: 'SUCCESS',
      tokens: metadata.totalTokens,
      cost: cost.toFixed(6)
    };

  } catch (error) {
    return { model: modelId, status: 'ERROR', error: error.message };
  }
}

async function runTests() {
  for (const modelId of TEST_MODELS) {
    process.stdout.write(`Testing ${modelId.padEnd(45)} ... `);

    const result = await testModel(modelId);

    if (result.status === 'SUCCESS') {
      console.log(`✅ ${result.tokens} tokens, $${result.cost}`);
    } else if (result.status === 'NO_METADATA') {
      console.log('⚠️  No metadata');
    } else {
      console.log(`❌ ${result.error}`);
    }

    await new Promise(r => setTimeout(r, 1000));  // 1s delay
  }

  console.log('\n✅ Test complete!');
}

runTests().catch(console.error);
