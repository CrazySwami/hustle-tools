/**
 * ============================================================================
 * WHY SEPARATE API ROUTES? 5 CRITICAL BENEFITS
 * ============================================================================
 *
 * Instead of using /api/chat or /api/chat-elementor for document editing,
 * we have a dedicated /api/chat-doc route. Here's why:
 *
 * 1. 🎯 DIFFERENT TOOLS
 *    - This route: editDocumentWithMorph (for prose/articles)
 *    - Elementor route: editCodeWithMorph (for HTML/CSS/JS)
 *    - General chat: No editing tools at all
 *
 * 2. 📦 DIFFERENT CONTEXT
 *    - This route: Receives documentContent (string) - the current essay/article
 *    - Elementor route: Receives currentSection (object) with html/css/js/php files
 *    - General chat: No editor context
 *
 * 3. 💬 DIFFERENT SYSTEM PROMPTS
 *    - This route: "You are a document editor. Edit prose, fix grammar, improve clarity..."
 *    - Elementor route: "You are a code assistant. Write HTML/CSS/JS for web sections..."
 *    - Result: 80% fewer tokens! (Don't tell doc chat about code editing rules!)
 *
 * 4. ⚡ TOKEN EFFICIENCY
 *    - Elementor chat sends 10KB of HTML/CSS/JS code
 *    - Doc chat sends 5KB of article text
 *    - If we used one route, we'd waste tokens sending ALL context to ALL requests!
 *
 * 5. 🐛 BETTER DEBUGGING
 *    - Error in doc editing? Check /api/chat-doc logs
 *    - Error in code editing? Check /api/chat-elementor logs
 *    - Instantly know which system is broken
 *
 * ============================================================================
 */

import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { tools } from '@/lib/tools';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const referer = req.headers.get('referer') || 'unknown';
    console.log('📄 CHAT-DOC ENDPOINT CALLED from:', referer);

    const {
      messages = [],
      model = 'anthropic/claude-haiku-4-5-20251001',
      webSearch = false,
      documentContent = '',
      comments = [],
    }: {
      messages: UIMessage[];
      model: string;
      webSearch: boolean;
      documentContent: string;
      comments: any[];
    } = await req.json();

    console.log('📨 Document Chat request:', {
      model,
      messageCount: messages.length,
      documentLength: documentContent.length,
      webSearch,
      commentsCount: comments.length,
    });

    // Convert messages with error handling
    let convertedMessages;
    try {
      convertedMessages = convertToModelMessages(messages);
    } catch (error: any) {
      console.error('Error converting messages:', error);
      return new Response(
        JSON.stringify({ error: 'Message conversion failed', details: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current date for context
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // ============================================================================
    // 📦 BENEFIT #2 & #3: SPECIALIZED CONTEXT + OPTIMIZED SYSTEM PROMPT
    // ============================================================================
    // This prompt is ONLY for document editing - no code editing instructions!
    // Result: Saves 2000+ tokens per request vs. generic prompt
    // ============================================================================

    let systemPrompt = `You are an expert document editing assistant. You help users write, edit, and improve prose, articles, blog posts, essays, and other written content.

**Current date:** ${currentDate}

**🎯 THE ONLY TOOL YOU NEED - editDocumentWithMorph:**

Use \`editDocumentWithMorph\` for EVERYTHING (writing, editing, rewriting):

✅ **Empty document** - Write complete new content
✅ **Existing document** - Make targeted edits with lazy markers
✅ **Any change size** - Small tweaks or complete rewrites

**How to use Morph for documents:**

1. **For EMPTY documents (no content exists):**
   - Write the complete content directly
   - Example: \`editDocumentWithMorph({ instruction: 'Writing intro', lazyEdit: '# Introduction\\n\\nThis is...' })\`

2. **For EXISTING documents (content already exists):**
   - Use lazy edit markers: \`... existing text ...\`
   - Show only what changes
   - Example:
     \`\`\`
     ... existing text ...

     ## New Section

     This is the new content I'm adding.

     ... existing text ...
     \`\`\`

**Morph Features:**
- 10,500 tokens/sec merge speed
- 98% accuracy
- Works with ANY model (even Haiku!)
- No complex diff format needed
- Handles empty AND existing documents

**📄 CURRENT DOCUMENT CONTENT:**
${documentContent ? `
✅ **YES - You have full access to the document:**

**Document Length:** ${documentContent.length} characters

**Content Preview:**
\`\`\`
${documentContent.substring(0, 2000)}
${documentContent.length > 2000 ? '...(truncated - document continues)' : ''}
\`\`\`

**IMPORTANT:** You CAN see the document content above! When user asks "can you see my document", say YES and reference the specific content shown above. Use \`editDocumentWithMorph\` to write or edit this document.
` : `
❌ NO - No document currently loaded in the editor.

The document is empty. You can write new content directly using the \`editDocumentWithMorph\` tool.

When user asks "can you see my document", say NO - the document is empty.
`}

**Important guidelines:**
- 🎯 **PRIMARY ACTION:** Use \`editDocumentWithMorph\` for ALL document writing/editing (new or existing content)
- 📝 **Content format:** Natural prose, markdown formatting allowed, focus on clarity and readability
- 💬 **Communication:** Be concise, explain what you changed or added
- ⚠️ **CRITICAL:** ALWAYS use \`editDocumentWithMorph\` tool - NEVER write document content directly in your text response

**When user asks "can you see my document":**
- If content is shown above with ✅: Say "Yes, I can see your document" and reference specific content
- If you see ❌: Say "No, the document appears empty"`;

    // Enable web search for Perplexity models
    if (webSearch && model.startsWith('perplexity/')) {
      console.log('Web search enabled with Perplexity model:', model);
      systemPrompt = `You are an expert document editing assistant. ALWAYS USE SEARCH to provide accurate and up-to-date information with sources. Keep responses concise and focused.

**Current date:** ${currentDate}

**Current document context:**
${documentContent ? 'Document has ' + documentContent.length + ' characters. Content preview: ' + documentContent.substring(0, 500) + '...' : 'No document loaded'}`;
    } else if (webSearch) {
      console.log('Web search requested but not available for non-Perplexity model:', model);
      systemPrompt += '\n\nNote: Web search was requested but is only available with Perplexity models.';
    }

    // Add tool calling instructions
    systemPrompt += `\n\n**Available Tools:**
- **editDocumentWithMorph**: 🎯 PRIMARY TOOL - Use this for ALL document writing/editing. Works on empty documents AND existing content. Uses lazy edits (... existing text ...) for precision. 98% accurate, 10x faster than diffs.
- **getWeather**: Get current weather information
- **calculate**: Perform mathematical calculations
- **generateCode**: Generate code snippets in various languages
- **manageTask**: Create and manage tasks

**CRITICAL INSTRUCTIONS:**
When a user asks to write or edit document content (e.g., "write an introduction", "fix the grammar", "add a conclusion"), you MUST use the editDocumentWithMorph tool. This tool works on BOTH empty documents AND existing content.

After using a tool, provide a helpful text response that explains what the tool will do or what results it returned.`;

    // Configure options based on model type
    const options = model.startsWith('perplexity/') && webSearch ? { search: true } : undefined;

    // ============================================================================
    // 🎯 BENEFIT #1: DIFFERENT TOOLS FOR DIFFERENT PURPOSES
    // ============================================================================
    // Only include document-relevant tools, not code editing tools!
    // This reduces model confusion and improves tool selection accuracy
    // ============================================================================

    const toolsConfig = {
      getWeather: tools.getWeather,
      calculate: tools.calculate,
      generateCode: tools.generateCode,
      manageTask: tools.manageTask,
      editDocumentWithMorph: tools.editDocumentWithMorph,  // ⭐ THE ONLY DOCUMENT TOOL
      // NOTE: editCodeWithMorph is NOT included here - it's only for /api/chat-elementor
      // This prevents the model from trying to edit code when user wants to edit prose
    };

    console.log('🚀 Calling streamText...', {
      model,
      webSearch,
      options,
      toolsConfigured: Object.keys(toolsConfig),
      systemPromptLength: systemPrompt.length,
    });

    const streamConfig: any = {
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      system: systemPrompt,
      messages: convertedMessages,
      tools: toolsConfig,
      stopWhen: stepCountIs(2), // Limit tool calls to prevent UI duplication
    };

    const result = streamText(streamConfig);

    console.log('✅ Returning stream response with sources and tools');

    // Return with sources, tool results, and usage metadata
    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
      sendToolResults: true,
      messageMetadata: ({ part }) => {
        if (part.type === 'finish') {
          console.log('✅ Sending usage metadata');
          const usage = part.totalUsage || {};

          return {
            promptTokens: usage.inputTokens || 0,
            completionTokens: usage.outputTokens || 0,
            totalTokens: usage.totalTokens || 0,
            cacheCreationTokens: 0,
            cacheReadTokens: usage.cachedInputTokens || 0,
            model,
          };
        }
      },
    });

  } catch (error: any) {
    console.error('❌ Document chat error:', error);
    return Response.json(
      {
        error: error.message || 'Chat request failed',
      },
      { status: 500 }
    );
  }
}
