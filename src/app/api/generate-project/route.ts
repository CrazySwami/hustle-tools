import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { getProjectConfig } from '@/lib/project-generation/config';

export const maxDuration = 60;

/**
 * Unified Project Generation API
 *
 * Supports: HTML sections, Elementor widgets, HubSpot modules (email/page)
 * Uses centralized project-generation system for consistency
 */
export async function POST(req: Request) {
  try {
    const {
      description,
      projectType,
      subtype,
      hubspotModuleType,
      model = 'anthropic/claude-sonnet-4-5-20250929',
      images = []
    } = await req.json();

    console.log('🚀 Unified Project Generation:', { projectType, subtype, hubspotModuleType, model, imageCount: images.length });

    // Determine the effective subtype (handles both 'subtype' and 'hubspotModuleType' for backward compatibility)
    const effectiveSubtype = subtype || hubspotModuleType;

    // Get project configuration (system prompt, parser, etc.)
    const config = getProjectConfig(projectType, effectiveSubtype);
    if (!config) {
      return new Response(JSON.stringify({ error: `Unknown project type: ${projectType}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build user message with optional images
    const userMessage: any = {
      role: 'user',
      content: []
    };

    // Add text description
    userMessage.content.push({
      type: 'text',
      text: description
    });

    // Add images for vision analysis (if provided)
    if (images && images.length > 0) {
      for (const img of images) {
        userMessage.content.push({
          type: 'image',
          image: img.url || img // Support both {url} and direct data URL
        });
      }
    }

    console.log('🤖 Model config:', { model });

    // Stream generation using AI Gateway
    const result = await streamText({
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      system: config.systemPrompt,
      messages: [userMessage],
      maxTokens: 8192,
      onFinish: async ({ usage, finishReason }) => {
        // Log usage after streaming completes
        console.log('📊 Generation complete. Usage:', usage);
        console.log('📊 Finish reason:', finishReason);
      },
    });

    // Use built-in toTextStreamResponse() - recommended by AI SDK docs
    // This properly handles backpressure and streaming
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('❌ Generation error:', error);
    console.error('❌ Error stack:', error.stack);
    return new Response(JSON.stringify({
      error: error.message || 'Generation failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
