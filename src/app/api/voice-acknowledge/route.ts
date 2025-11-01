import { streamText } from 'ai';

export const maxDuration = 10;

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    console.log('⚡ Instant acknowledgment for:', transcript);

    const systemPrompt = `You are a voice assistant that gives INSTANT acknowledgments.

USER REQUEST: "${transcript}"

Analyze the request and generate a brief, natural acknowledgment (MAX 12 words) that:
1. Shows you understood the request
2. Confirms you're working on it
3. Feels conversational and human

Examples:
- "Write me a story about dogs" → "Cool! I'll write you that story, give me a sec."
- "What's the weather?" → "Let me check the weather for you!"
- "Explain quantum physics" → "Great question! Let me think about that..."
- "Hello how are you?" → "Hey! I'm doing great, how can I help you?"

Return ONLY the acknowledgment text (no JSON, no quotes, just the text).`;

    const result = await streamText({
      model: 'anthropic/claude-haiku-4-5-20251001', // Fastest model
      prompt: systemPrompt,
      maxTokens: 30, // Keep it short!
    });

    // Stream the response directly to client (they can speak as soon as first chunk arrives!)
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('❌ Acknowledgment error:', error);
    // Fallback acknowledgment
    return Response.json({
      acknowledgment: "Got it! One moment..."
    });
  }
}
