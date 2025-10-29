// Test usage tracking for all models
// Run with: node test-all-models-usage.js

const API_URL = 'http://localhost:3001/api/chat-elementor';  // Updated to port 3001

// All models from the pricing table
const MODELS_TO_TEST = [
  // Anthropic Claude
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-sonnet-4-5-20250929',
  'anthropic/claude-haiku-4.5',
  'anthropic/claude-haiku-4-5-20250929',
  'anthropic/claude-haiku-4-5-20251001',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3-haiku',
  'anthropic/claude-3.7-sonnet',
  'anthropic/claude-3-opus',
  'anthropic/claude-3-5-sonnet-20241022',
  'anthropic/claude-3-5-sonnet-20240620',
  'anthropic/claude-3-5-haiku-20241022',

  // OpenAI
  'openai/gpt-4o',
  'openai/gpt-4o-2024-11-20',
  'openai/gpt-4o-2024-08-06',
  'openai/gpt-4o-2024-05-13',
  'openai/gpt-4o-mini',
  'openai/gpt-4o-mini-2024-07-18',
  'openai/o1',
  'openai/o1-2024-12-17',
  'openai/o1-mini',
  'openai/o1-mini-2024-09-12',
  'openai/o1-preview',
  'openai/o1-preview-2024-09-12',
  'openai/gpt-4-turbo',
  'openai/gpt-4-turbo-2024-04-09',
  'openai/gpt-4-turbo-preview',
  'openai/gpt-4-0125-preview',
  'openai/gpt-4-1106-preview',
  'openai/gpt-4',
  'openai/gpt-4-0613',
  'openai/gpt-3.5-turbo',
  'openai/gpt-3.5-turbo-0125',
  'openai/gpt-3.5-turbo-1106',

  // Google Gemini
  'google/gemini-2.0-flash-exp',
  'google/gemini-exp-1206',
  'google/gemini-2.0-flash-thinking-exp-1219',
  'google/gemini-exp-1121',
  'google/gemini-1.5-pro',
  'google/gemini-1.5-pro-002',
  'google/gemini-1.5-pro-001',
  'google/gemini-1.5-flash',
  'google/gemini-1.5-flash-002',
  'google/gemini-1.5-flash-001',
  'google/gemini-1.5-flash-8b',

  // Perplexity
  'perplexity/llama-3.1-sonar-large-128k-online',
  'perplexity/llama-3.1-sonar-small-128k-online',
  'perplexity/llama-3.1-sonar-large-128k-chat',
  'perplexity/llama-3.1-sonar-small-128k-chat',

  // xAI Grok
  'x-ai/grok-beta',
  'x-ai/grok-vision-beta',

  // Meta Llama
  'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/llama-3.1-405b-instruct',
  'meta-llama/llama-3.1-70b-instruct',
  'meta-llama/llama-3.1-8b-instruct',

  // Mistral
  'mistralai/mistral-large-2411',
  'mistralai/mistral-large-2407',
  'mistralai/mistral-small-2409',
  'mistralai/pixtral-large-2411',
  'mistralai/pixtral-12b-2409',

  // DeepSeek
  'deepseek/deepseek-chat',
  'deepseek/deepseek-reasoner',
];

console.log('🧪 Testing Usage Tracking for All Models');
console.log('═══════════════════════════════════════\n');
console.log(`Testing ${MODELS_TO_TEST.length} models...\n`);

const results = [];
let successCount = 0;
let failCount = 0;
let noMetadataCount = 0;

async function testModel(modelId) {
  try {
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
        model: modelId,
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Parse stream
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
        } catch (e) {
          // Skip non-JSON
        }
      }
    }

    if (!metadata) {
      noMetadataCount++;
      return {
        model: modelId,
        status: 'NO_METADATA',
        error: 'No metadata in stream'
      };
    }

    // Calculate cost (simplified - just check if tokens exist)
    const hasTokens = metadata.totalTokens > 0 ||
                     metadata.promptTokens > 0 ||
                     metadata.completionTokens > 0;

    if (!hasTokens) {
      failCount++;
      return {
        model: modelId,
        status: 'FAIL',
        error: 'Zero tokens',
        metadata
      };
    }

    successCount++;
    return {
      model: modelId,
      status: 'SUCCESS',
      metadata
    };

  } catch (error) {
    failCount++;
    return {
      model: modelId,
      status: 'ERROR',
      error: error.message
    };
  }
}

async function runTests() {
  const startTime = Date.now();

  for (const modelId of MODELS_TO_TEST) {
    process.stdout.write(`Testing ${modelId.padEnd(50)} ... `);

    const result = await testModel(modelId);
    results.push(result);

    if (result.status === 'SUCCESS') {
      console.log(`✅ ${result.metadata.totalTokens} tokens`);
    } else if (result.status === 'NO_METADATA') {
      console.log('⚠️  No metadata');
    } else if (result.status === 'ERROR') {
      console.log(`❌ ${result.error}`);
    } else {
      console.log(`❌ ${result.error}`);
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print summary
  console.log('\n═══════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════\n');
  console.log(`Total models tested: ${MODELS_TO_TEST.length}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️  No metadata: ${noMetadataCount}`);
  console.log(`⏱️  Duration: ${duration}s\n`);

  // Print detailed results for failures
  const failures = results.filter(r => r.status !== 'SUCCESS');
  if (failures.length > 0) {
    console.log('❌ FAILED MODELS:\n');
    failures.forEach(f => {
      console.log(`  ${f.model}`);
      console.log(`    Status: ${f.status}`);
      console.log(`    Error: ${f.error}`);
      if (f.metadata) {
        console.log(`    Metadata:`, JSON.stringify(f.metadata, null, 2));
      }
      console.log('');
    });
  }

  // Print sample success
  const success = results.find(r => r.status === 'SUCCESS');
  if (success) {
    console.log('\n✅ SAMPLE SUCCESS:\n');
    console.log(`  Model: ${success.model}`);
    console.log(`  Metadata:`, JSON.stringify(success.metadata, null, 2));
  }

  // Exit with appropriate code
  process.exit(failures.length > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
