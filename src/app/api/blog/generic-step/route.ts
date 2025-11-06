import { NextRequest, NextResponse } from 'next/server';
import { generateText, streamText } from 'ai';
import { createAIProvider } from '@/lib/ai-provider';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const {
      stepId,
      prompt,
      model = 'anthropic/claude-sonnet-4-5-20250929',
      temperature,
      maxTokens,
      enableTools,
      responseType = 'text',
      jsonSchema,
      context
    } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log(`🎯 Generic Step API: ${stepId}`, {
      model,
      responseType,
      hasJsonSchema: !!jsonSchema,
      hasContext: !!context
    });

    // Build context string from available data
    let contextString = '';
    if (context) {
      if (context.contentForm) {
        contextString += `\n\n## Content Form:\n`;
        contextString += `Business: ${context.contentForm.businessName}\n`;
        contextString += `Niche: ${context.contentForm.niche}\n`;
        contextString += `Target Audience: ${context.contentForm.targetAudience}\n`;
        contextString += `Keywords: ${context.contentForm.keywords?.join(', ')}\n`;
        contextString += `Geo Locations: ${context.contentForm.geoLocations}\n`;
      }

      if (context.research) {
        contextString += `\n\n## Research:\n${context.research.substring(0, 1000)}...\n`;
      }

      if (context.outline) {
        contextString += `\n\n## Outline:\n${context.outline}\n`;
      }

      if (context.content) {
        contextString += `\n\n## Generated Content:\n${context.content.substring(0, 1000)}...\n`;
      }

      // Add any step responses that are available
      if (context.stepResponses && Object.keys(context.stepResponses).length > 0) {
        contextString += `\n\n## Previous Step Results:\n`;
        Object.entries(context.stepResponses).forEach(([id, response]: [string, any]) => {
          contextString += `\n### ${id.toUpperCase()}:\n${typeof response === 'string' ? response.substring(0, 500) : JSON.stringify(response).substring(0, 500)}...\n`;
        });
      }
    }

    const fullPrompt = contextString ? `${prompt}\n\n## Available Context:${contextString}` : prompt;

    // Parse model string to get provider and model name
    const [provider, ...modelParts] = model.split('/');
    const modelName = modelParts.join('/');

    const aiProvider = createAIProvider(provider, modelName);

    // Handle structured responses with JSON schema
    if (responseType === 'structured' && jsonSchema) {
      try {
        const parsedSchema = JSON.parse(jsonSchema);

        const { text } = await generateText({
          model: aiProvider,
          prompt: fullPrompt,
          temperature: temperature || 0.7,
          maxTokens: maxTokens || 4000,
          experimental_output: {
            schema: parsedSchema
          }
        });

        console.log('✅ Structured response generated');
        return NextResponse.json({ result: text });
      } catch (error) {
        console.error('❌ Structured generation error:', error);
        throw error;
      }
    }

    // Default text response
    const { text } = await generateText({
      model: aiProvider,
      prompt: fullPrompt,
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 4000
    });

    console.log('✅ Text response generated');
    return NextResponse.json({ result: text });

  } catch (error: any) {
    console.error('❌ Generic Step API error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process step',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
