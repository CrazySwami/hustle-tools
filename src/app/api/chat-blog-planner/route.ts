import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { NextRequest } from 'next/server';
import { planStepsTool, updateStepProgressTool, planBlogTopicsTool, writeBlogPostTool } from '@/lib/tools';
import { apiMonitor } from '@/lib/api-monitor';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { messages, model = 'anthropic/claude-sonnet-4-5-20250929' } = await req.json();

    // 🎯 Detect multi-step requests and inject planning instruction
    const lastUserMessage = messages[messages.length - 1];
    const userContent = lastUserMessage?.content?.toLowerCase() || '';

    const isMultiStep =
      userContent.includes(' and ') ||
      userContent.includes(' then ') ||
      userContent.includes('first') && userContent.includes('second') ||
      (userContent.match(/\b(plan|create|write|research|generate)\b/g) || []).length >= 2;

    // If multi-step detected, prepend a system instruction to FORCE planSteps usage
    const processedMessages = isMultiStep
      ? [
          ...messages.slice(0, -1),
          {
            role: 'user',
            content: `${userContent}

🚨 IMPORTANT: This is a multi-step request. You MUST use the planSteps tool FIRST before doing anything else. Do NOT ask for clarification. Do NOT execute tools directly. Call planSteps now with a numbered plan, then ask me for approval.`
          }
        ]
      : messages;

    console.log('🎯 /api/chat-blog-planner called!');
    console.log('🔍 Multi-step detection:', { isMultiStep, original: userContent });

    const result = streamText({
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),

      // 🎯 FORCE planSteps tool for multi-step requests
      ...(isMultiStep && {
        toolChoice: {
          type: 'tool',
          toolName: 'planSteps'
        }
      }),

      // ⭐ System prompt to enforce planning workflow
      system: `You are a helpful blog planning assistant with a MANDATORY planning workflow.

**Current Date & Time:** ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}

🚨 CRITICAL RULE - READ THIS FIRST:

Before doing ANYTHING, ask yourself: "Does this request have the word 'and' or involve 2+ separate actions?"

If YES → You MUST call planSteps tool FIRST. NO EXCEPTIONS.
If NO → Proceed directly with the single tool needed.

DETECTION LOGIC:
✓ Contains "and" → MULTI-STEP → Call planSteps first
✓ Contains "then" → MULTI-STEP → Call planSteps first
✓ Multiple verbs (plan AND write, research AND create) → MULTI-STEP → Call planSteps first
✓ Multiple numbered requests → MULTI-STEP → Call planSteps first
✗ Single action only → SINGLE-STEP → Use the specific tool directly

EXAMPLES:

MULTI-STEP (Must use planSteps FIRST):
❌ WRONG: User says "Plan 8 posts AND write the first one" → You call planBlogTopics
✅ CORRECT: User says "Plan 8 posts AND write the first one" → You call planSteps → Show plan → Wait for approval → Execute

❌ WRONG: User says "Research trends and create calendar" → You call webSearch
✅ CORRECT: User says "Research trends and create calendar" → You call planSteps → Show plan → Wait → Execute

SINGLE-STEP (Skip planSteps):
✅ User says "Plan 8 blog posts for January" → Call planBlogTopics directly (only 1 action)
✅ User says "Write a blog post about AI" → Call writeBlogPost directly (only 1 action)

MANDATORY EXECUTION FLOW FOR MULTI-STEP:
1. Call planSteps with numbered steps and tool names
2. STOP immediately after planSteps returns
3. Ask user: "Does this plan look good? Should I proceed?"
4. WAIT for approval response
5. User says "yes" or "proceed" → Start executing
6. Execute Step 1 → Call updateStepProgress(1, 'completed') → Execute Step 2 → Call updateStepProgress(2, 'completed') → etc.

This workflow was explicitly requested by the user. They want visual approval before execution!`,

      messages: processedMessages,
      tools: {
        planSteps: planStepsTool,                 // Creates execution plan
        updateStepProgress: updateStepProgressTool, // Updates step completion
        planBlogTopics: planBlogTopicsTool,
        writeBlogPost: writeBlogPostTool,
      },
      temperature: 0.7,
      maxTokens: 4000,

      // ⭐ Enable multi-step reasoning (AI can execute full plans)
      maxSteps: 10,  // Increased to allow: plan + progress updates + actual tools

      // ⭐ Track when each step completes
      onStepFinish: ({ text, toolCalls, stepType, usage }) => {
        console.log('✓ Step completed:', {
          type: stepType,
          tools: toolCalls.map(tc => tc.toolName),
          tokens: usage.totalTokens,
        });
      },
      onFinish: async ({ usage }) => {
        const responseTime = Date.now() - startTime;
        const [provider, modelName] = model.includes('/')
          ? model.split('/')
          : ['unknown', model];

        apiMonitor.log({
          endpoint: '/api/chat-blog-planner',
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

    return result.toDataStreamResponse();
  } catch (error) {
    const responseTime = Date.now() - startTime;

    apiMonitor.log({
      endpoint: '/api/chat-blog-planner',
      method: 'POST',
      provider: 'unknown',
      model: 'unknown',
      responseStatus: 500,
      responseTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    console.error('Error in /api/chat-blog-planner:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
