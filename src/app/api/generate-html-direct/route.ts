// Direct OpenAI API for HTML generation (matching chat implementation)
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const {
      prompt,
      desktopMockup,
      tabletMockup,
      mobileMockup,
      model = 'gpt-5',
      reasoningEffort = 'medium',
    } = await req.json();

    if (!prompt && !desktopMockup) {
      return Response.json(
        { success: false, error: 'Either prompt or mockup is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert web developer. Generate clean, modern, responsive HTML/CSS/JS code.

INSTRUCTIONS:
1. Generate semantic HTML5 code
2. Write clean, well-organized CSS (no frameworks unless requested)
3. Add JavaScript only if needed for interactivity
4. Make the design responsive and pixel-perfect
5. Use modern best practices (CSS Grid, Flexbox, custom properties)

CRITICAL OUTPUT FORMAT REQUIREMENTS:
You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no explanations before or after.

The JSON must follow this EXACT structure:
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
5. HTML goes in "html" key (body content only, no <html>/<head>/<body> tags)
6. CSS goes in "css" key (styles only, no <style> tags)
7. JS goes in "js" key (code only, no <script> tags)
8. Ensure all strings are properly escaped (newlines as \\n, quotes as \\", etc.)
9. Keep the code concise but complete - avoid unnecessarily verbose code
10. Test that your JSON is valid before responding

Example of CORRECT output:
{"html":"<div class=\\"hero\\">Hello</div>","css":".hero{color:blue;}","js":"console.log('ready');"}`;

    // Build message content with images if provided
    const messageContent: any[] = [];

    if (desktopMockup) {
      messageContent.push({
        type: 'image_url',
        image_url: { url: desktopMockup, detail: 'high' }
      });
      messageContent.push({
        type: 'text',
        text: 'Desktop mockup above.',
      });
    }

    if (tabletMockup) {
      messageContent.push({
        type: 'image_url',
        image_url: { url: tabletMockup, detail: 'high' }
      });
      messageContent.push({
        type: 'text',
        text: 'Tablet mockup above.',
      });
    }

    if (mobileMockup) {
      messageContent.push({
        type: 'image_url',
        image_url: { url: mobileMockup, detail: 'high' }
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

    const apiKey = process.env.OPENAI_API_KEY;

    const requestBody: any = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageContent }
      ],
      max_completion_tokens: 100000, // GPT-5 max output tokens
      stream: true,
      stream_options: { include_usage: true },
    };

    // Add reasoning effort for GPT-5 models (no temperature parameter for these models)
    if (model.includes('gpt-5') || model.includes('o3') || model.includes('o1')) {
      requestBody.reasoning_effort = reasoningEffort;
    } else {
      // Only add temperature for non-reasoning models
      requestBody.temperature = 0.7;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI error:', error);
      return Response.json(
        { error: error.error?.message || 'API request failed' },
        { status: response.status }
      );
    }

    // Return the stream directly (same as chat)
    console.log('✅ Streaming HTML generation response from OpenAI');
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
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
