import { NextRequest, NextResponse } from 'next/server';
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      model = 'dall-e-3',  // 'dall-e-3' or 'gpt-image-1'
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid'
    } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build provider options for OpenAI
    const providerOptions: any = {};

    // DALL-E 3 specific parameters
    if (model === 'dall-e-3') {
      providerOptions.openai = {
        quality: quality as 'standard' | 'hd',
        style: style as 'vivid' | 'natural',
      };
    }

    // gpt-image-1 specific parameters
    if (model === 'gpt-image-1') {
      // quality for gpt-image-1: 'low', 'medium', 'high'
      const gptQuality = quality === 'hd' ? 'high' : quality === 'standard' ? 'medium' : 'low';
      providerOptions.openai = {
        quality: gptQuality,
      };
    }

    // Generate image using Vercel AI SDK
    const result = await generateImage({
      model: openai.image(model),
      prompt,
      size,
      providerOptions: Object.keys(providerOptions).length > 0 ? providerOptions : undefined,
    });

    // Convert base64 to data URL
    const imageUrl = `data:image/png;base64,${result.image.base64}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      model,
    });
  } catch (error: any) {
    console.error('OpenAI image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
