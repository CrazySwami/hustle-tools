import { streamText } from 'ai';
import { apiMonitor } from '@/lib/api-monitor';

export const maxDuration = 30;

export async function POST(req: Request) {
  const startTime = Date.now();

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
      onFinish: async ({ usage }) => {
        const responseTime = Date.now() - startTime;
        const [provider, modelName] = model.includes('/')
          ? model.split('/')
          : ['unknown', model];

        apiMonitor.log({
          endpoint: '/api/voice-chat',
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

    console.log('✅ Voice chat response streaming started');

    return result.toTextStreamResponse();
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    apiMonitor.log({
      endpoint: '/api/voice-chat',
      method: 'POST',
      provider: 'unknown',
      model: 'unknown',
      responseStatus: 500,
      responseTime,
      success: false,
      error: error.message,
    });

    console.error('❌ Voice chat error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
