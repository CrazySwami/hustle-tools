import { streamText } from 'ai';

export const maxDuration = 15;

export async function POST(req: Request) {
  try {
    const { task } = await req.json();

    console.log('💬 Generating fluff for task:', task);

    const systemPrompt = `You are a voice assistant speaking to the user while a complex task runs in the background.

TASK IN PROGRESS: "${task}"

Generate conversational "bridge content" that:
1. Confirms the task is running in the background RIGHT NOW
2. Explains what's happening at a high level (2-3 sentences)
3. Sets expectations for what they'll get when it's done
4. Feels natural and human, like you're keeping them company

Tone: Friendly, conversational, enthusiastic but not over-the-top

Examples:
- "Write a story with HTML" → "Perfect! I've started working on that story with the HTML page in the background. While that's processing, I'm crafting a narrative and structuring the code so it looks great in a browser. You'll have a complete story with clean HTML when this finishes."

- "Analyze this data report" → "Got it! The analysis is running now in the background. I'm digging through the data points, looking for patterns and key insights. In a moment, I'll have a summary of the main findings for you."

Generate 40-60 words of natural speech. DO NOT use phrases like "Let me tell you" or "Here's what's happening" - just speak naturally.`;

    const result = await streamText({
      model: 'anthropic/claude-haiku-4-5-20251001',
      prompt: systemPrompt,
      maxTokens: 100,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('❌ Fluff generation error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      fluff: "I'm working on that for you right now in the background. Give me just a moment!"
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
