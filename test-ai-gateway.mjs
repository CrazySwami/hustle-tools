#!/usr/bin/env node

import { createGateway } from '@ai-sdk/gateway';
import { streamText, generateText } from 'ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize the AI Gateway
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY
});

// Available models for testing (matches your chat interface)
const MODELS = {
  openai: {
    'gpt-5': 'openai/gpt-5',
    'gpt-5-mini': 'openai/gpt-5-mini',
    'gpt-5-nano': 'openai/gpt-5-nano',
    'gpt-4.1': 'openai/gpt-4.1',
    'gpt-4.1-mini': 'openai/gpt-4.1-mini',
    'gpt-4.1-nano': 'openai/gpt-4.1-nano',
    'gpt-4o': 'openai/gpt-4o',
    'gpt-4o-mini': 'openai/gpt-4o-mini',
    'gpt-4-turbo': 'openai/gpt-4-turbo',
    'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
    'o1-preview': 'openai/o1-preview',
    'o1-mini': 'openai/o1-mini',
    'o3': 'openai/o3',
    'o3-mini': 'openai/o3-mini',
    'o4-mini': 'openai/o4-mini',
    'text-embedding-3-small': 'openai/text-embedding-3-small',
    'gpt-oss-20b': 'openai/gpt-oss-20b'
  },
  anthropic: {
    'claude-4.1-opus': 'anthropic/claude-4.1-opus',
    'claude-4-opus': 'anthropic/claude-4-opus',
    'claude-4-sonnet': 'anthropic/claude-4-sonnet',
    'claude-3.7-sonnet': 'anthropic/claude-3.7-sonnet',
    'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
    'claude-3.5-haiku': 'anthropic/claude-3.5-haiku'
  },
  google: {
    'gemini-2.5-pro': 'google/gemini-2.5-pro',
    'gemini-2.5-flash': 'google/gemini-2.5-flash',
    'gemini-2.0-flash': 'google/gemini-2.0-flash',
    'gemini-2.0-flash-lite': 'google/gemini-2.0-flash-lite'
  },
  perplexity: {
    'sonar': 'perplexity/sonar',
    'sonar-pro': 'perplexity/sonar-pro',
    'sonar-reasoning': 'perplexity/sonar-reasoning',
    'sonar-reasoning-pro': 'perplexity/sonar-reasoning-pro'
  },
  xai: {
    'grok-4': 'xai/grok-4',
    'grok-3-beta': 'xai/grok-3-beta',
    'grok-3-mini-beta': 'xai/grok-3-mini-beta',
    'grok-2': 'xai/grok-2',
    'grok-2-vision': 'xai/grok-2-vision'
  },
  zai: {
    'glm-4.5': 'zai/glm-4.5',
    'glm-4.5-air': 'zai/glm-4.5-air'
  },
  moonshotai: {
    'kimi-k2': 'moonshotai/kimi-k2'
  },
  deepseek: {
    'deepseek-r1': 'deepseek/deepseek-r1',
    'deepseek-r1-distill-llama-70b': 'deepseek/deepseek-r1-distill-llama-70b',
    'deepseek-v3-0324': 'deepseek/deepseek-v3-0324'
  },
  alibaba: {
    'qwen3-coder': 'alibaba/qwen3-coder',
    'qwen3-235b-a22b-instruct-2507': 'alibaba/qwen3-235b-a22b-instruct-2507',
    'qwen-3.32b': 'alibaba/qwen-3.32b'
  },
  meta: {
    'llama-3.3-70b': 'meta/llama-3.3-70b'
  },
  cohere: {
    'command-a': 'cohere/command-a'
  },
  amazon: {
    'nova-pro': 'amazon/nova-pro'
  },
  vercel: {
    'v0-1.5-md': 'vercel/v0-1.5-md'
  },
  other: {
    'gpt-oss-120b': 'baseten/gpt-oss-120b'
  }
};

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Simple Question',
    messages: [{ role: 'user', content: 'What is 2 + 2?' }],
    expectedKeywords: ['4', 'four']
  },
  {
    name: 'Creative Writing',
    messages: [{ role: 'user', content: 'Write a short haiku about programming.' }],
    expectedKeywords: ['code', 'programming', 'software']
  },
  {
    name: 'Complex Reasoning',
    messages: [{ role: 'user', content: 'Explain the difference between async and sync programming in JavaScript.' }],
    expectedKeywords: ['asynchronous', 'synchronous', 'callback', 'promise']
  },
  {
    name: 'Conversation Context',
    messages: [
      { role: 'user', content: 'My favorite color is blue.' },
      { role: 'assistant', content: 'That\'s nice! Blue is a calming color.' },
      { role: 'user', content: 'What did I just tell you about my preferences?' }
    ],
    expectedKeywords: ['blue', 'color', 'favorite']
  },
  {
    name: 'Code Generation',
    messages: [{ role: 'user', content: 'Write a simple JavaScript function that reverses a string.' }],
    expectedKeywords: ['function', 'reverse', 'string', 'javascript']
  }
];

// Test results storage
const testResults = [];

// Utility functions
function logWithTimestamp(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function validateResponse(response, expectedKeywords = []) {
  const validation = {
    hasContent: response && response.length > 0,
    hasExpectedKeywords: expectedKeywords.length === 0 || expectedKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    ),
    isReasonableLength: response && response.length > 10 && response.length < 5000
  };

  return {
    ...validation,
    isValid: validation.hasContent && validation.hasExpectedKeywords && validation.isReasonableLength
  };
}

// Test streaming response
async function testStreamingResponse(model, scenario) {
  logWithTimestamp(`Testing streaming with ${model}...`);
  
  try {
    const startTime = Date.now();
    let fullResponse = '';
    let chunkCount = 0;

    const result = await streamText({
      model: gateway(model),
      messages: scenario.messages,
      maxTokens: 500
    });

    for await (const textPart of result.textStream) {
      fullResponse += textPart;
      chunkCount++;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const validation = validateResponse(fullResponse, scenario.expectedKeywords);

    return {
      success: true,
      response: fullResponse,
      duration,
      chunkCount,
      validation,
      usage: await result.usage
    };
  } catch (error) {
    logWithTimestamp(`Streaming test failed: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message,
      duration: 0,
      chunkCount: 0,
      validation: { isValid: false }
    };
  }
}

// Test non-streaming response
async function testGenerateResponse(model, scenario) {
  logWithTimestamp(`Testing generation with ${model}...`);
  
  try {
    const startTime = Date.now();

    const result = await generateText({
      model: gateway(model),
      messages: scenario.messages,
      maxTokens: 500
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const validation = validateResponse(result.text, scenario.expectedKeywords);

    return {
      success: true,
      response: result.text,
      duration,
      validation,
      usage: result.usage
    };
  } catch (error) {
    logWithTimestamp(`Generation test failed: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message,
      duration: 0,
      validation: { isValid: false }
    };
  }
}

// Test web search functionality (Perplexity models)
async function testWebSearch(model, query) {
  logWithTimestamp(`Testing web search with ${model}...`);
  
  try {
    const startTime = Date.now();

    const result = await generateText({
      model: gateway(model),
      messages: [{ role: 'user', content: query }],
      maxTokens: 1000,
      experimental_toolChoice: 'auto'
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      success: true,
      response: result.text,
      duration,
      validation: validateResponse(result.text, ['source', 'according', 'recent']),
      usage: result.usage
    };
  } catch (error) {
    logWithTimestamp(`Web search test failed: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message,
      duration: 0,
      validation: { isValid: false }
    };
  }
}

// Models that support reasoning with their specific configuration (from your API route)
const REASONING_MODELS = {
  // OpenAI models
  'openai/gpt-5': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  'openai/gpt-5-mini': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  'openai/o1-preview': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  'openai/o1-mini': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  'openai/o3': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  'openai/o3-mini': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  'openai/o4-mini': {
    provider: 'openai',
    config: { reasoningSummary: 'detailed' }
  },
  // Anthropic models
  'anthropic/claude-3-7-sonnet-20250219': {
    provider: 'anthropic',
    config: { thinking: { type: 'enabled', budgetTokens: 12000 } }
  },
  'anthropic/claude-sonnet-4-20250514': {
    provider: 'anthropic',
    config: { thinking: { type: 'enabled', budgetTokens: 12000 } }
  },
  'anthropic/claude-opus-4-20250514': {
    provider: 'anthropic',
    config: { thinking: { type: 'enabled', budgetTokens: 12000 } }
  },
  // Deepseek models
  'deepseek/deepseek-r1': {
    provider: 'deepseek',
    config: {} // Deepseek R1 has built-in reasoning support
  },
  'deepseek/deepseek-r1-distill-llama-70b': {
    provider: 'deepseek',
    config: {} // Deepseek R1 distill also has built-in reasoning support
  }
};

// Test DeepSeek models with extractReasoningMiddleware (if available)
async function testDeepSeekReasoning(model) {
  logWithTimestamp(`Testing DeepSeek reasoning with middleware: ${model}...`);
  
  try {
    // Try to use extractReasoningMiddleware for DeepSeek models
    // Note: This might not work with AI Gateway
    const reasoningPrompt = `Solve this step by step: What is 15% of 240?`;
    
    const result = await streamText({
      model: gateway(model),
      messages: [{ role: 'user', content: reasoningPrompt }],
      maxTokens: 2000
    });

    let fullResponse = '';
    let reasoningContent = '';
    let hasReasoningTokens = false;
    
    // Look for <think> tags in the response (DeepSeek R1 pattern)
    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        fullResponse += (part.textDelta || part.delta || '');
      }
    }
    
    // Check if response contains <think> tags
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    const thinkMatches = fullResponse.match(thinkRegex);
    
    if (thinkMatches) {
      hasReasoningTokens = true;
      reasoningContent = thinkMatches.map(match => 
        match.replace(/<\/?think>/g, '')
      ).join('\n');
      
      logWithTimestamp(`🧠 Found ${thinkMatches.length} <think> blocks in response`, 'info');
    }

    return {
      success: true,
      response: fullResponse,
      hasReasoningTokens,
      reasoningContent,
      duration: 0,
      validation: { hasContent: fullResponse.length > 0 }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      hasReasoningTokens: false,
      reasoningContent: '',
      duration: 0
    };
  }
}

// Test reasoning/thinking capabilities
async function testReasoning(model) {
  logWithTimestamp(`Testing reasoning capabilities with ${model}...`);
  
  try {
    const startTime = Date.now();

    // Use a problem that requires step-by-step reasoning
    const reasoningPrompt = `Solve this step by step: If a train leaves Chicago at 2 PM traveling at 60 mph, and another train leaves New York at 3 PM traveling at 80 mph toward Chicago, and the distance between cities is 800 miles, at what time will they meet? Show your reasoning process.`;

    // Configure reasoning settings based on provider
    let reasoningConfig = {};
    
    if (model.includes('anthropic/claude')) {
      console.log(`🧠 Enabling thinking for Anthropic model: ${model}`);
      reasoningConfig.thinking = { budget: 15000 };
    } else if (model.includes('google/gemini-2.5')) {
      console.log(`🧠 Enabling thinking for Google model: ${model}`);
      reasoningConfig.thinkingBudget = 10000;
      reasoningConfig.includeThoughts = true;
    } else if (model.includes('deepseek/deepseek-r1')) {
      console.log(`🧠 DeepSeek R1 model detected - using special test: ${model}`);
      // Use dedicated DeepSeek test that looks for <think> tags
      return await testDeepSeekReasoning(model);
    } else if (model.includes('openai/o') || model.includes('openai/gpt-5')) {
      console.log(`🧠 Potential OpenAI reasoning model: ${model}`);
      reasoningConfig.reasoningSummary = 'detailed';
    }

    const result = await streamText({
      model: gateway(model),
      messages: [{ role: 'user', content: reasoningPrompt }],
      maxTokens: 2000,
      ...reasoningConfig
    });

    let fullResponse = '';
    let hasReasoningTokens = false;
    let reasoningContent = '';
    let reasoningBlocks = [];
    
    // Check if we get reasoning tokens in the stream
    for await (const part of result.fullStream) {
      console.log('Stream part:', part.type, part); // Debug logging
      
      if (part.type === 'text-delta') {
        fullResponse += (part.textDelta || part.delta || '');
      } else if (part.type === 'reasoning-start') {
        hasReasoningTokens = true;
        logWithTimestamp(`🧠 Reasoning block started: ${part.id}`, 'info');
      } else if (part.type === 'reasoning-delta') {
        hasReasoningTokens = true;
        reasoningContent += (part.delta || '');
      } else if (part.type === 'reasoning-end') {
        hasReasoningTokens = true;
        reasoningBlocks.push(part.id);
        logWithTimestamp(`🧠 Reasoning block ended: ${part.id}`, 'info');
      } else if (part.type === 'reasoning') {
        // Alternative reasoning format
        hasReasoningTokens = true;
        reasoningContent += (part.text || part.content || '');
      }
    }

    // Also check if reasoning is available directly from result (as per docs)
    try {
      const resultReasoning = await result.reasoning;
      if (resultReasoning && resultReasoning.length > 0) {
        hasReasoningTokens = true;
        reasoningContent += resultReasoning;
        console.log('🧠 Found reasoning via result.reasoning property');
      }
    } catch (e) {
      // Reasoning property not available for this model
    }

    // Check usage for reasoning tokens
    const usage = await result.usage;
    if (usage && usage.reasoningTokens && usage.reasoningTokens > 0) {
      hasReasoningTokens = true;
      console.log(`🧠 Found ${usage.reasoningTokens} reasoning tokens in usage`);
    }

    // Debug: Log what reasoning content we actually found
    if (hasReasoningTokens) {
      console.log(`🔍 Debug - Reasoning content found: "${reasoningContent}"`);
      console.log(`🔍 Debug - Content length: ${reasoningContent.length}`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      success: true,
      response: fullResponse,
      hasReasoningTokens,
      reasoningContent,
      reasoningBlocks,
      duration,
      usage: await result.usage,
      validation: {
        hasContent: fullResponse.length > 0,
        hasStepByStep: fullResponse.toLowerCase().includes('step') || reasoningContent.toLowerCase().includes('step'),
        isReasonableLength: fullResponse.length > 50
      }
    };
  } catch (error) {
    logWithTimestamp(`Reasoning test failed: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message,
      duration: 0,
      hasReasoningTokens: false,
      reasoningContent: '',
      reasoningBlocks: [],
      validation: { isValid: false }
    };
  }
}

// Run comprehensive test suite
async function runTestSuite(modelToTest = null, scenarioToTest = null) {
  logWithTimestamp('Starting AI Gateway Test Suite', 'info');
  
  // Check environment
  if (!process.env.AI_GATEWAY_API_KEY) {
    logWithTimestamp('AI_GATEWAY_API_KEY not found in environment variables', 'error');
    process.exit(1);
  }

  const modelsToTest = modelToTest ? [modelToTest] : [
    MODELS.openai['gpt-4o'],
    MODELS.anthropic['claude-3-5-sonnet'],
    MODELS.google['gemini-1.5-flash']
  ];

  const scenariosToTest = scenarioToTest ? [TEST_SCENARIOS.find(s => s.name === scenarioToTest)] : TEST_SCENARIOS;

  for (const model of modelsToTest) {
    logWithTimestamp(`\n🚀 Testing model: ${model}`, 'info');
    
    for (const scenario of scenariosToTest) {
      if (!scenario) continue;
      
      logWithTimestamp(`\n📝 Running scenario: ${scenario.name}`, 'info');
      
      // Test streaming
      const streamResult = await testStreamingResponse(model, scenario);
      
      // Test generation
      const generateResult = await testGenerateResponse(model, scenario);
      
      // Store results
      testResults.push({
        model,
        scenario: scenario.name,
        streaming: streamResult,
        generation: generateResult,
        timestamp: new Date().toISOString()
      });

      // Log results
      if (streamResult.success && streamResult.validation.isValid) {
        logWithTimestamp(`✅ Streaming test passed (${streamResult.duration}ms, ${streamResult.chunkCount} chunks)`, 'success');
      } else {
        logWithTimestamp(`❌ Streaming test failed`, 'error');
      }

      if (generateResult.success && generateResult.validation.isValid) {
        logWithTimestamp(`✅ Generation test passed (${generateResult.duration}ms)`, 'success');
      } else {
        logWithTimestamp(`❌ Generation test failed`, 'error');
      }

      // Add delay between tests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test web search for Perplexity models
    if (model.includes('perplexity')) {
      logWithTimestamp(`\n🔍 Testing web search capabilities...`, 'info');
      const webSearchResult = await testWebSearch(model, 'What are the latest developments in AI in 2024?');
      
      testResults.push({
        model,
        scenario: 'Web Search',
        webSearch: webSearchResult,
        timestamp: new Date().toISOString()
      });

      if (webSearchResult.success && webSearchResult.validation.isValid) {
        logWithTimestamp(`✅ Web search test passed (${webSearchResult.duration}ms)`, 'success');
      } else {
        logWithTimestamp(`❌ Web search test failed`, 'error');
      }
    }
  }

  // Generate summary report
  generateSummaryReport();
}

// Generate summary report
function generateSummaryReport() {
  logWithTimestamp('\n📊 Test Summary Report', 'info');
  console.log('='.repeat(50));

  const summary = {
    totalTests: testResults.length,
    successfulTests: testResults.filter(r => 
      (r.streaming?.success && r.streaming?.validation?.isValid) ||
      (r.generation?.success && r.generation?.validation?.isValid) ||
      (r.webSearch?.success && r.webSearch?.validation?.isValid)
    ).length,
    failedTests: 0,
    averageResponseTime: 0
  };

  const allDurations = [];
  
  testResults.forEach(result => {
    if (result.streaming?.duration) allDurations.push(result.streaming.duration);
    if (result.generation?.duration) allDurations.push(result.generation.duration);
    if (result.webSearch?.duration) allDurations.push(result.webSearch.duration);
  });

  summary.failedTests = summary.totalTests - summary.successfulTests;
  summary.averageResponseTime = allDurations.length > 0 
    ? Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length)
    : 0;

  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Successful: ${summary.successfulTests} ✅`);
  console.log(`Failed: ${summary.failedTests} ❌`);
  console.log(`Success Rate: ${((summary.successfulTests / summary.totalTests) * 100).toFixed(1)}%`);
  console.log(`Average Response Time: ${summary.averageResponseTime}ms`);

  // Detailed results
  console.log('\n📝 Detailed Results:');
  testResults.forEach(result => {
    console.log(`\nModel: ${result.model}`);
    console.log(`Scenario: ${result.scenario}`);
    
    if (result.streaming) {
      console.log(`  Streaming: ${result.streaming.success ? '✅' : '❌'} (${result.streaming.duration}ms)`);
    }
    if (result.generation) {
      console.log(`  Generation: ${result.generation.success ? '✅' : '❌'} (${result.generation.duration}ms)`);
    }
    if (result.webSearch) {
      console.log(`  Web Search: ${result.webSearch.success ? '✅' : '❌'} (${result.webSearch.duration}ms)`);
    }
  });

  console.log('\n='.repeat(50));
}

// CLI interface
function showHelp() {
  console.log(`
AI Gateway Test Suite

Usage:
  node test-ai-gateway.mjs [options]

Options:
  --model <model>       Test specific model (e.g., openai/gpt-4o)
  --scenario <name>     Test specific scenario
  --list-models        Show all available models
  --list-scenarios     Show all available test scenarios
  --web-search         Test only web search functionality
  --reasoning          Test only reasoning/thinking token capabilities
  --help               Show this help message

Examples:
  node test-ai-gateway.mjs
  node test-ai-gateway.mjs --model openai/gpt-4o
  node test-ai-gateway.mjs --scenario "Simple Question"
  node test-ai-gateway.mjs --list-models
  node test-ai-gateway.mjs --web-search
  node test-ai-gateway.mjs --reasoning
`);
}

function listModels() {
  console.log('Available Models:');
  Object.entries(MODELS).forEach(([provider, models]) => {
    console.log(`\n${provider.toUpperCase()}:`);
    Object.entries(models).forEach(([name, value]) => {
      console.log(`  ${name}: ${value}`);
    });
  });
}

function listScenarios() {
  console.log('Available Test Scenarios:');
  TEST_SCENARIOS.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   Messages: ${scenario.messages.length}`);
    console.log(`   Expected: ${scenario.expectedKeywords.join(', ')}`);
    console.log('');
  });
}

async function testWebSearchOnly() {
  logWithTimestamp('Testing Web Search Functionality Only', 'info');
  
  const webSearchQueries = [
    'What are the latest AI developments in 2024?',
    'Current weather in San Francisco',
    'Recent news about OpenAI',
    'Latest cryptocurrency prices'
  ];

  for (const model of Object.values(MODELS.perplexity)) {
    logWithTimestamp(`\n🔍 Testing ${model}`, 'info');
    
    for (const query of webSearchQueries) {
      logWithTimestamp(`Query: "${query}"`, 'info');
      const result = await testWebSearch(model, query);
      
      if (result.success) {
        logWithTimestamp(`✅ Success (${result.duration}ms)`, 'success');
        console.log(`Response preview: ${result.response.substring(0, 100)}...`);
      } else {
        logWithTimestamp(`❌ Failed: ${result.error}`, 'error');
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function testReasoningOnly() {
  logWithTimestamp('Testing Reasoning Capabilities Only', 'info');
  
  // Test ALL available models for reasoning capabilities
  const allModels = [];
  
  // Collect all models from MODELS object
  Object.entries(MODELS).forEach(([, models]) => {
    Object.values(models).forEach(model => {
      allModels.push(model);
    });
  });
  
  logWithTimestamp(`Found ${allModels.length} total models to test for reasoning`, 'info');
  
  const potentialReasoningModels = allModels;

  const reasoningResults = [];

  let currentModel = 0;
  const totalModels = potentialReasoningModels.length;

  for (const model of potentialReasoningModels) {
    currentModel++;
    logWithTimestamp(`\n🧠 Testing reasoning capabilities: ${model} (${currentModel}/${totalModels})`, 'info');
    
    try {
      const result = await testReasoning(model);
      
      reasoningResults.push({
        model,
        ...result
      });

      if (result.success) {
        if (result.hasReasoningTokens) {
          logWithTimestamp(`✅ SUCCESS - Model supports reasoning tokens! (${result.duration}ms)`, 'success');
          console.log(`🧠 Reasoning content length: ${result.reasoningContent.length} characters`);
          if (result.reasoningContent.length > 0) {
            console.log(`🧠 Reasoning preview: ${result.reasoningContent.substring(0, 150)}...`);
          }
        } else {
          logWithTimestamp(`⚠️  Model responded but no reasoning tokens detected (${result.duration}ms)`, 'warning');
        }
        console.log(`📝 Response preview: ${result.response.substring(0, 100)}...`);
      } else {
        logWithTimestamp(`❌ Failed: ${result.error}`, 'error');
      }
    } catch (error) {
      logWithTimestamp(`❌ Unexpected error testing ${model}: ${error.message}`, 'error');
      reasoningResults.push({
        model,
        success: false,
        error: error.message,
        hasReasoningTokens: false,
        reasoningContent: '',
        duration: 0
      });
    }
    
    // Add delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary of reasoning capabilities
  console.log('\n' + '='.repeat(60));
  logWithTimestamp('🧠 REASONING CAPABILITIES SUMMARY', 'info');
  console.log('='.repeat(60));
  
  const modelsWithReasoning = reasoningResults.filter(r => r.hasReasoningTokens);
  const modelsWithoutReasoning = reasoningResults.filter(r => r.success && !r.hasReasoningTokens);
  const failedModels = reasoningResults.filter(r => !r.success);

  console.log(`\n✅ Models WITH reasoning tokens (${modelsWithReasoning.length}):`);
  modelsWithReasoning.forEach(r => {
    console.log(`   • ${r.model} - ${r.reasoningContent.length} reasoning chars`);
  });

  console.log(`\n⚠️  Models WITHOUT reasoning tokens (${modelsWithoutReasoning.length}):`);
  modelsWithoutReasoning.forEach(r => {
    console.log(`   • ${r.model}`);
  });

  console.log(`\n❌ Models that failed (${failedModels.length}):`);
  failedModels.forEach(r => {
    console.log(`   • ${r.model} - ${r.error}`);
  });

  console.log('\n' + '='.repeat(60));
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showHelp();
    return;
  }
  
  if (args.includes('--list-models')) {
    listModels();
    return;
  }
  
  if (args.includes('--list-scenarios')) {
    listScenarios();
    return;
  }
  
  if (args.includes('--web-search')) {
    await testWebSearchOnly();
    return;
  }
  
  if (args.includes('--reasoning')) {
    await testReasoningOnly();
    return;
  }
  
  const modelIndex = args.indexOf('--model');
  const scenarioIndex = args.indexOf('--scenario');
  
  const modelToTest = modelIndex !== -1 ? args[modelIndex + 1] : null;
  const scenarioToTest = scenarioIndex !== -1 ? args[scenarioIndex + 1] : null;
  
  await runTestSuite(modelToTest, scenarioToTest);
}

// Run the script
main().catch(error => {
  logWithTimestamp(`Script execution failed: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});