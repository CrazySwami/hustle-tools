import { streamText } from 'ai';

export const maxDuration = 10;

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    console.log('🎯 Classifying intent for:', transcript);

    const systemPrompt = `You are an intent classifier for a voice assistant.

Analyze the user's request and determine if it needs:
1. BACKGROUND_PROCESSING - Complex tasks requiring detailed work (writing, analysis, research, code generation, etc.)
2. CONVERSATION - Simple questions, greetings, or clarifications that can be answered quickly

Examples:
- "Write me a story about dogs" → BACKGROUND_PROCESSING
- "How's the weather?" → CONVERSATION
- "What did you just say?" → CONVERSATION
- "Create a marketing plan for my product" → BACKGROUND_PROCESSING
- "Tell me a joke" → CONVERSATION
- "Analyze this data and give me insights" → BACKGROUND_PROCESSING

USER REQUEST: "${transcript}"

Respond with ONLY one word: either "BACKGROUND_PROCESSING" or "CONVERSATION"`;

    const result = await streamText({
      model: 'anthropic/claude-haiku-4-5-20251001', // Fast model for quick classification
      prompt: systemPrompt,
      maxTokens: 10,
    });

    const classification = (await result.text).trim().toUpperCase();

    console.log('✅ Classification:', classification);

    return Response.json({
      classification: classification.includes('BACKGROUND') ? 'BACKGROUND_PROCESSING' : 'CONVERSATION'
    });
  } catch (error: any) {
    console.error('❌ Classification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
