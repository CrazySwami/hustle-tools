import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { text, instruction, model } = await req.json();

    if (!text || !instruction) {
      return Response.json({ error: 'Missing text or instruction' }, { status: 400 });
    }

    // Use the selected model (default to Claude Haiku for speed)
    const selectedModel = model || 'anthropic/claude-haiku-4-5-20251001';

    const systemPrompt = `You are an expert editor. Your task is to edit the provided text according to the user's instruction.

**CRITICAL RULES:**
1. Return ONLY the edited text
2. Do NOT add explanations, commentary, or meta-text
3. Do NOT use markdown formatting unless it was in the original
4. Keep the same general length unless specifically asked to expand/shorten
5. Preserve the tone and voice unless asked to change it

Just return the improved version of the text, nothing else.`;

    const prompt = `Original text:
"${text}"

Instruction: ${instruction}

Edited text:`;

    const result = await streamText({
      model: gateway(selectedModel, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      system: systemPrompt,
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    });

    // Collect the full response
    let editedText = '';
    for await (const chunk of result.textStream) {
      editedText += chunk;
    }

    // Clean up any markdown artifacts or extra formatting
    editedText = editedText.trim();

    // Remove markdown quotes if present
    if (editedText.startsWith('"') && editedText.endsWith('"')) {
      editedText = editedText.slice(1, -1);
    }

    return Response.json({ editedText });

  } catch (error: any) {
    console.error('Inline edit error:', error);
    return Response.json({ error: error.message || 'Failed to edit text' }, { status: 500 });
  }
}
