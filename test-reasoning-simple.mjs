#!/usr/bin/env node

import { createGateway } from '@ai-sdk/gateway';
import { streamText } from 'ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY
});

// Test only models that should actually support reasoning
const KNOWN_REASONING_MODELS = [
  // OpenAI reasoning models (if available)
  'openai/o1-preview',
  'openai/o1-mini',
  
  // Anthropic with thinking (if available through gateway)
  'anthropic/claude-3-5-sonnet-20241022',
  'anthropic/claude-opus-4-20250514',
  'anthropic/claude-3-7-sonnet-20250219',
  
  // Perplexity reasoning models
  'perplexity/sonar-reasoning',
  'perplexity/sonar-reasoning-pro',
  
  // DeepSeek reasoning models
  'deepseek/deepseek-r1',
  'deepseek/deepseek-r1-distill-llama-70b'
];

async function testModelReasoning(model) {
  console.log(`\n🧠 Testing ${model} for reasoning capabilities...`);
  
  try {
    // Configure reasoning settings by provider
    let config = {};
    
    if (model.includes('anthropic')) {
      config.thinking = { budget: 10000 };
      console.log('   📝 Using Anthropic thinking config');
    } else if (model.includes('openai/o')) {
      config.reasoningSummary = 'detailed';
      console.log('   📝 Using OpenAI reasoning config');
    } else if (model.includes('deepseek')) {
      console.log('   📝 DeepSeek model - should have built-in reasoning');
    } else if (model.includes('perplexity')) {
      console.log('   📝 Perplexity reasoning model');
    }

    const result = await streamText({
      model: gateway(model),
      messages: [{ 
        role: 'user', 
        content: 'Solve step by step: A train travels 120 miles in 2 hours. Another train travels 180 miles in 3 hours. Which train is faster and by how much?' 
      }],
      maxTokens: 1500,
      ...config
    });

    let fullText = '';
    let hasReasoningParts = false;
    let reasoningContent = '';
    
    console.log('   🔍 Analyzing stream parts...');
    
    for await (const part of result.fullStream) {
      console.log(`     Part type: ${part.type}`);
      
      if (part.type === 'text-delta') {
        fullText += (part.textDelta || part.delta || '');
      } else if (part.type.includes('reasoning')) {
        hasReasoningParts = true;
        console.log(`     ✅ Found reasoning part: ${part.type}`);
        if (part.delta) reasoningContent += part.delta;
        if (part.text) reasoningContent += part.text;
      }
    }

    // Check usage for reasoning tokens
    const usage = await result.usage;
    const hasReasoningTokens = usage?.reasoningTokens > 0;
    
    // Check for <think> tags (DeepSeek style)
    const hasThinkTags = fullText.includes('<think>');
    
    // Try to access reasoning property
    let directReasoning = '';
    try {
      directReasoning = await result.reasoning || '';
    } catch (e) {
      // Not available
    }

    console.log(`\n   📊 Results for ${model}:`);
    console.log(`     • Response length: ${fullText.length} chars`);
    console.log(`     • Reasoning stream parts: ${hasReasoningParts ? '✅' : '❌'}`);
    console.log(`     • Reasoning tokens in usage: ${hasReasoningTokens ? `✅ (${usage.reasoningTokens})` : '❌'}`);
    console.log(`     • <think> tags found: ${hasThinkTags ? '✅' : '❌'}`);
    console.log(`     • Direct reasoning property: ${directReasoning.length > 0 ? `✅ (${directReasoning.length} chars)` : '❌'}`);
    console.log(`     • Reasoning content: ${reasoningContent.length} chars`);
    
    if (fullText.length > 0) {
      console.log(`     • Response preview: "${fullText.substring(0, 100)}..."`);
    }
    
    const supportsReasoning = hasReasoningParts || hasReasoningTokens || hasThinkTags || directReasoning.length > 0;
    
    return {
      model,
      supportsReasoning,
      hasReasoningParts,
      hasReasoningTokens,
      hasThinkTags,
      directReasoningLength: directReasoning.length,
      reasoningContentLength: reasoningContent.length,
      responseLength: fullText.length,
      success: true
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      model,
      supportsReasoning: false,
      error: error.message,
      success: false
    };
  }
}

async function main() {
  console.log('🚀 Testing Known Reasoning Models\n');
  
  const results = [];
  
  for (const model of KNOWN_REASONING_MODELS) {
    const result = await testModelReasoning(model);
    results.push(result);
    
    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const withReasoning = results.filter(r => r.supportsReasoning);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Models that support reasoning (${withReasoning.length}):`);
  withReasoning.forEach(r => {
    console.log(`   • ${r.model}`);
    if (r.hasReasoningParts) console.log(`     - Has reasoning stream parts`);
    if (r.hasReasoningTokens) console.log(`     - Has reasoning tokens in usage`);
    if (r.hasThinkTags) console.log(`     - Has <think> tags`);
    if (r.directReasoningLength > 0) console.log(`     - Has direct reasoning property (${r.directReasoningLength} chars)`);
  });
  
  console.log(`\n⚠️  Models without reasoning support (${successful.length - withReasoning.length}):`);
  successful.filter(r => !r.supportsReasoning).forEach(r => {
    console.log(`   • ${r.model}`);
  });
  
  console.log(`\n❌ Models that failed (${failed.length}):`);
  failed.forEach(r => {
    console.log(`   • ${r.model} - ${r.error}`);
  });
  
  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);