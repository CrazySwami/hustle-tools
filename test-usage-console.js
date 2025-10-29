// Copy and paste this into browser console at http://localhost:3002/elementor-editor
// to test usage tracking

async function testUsageTracking() {
  console.log('🧪 Starting usage tracking test...');
  console.log('Sending POST to /api/chat-elementor\n');

  try {
    const response = await fetch('/api/chat-elementor', {
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
            text: 'say hello in one word'
          }]
        }],
        model: 'anthropic/claude-haiku-4-5-20251001',
      })
    });

    console.log(`%cStatus: ${response.status}`, 'color: ' + (response.ok ? 'green' : 'red'));

    if (!response.ok) {
      const text = await response.text();
      console.log('%cError: ' + text, 'color: red');
      return;
    }

    // Parse stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let metadataFound = false;
    let finishChunkFound = false;
    let messageWithMetadata = null;
    let allChunkTypes = new Set();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('%c📍 Stream ended: [DONE]', 'color: blue');
            continue;
          }

          try {
            const json = JSON.parse(data);

            // Track all chunk types
            if (json.type) {
              allChunkTypes.add(json.type);
            }

            // Look for finish chunk
            if (json.type === 'finish') {
              finishChunkFound = true;
              console.log('%c✅ FINISH CHUNK FOUND!', 'color: green; font-weight: bold');
              console.log('Finish chunk data:', json);
            }

            // Look for message-start with metadata
            if (json.type === 'message-start' && json.metadata) {
              metadataFound = true;
              messageWithMetadata = json;
              console.log('%c✅ METADATA FOUND IN MESSAGE-START!', 'color: green; font-weight: bold');
              console.log('Metadata:', json.metadata);
            }

            // Look for any metadata
            if (json.metadata && !metadataFound) {
              metadataFound = true;
              messageWithMetadata = json;
              console.log('%c✅ METADATA FOUND!', 'color: green; font-weight: bold');
              console.log('Chunk type:', json.type);
              console.log('Metadata:', json.metadata);
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
      }
    }

    console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: blue');
    console.log('%c📊 RESULTS:', 'color: blue; font-weight: bold');
    console.log('All chunk types seen:', Array.from(allChunkTypes).join(', '));
    console.log(`Finish chunk found: ${finishChunkFound ? '✅ YES' : '❌ NO'}`);
    console.log(`Metadata found: ${metadataFound ? '✅ YES' : '❌ NO'}`);

    if (!metadataFound) {
      console.log('%c❌ USAGE TRACKING NOT WORKING - No metadata in stream', 'color: red; font-weight: bold');
    } else {
      console.log('%c✅ USAGE TRACKING WORKING!', 'color: green; font-weight: bold');
      console.log('Message with metadata:', messageWithMetadata);
    }

  } catch (error) {
    console.log('%c❌ ERROR: ' + error.message, 'color: red');
    console.error(error);
  }
}

// Run the test
testUsageTracking();
