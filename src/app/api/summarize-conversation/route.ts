import { streamText } from 'ai';
import { gateway } from '@/lib/ai-gateway';

export const maxDuration = 60;

/**
 * AI-Powered Conversation Summarization
 * Uses Gemini 2.5 Flash for intelligent summarization
 *
 * Cost per summary: ~$0.008 (100K input + 1K output)
 * - Input: $0.30 / 1M tokens
 * - Output: $2.50 / 1M tokens
 */

interface SummarizeRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const body: SummarizeRequest = await req.json();
    const { messages } = body;

    if (!messages || messages.length === 0) {
      return Response.json(
        { error: 'No messages provided for summarization' },
        { status: 400 }
      );
    }

    // Format messages for summarization prompt
    const conversationText = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    const summaryPrompt = `You are a conversation summarization assistant. Your task is to create a concise but comprehensive summary of the following conversation.

IMPORTANT GUIDELINES:
1. Capture the main topics discussed
2. Preserve important context and decisions made
3. Include key facts, data, and technical details
4. Note any action items or next steps
5. Keep the summary under 500 tokens but include all critical information
6. Use bullet points for clarity
7. Focus on information that would be useful for continuing the conversation

CONVERSATION TO SUMMARIZE:
${conversationText}

SUMMARY:`;

    // Use Gemini 2.5 Flash for summarization (cheap + fast + 1M context)
    const result = await streamText({
      model: gateway('google/gemini-2.5-flash', {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      prompt: summaryPrompt,
      temperature: 0.3, // Lower temperature for more consistent summaries
      maxTokens: 1000, // Limit summary length
    });

    // Return streaming response
    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error('❌ Summarization error:', error);
    return Response.json(
      {
        error: 'Summarization failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
