import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { apiMonitor } from '@/lib/api-monitor';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { prompt, referenceImageUrl, editType = 'general' } = await req.json();

    if (!prompt || !referenceImageUrl) {
      return NextResponse.json(
        { error: 'Prompt and reference image are required' },
        { status: 400 }
      );
    }

    // Fetch the reference image and convert to base64
    const imageResponse = await fetch(referenceImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const apiKey = process.env.AI_GATEWAY_API_KEY;

    if (!apiKey) {
      throw new Error('AI_GATEWAY_API_KEY not configured');
    }

    // Use Gemini 2.5 Flash Image Preview for image-to-image editing
    // Pass the reference image as a message part
    const result = await generateText({
      model: gateway('google/gemini-2.5-flash-image-preview', {
        apiKey,
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: imageBase64,
              mimeType,
            },
            {
              type: 'text',
              text: `Edit this image based on the following instructions: ${prompt}. Generate a new edited version of the image.`,
            },
          ],
        },
      ],
      providerOptions: {
        google: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      },
    });

    // Extract image data from result.files
    const imageFiles = result.files?.filter((f: any) =>
      f.mediaType?.startsWith('image/')
    ) || [];

    if (imageFiles.length === 0) {
      throw new Error('No edited image generated from Gemini Flash');
    }

    // Get the first generated image
    const imageFile = imageFiles[0];
    const imageUrl = `data:${imageFile.mediaType};base64,${imageFile.base64}`;

    // Log successful image editing
    apiMonitor.log({
      endpoint: '/api/edit-image-gemini',
      method: 'POST',
      provider: 'google',
      model: 'gemini-2.5-flash-image-preview',
      responseStatus: 200,
      responseTime: Date.now() - startTime,
      success: true,
      // Image APIs don't return token counts - cost calculated by pricing table
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt,
      text: result.text, // May include description from model
    });
  } catch (error: any) {
    apiMonitor.log({
      endpoint: '/api/edit-image-gemini',
      method: 'POST',
      provider: 'google',
      model: 'unknown',
      responseStatus: 500,
      responseTime: Date.now() - startTime,
      success: false,
      error: error.message || 'Failed to edit image with Gemini Flash',
    });

    console.error('Gemini image editing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to edit image with Gemini Flash' },
      { status: 500 }
    );
  }
}
