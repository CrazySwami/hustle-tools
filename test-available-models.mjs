#!/usr/bin/env node

import { createGateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY
});

// Test which models are actually available
const testModels = [
  // OpenAI
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/gpt-4-turbo',
  'openai/gpt-3.5-turbo',
  'openai/o3-mini',
  'openai/o1-preview',
  'openai/o1-mini',
  
  // Anthropic
  'anthropic/claude-3-5-sonnet-20241022',
  'anthropic/claude-opus-4-20250514',
  'anthropic/claude-sonnet-4-20250514',
  'anthropic/claude-3-7-sonnet-20250219',
  'anthropic/claude-3-opus-20240229',
  'anthropic/claude-3-haiku-20240307',
  
  // Google
  'google/gemini-2.0-flash-exp',
  'google/gemini-1.5-pro',
  'google/gemini-1.5-flash',
  
  // xAI
  'xai/grok-3',
  'xai/grok-2',
  
  // Perplexity
  'perplexity/sonar',
  'perplexity/sonar-pro',
  
  // DeepSeek
  'deepseek/deepseek-r1',
  'deepseek/deepseek-v3'
];

async function testModelAvailability() {
  console.log('🚀 Testing Model Availability in Vercel AI Gateway\n');
  
  const results = {
    available: [],
    unavailable: []
  };

  for (const model of testModels) {
    try {
      console.log(`Testing ${model}...`);
      
      const result = await generateText({
        model: gateway(model),
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 10
      });

      if (result.text) {
        console.log(`✅ ${model} - AVAILABLE`);
        results.available.push(model);
      }
    } catch (error) {
      console.log(`❌ ${model} - NOT AVAILABLE (${error.message.split(':')[0]})`);
      results.unavailable.push({ model, error: error.message.split(':')[0] });
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✅ AVAILABLE MODELS (${results.available.length}):`);
  results.available.forEach(model => console.log(`   • ${model}`));
  
  console.log(`\n❌ UNAVAILABLE MODELS (${results.unavailable.length}):`);
  results.unavailable.forEach(({ model, error }) => console.log(`   • ${model} - ${error}`));
  
  console.log('\n' + '='.repeat(60));
}

testModelAvailability().catch(console.error);