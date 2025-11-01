import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { apiMonitor } from '@/lib/api-monitor';

export const maxDuration = 60;

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const {
      prompt,
      desktopMockup,
      tabletMockup,
      mobileMockup,
      model = 'anthropic/claude-haiku-4.5-20251022', // Default to Claude Haiku 4.5
    } = await req.json();

    if (!prompt && !desktopMockup) {
      return Response.json(
        { success: false, error: 'Either prompt or mockup is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert web developer. Generate clean, modern, responsive HTML/CSS/JS code that integrates with existing style kits.

DESIGN PHILOSOPHY:
- Generate ONLY structural HTML and layout-specific CSS
- DO NOT add opinionated fonts, colors, or decorative styles
- User will provide typography and color styles via their style kit
- Focus on layout, spacing, and responsive structure

HTML REQUIREMENTS:
1. Generate semantic HTML5 elements (section, article, header, footer, nav, etc.)
2. Use descriptive class names (e.g., hero, card, grid, container)
3. NO DOCTYPE, <html>, <head>, <body>, or <title> tags
4. Body content only - ready to inject into existing page

CSS REQUIREMENTS:
1. Write ONLY layout and structural CSS (Grid, Flexbox, spacing, sizing)
2. DO NOT specify: font-family, font-size, color, background-color (unless part of layout like overlays)
3. Use CSS custom properties for any values that might vary: var(--spacing), var(--border-radius)
4. Make responsive with mobile-first approach
5. NO frameworks (Bootstrap, Tailwind, etc.) unless explicitly requested

JAVASCRIPT REQUIREMENTS:
1. Add ONLY if absolutely necessary for interactivity
2. Keep vanilla JS - no jQuery or other libraries unless requested
3. Use modern ES6+ syntax

CRITICAL OUTPUT FORMAT:
You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no explanations.

JSON Structure:
{
  "html": "your HTML code here",
  "css": "your CSS code here",
  "js": "your JavaScript code here"
}

STRICT RULES:
1. ONLY output raw JSON - start with { and end with }
2. ALL THREE keys must be present (use empty string "" if no code needed)
3. DO NOT wrap in markdown code blocks (no \`\`\`json)
4. DO NOT add any text before or after the JSON
5. HTML: body content only, no <html>/<head>/<body>/<!DOCTYPE> tags
6. CSS: styles only, no <style> tags
7. JS: code only, no <script> tags
8. Properly escape all strings (newlines as \\n, quotes as \\")
9. DO NOT include: font-family, font-size, color, background-color (user's style kit handles this)
10. Test that your JSON is valid before responding

Example of CORRECT output:
{"html":"<section class=\\"hero\\"><h1>Welcome</h1></section>","css":".hero{display:flex;align-items:center;min-height:400px;padding:var(--spacing-lg);}","js":""}`;


    // Build message content with images if provided
    const messageContent: any[] = [];

    if (desktopMockup) {
      messageContent.push({
        type: 'image',
        image: desktopMockup,
      });
      messageContent.push({
        type: 'text',
        text: 'Desktop mockup above.',
      });
    }

    if (tabletMockup) {
      messageContent.push({
        type: 'image',
        image: tabletMockup,
      });
      messageContent.push({
        type: 'text',
        text: 'Tablet mockup above.',
      });
    }

    if (mobileMockup) {
      messageContent.push({
        type: 'image',
        image: mobileMockup,
      });
      messageContent.push({
        type: 'text',
        text: 'Mobile mockup above.',
      });
    }

    let finalPrompt = 'Generate HTML/CSS/JS that recreates this design.';
    if (prompt) {
      finalPrompt += `\n\nAdditional requirements:\n${prompt}`;
    }

    messageContent.push({
      type: 'text',
      text: finalPrompt,
    });

    const result = streamText({
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      temperature: 0.7,
      maxTokens: 8000,
      onFinish: async ({ usage }) => {
        const responseTime = Date.now() - startTime;
        const [provider, modelName] = model.includes('/')
          ? model.split('/')
          : ['unknown', model];

        apiMonitor.log({
          endpoint: '/api/generate-html',
          method: 'POST',
          provider,
          model: modelName || model,
          responseStatus: 200,
          responseTime,
          success: true,
          promptTokens: usage?.promptTokens || 0,
          completionTokens: usage?.completionTokens || 0,
          totalTokens: usage?.totalTokens || 0,
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    apiMonitor.log({
      endpoint: '/api/generate-html',
      method: 'POST',
      provider: 'unknown',
      model: 'unknown',
      responseStatus: 500,
      responseTime,
      success: false,
      error: error.message || 'Generation failed',
    });

    console.error('HTML generation error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Generation failed',
      },
      { status: 500 }
    );
  }
}
