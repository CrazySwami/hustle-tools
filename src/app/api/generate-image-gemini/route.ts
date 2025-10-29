import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      aspectRatio = '1:1',
      numberOfImages = 1,
      model = 'gemini-2.5-flash-image-preview'
    } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY;

    if (!apiKey) {
      throw new Error('AI_GATEWAY_API_KEY not configured');
    }

    // Use Gemini 2.5 Flash Image Preview via AI Gateway
    // This model supports native image generation with TEXT and IMAGE output modalities
    const result = await generateText({
      model: gateway(`google/${model}`, {
        apiKey,
      }),
      prompt: `Generate an image based on this description: ${prompt}`,
      providerOptions: {
        google: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      },
    });

    // Extract image data from result.files
    // Gemini returns generated images as GeneratedFile objects in the files array
    const imageFiles = result.files?.filter((f: any) =>
      f.mediaType?.startsWith('image/')
    ) || [];

    if (imageFiles.length === 0) {
      throw new Error('No image generated from Gemini Flash');
    }

    // Get the first generated image
    const imageFile = imageFiles[0];
    const imageUrl = `data:${imageFile.mediaType};base64,${imageFile.base64}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt,
      model,
      text: result.text, // May include description from model
    });

  } catch (error: any) {
    console.error('Gemini Flash image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image with Gemini Flash' },
      { status: 500 }
    );
  }
}
