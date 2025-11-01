import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
      model = 'anthropic/claude-haiku-4-5-20251001',
      conversationContext
    } = await req.json();

    console.log('💬 Voice chat request:', { model, messageCount: messages?.length || 0 });
    console.log('🎯 Conversation context:', conversationContext);

    // Validate messages
    if (!messages || messages.length === 0) {
      console.error('❌ No messages provided');
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build system prompt with conversation context
    const systemPrompt = `You are a helpful AI assistant in a voice chat conversation.

CONVERSATION CONTEXT:
- Overall sentiment: ${conversationContext?.overallSentiment || 'neutral, friendly'}
- Direction: ${conversationContext?.conversationDirection || 'general conversation'}
- Recent topics: ${conversationContext?.topics?.join(', ') || 'none yet'}

Respond naturally and conversationally. Your response will be summarized for voice delivery,
but also shown in full text to the user.`;

    // Format messages for the API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log('📝 Formatted messages:', formattedMessages);

    const result = await streamText({
      model,
      system: systemPrompt,
      messages: formattedMessages,
    });

    console.log('✅ Voice chat response streaming started');

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('❌ Voice chat error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
