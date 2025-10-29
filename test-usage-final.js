// Node.js test for usage tracking - run with: node test-usage-final.js
const API_URL = 'http://localhost:3002/api/chat-elementor';

console.log('🧪 Testing Usage Tracking with messageMetadata\n');

async function test() {
  console.log('Sending POST to', API_URL);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{
        id: 'test' + Date.now(),
        role: 'user',
        parts: [{
          type: 'text',
          text: 'hi'
        }]
      }],
      model: 'anthropic/claude-haiku-4-5-20251001',
    })
  });

  console.log('Status:', response.status);

  if (!response.ok) {
    const text = await response.text();
    console.log('Error:', text);
    return;
  }

  // Parse SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let metadataFound = false;
  let finishFound = false;
  const chunkTypes = new Set();
  let metadataChunk = null;

  console.log('\n📦 Parsing stream chunks...\n');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      const data = line.slice(6);
      if (data === '[DONE]') {
        console.log('📍 [DONE] marker');
        continue;
      }

      try {
        const json = JSON.parse(data);

        if (json.type) {
          chunkTypes.add(json.type);

          // Only log important chunks
          if (json.type === 'finish' || json.type === 'message-start' || json.metadata) {
            console.log(`📦 ${json.type}`);
          }
        }

        // Check for finish chunk
        if (json.type === 'finish') {
          finishFound = true;
          console.log('  ✅ Finish chunk found');
        }

        // Check for metadata in ANY chunk
        if (json.metadata) {
          metadataFound = true;
          metadataChunk = json;
          console.log(`  ✅ Metadata found in ${json.type} chunk!`);
          console.log('  📊 Metadata:', JSON.stringify(json.metadata, null, 2));
        }

        // Also log the full finish chunk to inspect it
        if (json.type === 'finish') {
          console.log('  📋 Full finish chunk:', JSON.stringify(json, null, 2));
        }
      } catch (e) {
        // Skip non-JSON lines
      }
    }
  }

  // Results
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('All chunk types:', Array.from(chunkTypes).join(', '));
  console.log(`Finish chunk: ${finishFound ? '✅ YES' : '❌ NO'}`);
  console.log(`Metadata: ${metadataFound ? '✅ YES' : '❌ NO'}`);

  if (metadataFound) {
    console.log('\n✅ SUCCESS - Usage tracking is working!');
    console.log('\nFull metadata chunk:');
    console.log(JSON.stringify(metadataChunk, null, 2));
  } else {
    console.log('\n❌ FAILED - No metadata in stream');
    console.log('\nPossible issues:');
    console.log('1. messageMetadata callback not firing');
    console.log('2. Metadata not being added to stream');
    console.log('3. SDK version issue');
  }
}

test().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});
