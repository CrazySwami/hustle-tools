// Image analysis API using Claude Haiku 4.5 vision
import { gateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';
import { apiMonitor } from '@/lib/api-monitor';

export const maxDuration = 60;

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return Response.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log('📸 Analyzing image with Claude Haiku 4.5 via AI Gateway...');

    // Use Claude Haiku 4.5 for detailed image analysis via AI Gateway
    const result = await generateText({
      model: gateway('anthropic/claude-haiku-4-5-20251001', {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: imageUrl,
            },
            {
              type: 'text',
              text: `Analyze this image in extreme detail for the purpose of recreating it as HTML/CSS/JavaScript. Describe:

1. **Layout & Structure**
   - Overall layout pattern (grid, flexbox, columns, etc.)
   - Section arrangement and hierarchy
   - Spacing, padding, margins (approximate values)

2. **Visual Design**
   - Color palette (specific hex codes if identifiable)
   - Typography (font families, sizes, weights, line heights)
   - Backgrounds (colors, gradients, patterns, images)
   - Borders, shadows, and effects

3. **Components & Elements**
   - Headers, navigation, hero sections
   - Buttons, forms, cards, lists
   - Icons, images, graphics
   - Interactive elements

4. **Responsive Considerations**
   - Mobile vs desktop layout differences
   - Breakpoint suggestions
   - Adaptive spacing and sizing

5. **Special Features**
   - Animations or transitions visible
   - Interactive states (hover, active, etc.)
   - Any JavaScript functionality implied

Be extremely detailed and specific. This description will be used to generate exact HTML/CSS/JS code.`,
            },
          ],
        },
      ],
    });

    console.log('✅ Image analysis complete');

    // Log successful image analysis
    apiMonitor.log({
      endpoint: '/api/analyze-image',
      method: 'POST',
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      responseStatus: 200,
      responseTime: Date.now() - startTime,
      success: true,
      promptTokens: result.usage?.promptTokens || 0,
      completionTokens: result.usage?.completionTokens || 0,
      totalTokens: (result.usage?.promptTokens || 0) + (result.usage?.completionTokens || 0),
    });

    return Response.json({
      description: result.text,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    apiMonitor.log({
      endpoint: '/api/analyze-image',
      method: 'POST',
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      responseStatus: 500,
      responseTime: Date.now() - startTime,
      success: false,
      error: error.message || 'Image analysis failed',
    });

    console.error('❌ Image analysis error:', error);
    return Response.json(
      {
        error: error.message || 'Image analysis failed',
      },
      { status: 500 }
    );
  }
}
