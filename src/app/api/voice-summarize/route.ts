import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      fullResponse,
      conversationContext,
      summarizerModel = 'anthropic/claude-haiku-4-5-20251001',
      summaryStyle = 'concise' // 'concise' or 'high-level'
    } = await req.json();

    console.log('📝 Summarizing response for voice delivery...');
    console.log('📊 Full response length:', fullResponse?.length || 0, 'characters');
    console.log('🎨 Summary style:', summaryStyle);

    let systemPrompt = '';

    if (summaryStyle === 'high-level') {
      // High-level bullet-point style (like 5-page essay → bullet points)
      systemPrompt = `You are a voice assistant delivering a high-level summary of detailed work.

CONVERSATION CONTEXT:
${JSON.stringify(conversationContext, null, 2)}

INSTRUCTIONS:
1. Provide a HIGH-LEVEL overview (like bullet points for a detailed essay)
2. Cover the main points/sections (3-5 key items)
3. Keep each point concise but informative (1 sentence per point)
4. Sound natural when spoken aloud
5. Total length: 60-90 words
6. DO NOT use actual bullet points or numbers - speak naturally
7. Use transitions like "First...", "Also...", "Additionally...", "Finally..."

Example:
"Alright, here's what I created for you. First, I wrote a complete story about two dogs meeting in a park with dialogue and character development. I also built a clean HTML page with proper structure and styling to display the story nicely. Additionally, I added some CSS to make it look polished with nice fonts and spacing. The whole thing is ready to open in any browser."

DETAILED CONTENT TO SUMMARIZE:
${fullResponse}

HIGH-LEVEL SUMMARY:`;
    } else {
      // Concise style (original 1-2 sentences)
      systemPrompt = `You are a conversational voice agent. Your role is to deliver concise verbal summaries.

CONVERSATION CONTEXT:
${JSON.stringify(conversationContext, null, 2)}

INSTRUCTIONS:
1. Condense the message below into 1-2 natural spoken sentences (max 25 words)
2. Sound human and conversational (like talking to a friend)
3. Match the tone: ${conversationContext?.overallSentiment || 'neutral, friendly'}
4. Keep it engaging and warm
5. DO NOT say "Here's a summary" - just deliver the content naturally

MESSAGE TO SUMMARIZE:
${fullResponse}

VERBAL SUMMARY:`;
    }

    const result = await streamText({
      model: summarizerModel,
      prompt: systemPrompt,
      maxTokens: summaryStyle === 'high-level' ? 150 : 100,
    });

    console.log('✅ Summary generation started');

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('❌ Summarization error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
