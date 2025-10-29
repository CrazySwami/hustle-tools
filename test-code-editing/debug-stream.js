/**
 * Debug script to see the actual streaming format
 */

const fs = require('fs');
const path = require('path');

const htmlContent = fs.readFileSync(path.join(__dirname, 'sample-html.html'), 'utf-8');
const cssContent = fs.readFileSync(path.join(__dirname, 'sample-css.css'), 'utf-8');

async function debugStream() {
  console.log('🔍 Debugging streaming response format...\n');

  const payload = {
    messages: [
      {
        role: 'user',
        parts: [{ type: 'text', text: 'Remove the last card from the HTML' }]
      }
    ],
    model: 'anthropic/claude-haiku-4-5-20251001',
    currentSection: {
      name: 'Test',
      html: htmlContent,
      css: cssContent,
      js: ''
    }
  };

  const response = await fetch('http://localhost:3009/api/chat-elementor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  console.log('\n' + '='.repeat(60));
  console.log('RAW STREAM DATA:');
  console.log('='.repeat(60) + '\n');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let chunkCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunkCount++;
    const chunk = decoder.decode(value, { stream: true });

    console.log(`\n--- Chunk ${chunkCount} (${chunk.length} bytes) ---`);
    console.log(chunk);
    console.log('--- End Chunk ---');
  }

  console.log(`\n\nTotal chunks received: ${chunkCount}`);
}

debugStream().catch(err => console.error('Error:', err));
