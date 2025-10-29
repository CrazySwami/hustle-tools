// Simplified test matching frontend format
const API_URL = 'http://localhost:3002/api/chat-elementor';

console.log('🧪 Simple Usage Tracking Test\n');

async function test() {
  console.log('Sending POST to', API_URL);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{
        id: 'test123',
        role: 'user',
        parts: [{
          type: 'text',
          text: 'hello'
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

  // Parse stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let usageFound = false;

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

          if (json.usage) {
            console.log('\n✅ USAGE FOUND:', json.usage);
            usageFound = true;
          }
        } catch (e) {}
      }
    }
  }

  if (!usageFound) {
    console.log('\n❌ NO USAGE DATA');
  }
}

test().catch(console.error);
