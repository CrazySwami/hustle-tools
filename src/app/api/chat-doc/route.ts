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

import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { tools } from '@/lib/tools';
import { apiMonitor } from '@/lib/api-monitor';
import { validatePromptTokens, smartTruncateFile, getTokenUsageRecommendation, estimateMessagesTokens, estimateTokenCount, getModelContextLimit } from '@/lib/token-validator';
import { generateDocSystemPrompt } from '@/lib/generate-doc-system-prompt';

export const maxDuration = 60;

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const referer = req.headers.get('referer') || 'unknown';
    console.log('📄 CHAT-DOC ENDPOINT CALLED from:', referer);

    const {
      messages = [],
      model = 'anthropic/claude-haiku-4-5-20251001',
      webSearch = false,
      includeContext = true,
      documentContent = '',
      comments = [],
      documentTitle = '',
      projectName = '',
      clientData = null,
    }: {
      messages: UIMessage[];
      model: string;
      webSearch: boolean;
      includeContext?: boolean;
      documentContent: string;
      comments: any[];
      documentTitle?: string;
      projectName?: string;
      clientData?: any;
    } = await req.json();

    console.log('📨 Document Chat request:', {
      model,
      messageCount: messages.length,
      documentLength: documentContent.length,
      webSearch,
      includeContext,
      commentsCount: comments.length,
      clientName: clientData?.name || 'none',
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

    // ============================================================================
    // 📦 BENEFIT #2 & #3: SPECIALIZED CONTEXT + OPTIMIZED SYSTEM PROMPT
    // ============================================================================
    // This prompt is ONLY for document editing - no code editing instructions!
    // Result: Saves 2000+ tokens per request vs. generic prompt
    // Uses shared function to ensure frontend token counting matches
    // ============================================================================

    let systemPrompt = generateDocSystemPrompt({
      includeContext,
      documentContent,
      documentTitle,
      projectName,
      clientData,
    });

    // OLD INLINE GENERATION (kept for reference, now replaced by shared function):
    /* const oldSystemPrompt = `You are an expert document editing assistant. You help users write, edit, and improve prose, articles, blog posts, essays, and other written content.

**Current date:** ${currentDate}

${documentTitle ? `**📄 DOCUMENT CONTEXT:**
- **Document:** ${documentTitle}
${projectName ? `- **Project:** ${projectName}` : ''}
- **Word Count:** ${documentContent.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
` : ''}

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

**📝 DOCUMENT EDITOR INFO:**
The document is edited using **Tiptap Editor** - a rich text editor that supports:
- **Markdown formatting** (headings, bold, italic, lists, links, code blocks)
- **Live rendering** - Markdown converts to formatted text in real-time
- **Rich text features** - Comments, highlights, tables, etc.

**CRITICAL FORMATTING RULES:**
- ✅ **ALWAYS OUTPUT MARKDOWN** - Unless explicitly told otherwise, ALL content should use Markdown syntax
- ✅ **In your text responses** - Use Markdown formatting so it renders beautifully (headings, bold, lists, etc.)
- ✅ **In editDocumentWithMorph** - Use Markdown syntax for all document content
- ✅ Use \`# Heading 1\`, \`## Heading 2\`, \`### Heading 3\` for headings
- ✅ Use \`**bold**\` for bold, \`*italic*\` for italic
- ✅ Use \`[text](url)\` for links
- ✅ Use \`- item\` or \`1. item\` for lists
- ✅ Use \`\`\`language\` for code blocks
- ✅ Use \`> quote\` for blockquotes
- ❌ NEVER use HTML tags like <h1>, <p>, <div> - use Markdown instead!
- ❌ NEVER output plain text when Markdown would be more readable

**DEFAULT OUTPUT MODE: MARKDOWN**
When responding to users, format your responses in Markdown by default. Only use plain text if the user explicitly requests it.

**📄 CURRENT DOCUMENT CONTENT:**
${includeContext ? (documentContent ? `
✅ **YES - You have FULL ACCESS to the document:**

**Document Length:** ${documentContent.length} characters

**Full Content:**
\`\`\`
${documentContent.substring(0, 2000)}
${documentContent.length > 2000 ? '...(truncated - document continues)' : ''}
\`\`\`
` : `
✅ **YES - You have FULL ACCESS to the document:**

**Document Status:** Empty (0 characters)

The document is currently empty and ready for new content.
`) : `
❌ **CONTEXT DISABLED - You do NOT have access to the document content**

The user has disabled context. You cannot see the current document content.

**How to work without context:**
- ✅ You can still write NEW content (the user will add it to their document if they like it)
- ✅ You can answer general questions and provide advice
- ✅ If the user wants you to edit their existing content, they need to enable context first
- ❌ You CANNOT see what's currently in the document
- ❌ You CANNOT make targeted edits without seeing the content
- ❌ The getDocumentContent tool is also disabled

**When user asks to edit existing content:**
Tell them: "I can't see your document right now because context is disabled. Please enable the Context button in the toolbar if you want me to edit your existing content. Or, I can write new content for you from scratch!"
`}

**🎯 CRITICAL CONTEXT AWARENESS:**
${includeContext ? `
- ✅ **YOU HAVE ACCESS to the document** - whether it's empty or has content
- ✅ **The document content is shown above** - you can see it without calling any tools
- ✅ **When user says "add X" or "write Y"** - they mean edit the document (use editDocumentWithMorph immediately)
- ✅ **ALL user requests assume document editing context** - unless they explicitly ask about something else
- ✅ **Even if document is empty** - you still have access and can write to it
` : `
- ❌ **CONTEXT IS DISABLED** - You do NOT have access to the document
- ❌ **You cannot see what's in the document** - Don't pretend you can
- ✅ **You CAN write new content** - Just can't edit existing content
- ✅ **User can enable context** - By clicking the Context button in the toolbar
`}

**Important guidelines:**
- 🎯 **DEFAULT ASSUMPTION:** Every user message is about editing/writing the document unless they explicitly ask about something else (like weather, calculations, etc.)
- 📝 **Editing requests:** "Add H1", "write intro", "change this to that", "make it better" → Use \`editDocumentWithMorph\` immediately
- 💬 **Communication:** Be concise, explain what you're doing, then edit
- ⚠️ **CRITICAL:** When user asks for ANY content change, use \`editDocumentWithMorph\` tool - NEVER write document content in your text response

**Examples of requests that should trigger immediate editing:**
- "Add an H1" → Use editDocumentWithMorph to add heading
- "Write an introduction" → Use editDocumentWithMorph to write content
- "Make this better" → Use editDocumentWithMorph to improve selected text
- "Change the title" → Use editDocumentWithMorph to modify title
- "Fix the grammar" → Use editDocumentWithMorph to correct text`; */

    // Enable web search for Perplexity models
    if (webSearch && model.startsWith('perplexity/')) {
      console.log('Web search enabled with Perplexity model:', model);
      systemPrompt = `You are an expert document editing assistant with web search capabilities. Use search to provide accurate and up-to-date information with sources.

**Current date:** ${currentDate}

**📄 CURRENT DOCUMENT CONTENT:**
${includeContext ? (documentContent ? `
✅ **YES - You have FULL ACCESS to the document:**

**Document Length:** ${documentContent.length} characters

**Full Content:**
\`\`\`
${documentContent.substring(0, 2000)}
${documentContent.length > 2000 ? '...(truncated - document continues)' : ''}
\`\`\`
` : `
✅ **YES - You have FULL ACCESS to the document:**

**Document Status:** Empty (0 characters)

The document is currently empty and ready for new content.
`) : `
❌ **CONTEXT DISABLED - You do NOT have access to the document content**

The user has disabled context. You cannot see the current document content. Tell them to enable the Context button if they want you to edit existing content.
`}

**🎯 CRITICAL CONTEXT AWARENESS:**
${includeContext ? `
- ✅ **YOU HAVE ACCESS to the document** - whether it's empty or has content
- ✅ **The document content is shown above** - you can see it without calling any tools
- ✅ **ALL user requests assume document context** - unless they explicitly ask about something else
` : `
- ❌ **CONTEXT IS DISABLED** - You do NOT have access to the document
- ❌ **You cannot see what's in the document** - Don't pretend you can
- ✅ **User can enable context** - By clicking the Context button in the toolbar
`}

**Important guidelines:**
- 🌐 **Web Search:** Use search to find current, accurate information with sources
- 💬 **Communication:** Be concise, cite your sources
- 📝 **Document Context:** ${includeContext ? 'You have full access to the document content shown above' : 'Context is disabled - you cannot see the document'}`;
    } else if (webSearch) {
      console.log('Web search requested but not available for non-Perplexity model:', model);
      systemPrompt += '\n\nNote: Web search was requested but is only available with Perplexity models.';
    }

    // Add tool calling instructions
    systemPrompt += `\n\n**🚨 CRITICAL: THESE ARE YOUR ONLY AVAILABLE TOOLS 🚨**

When user asks "what tools do you have" or "what can you do", list ONLY these tools below. DO NOT mention any other tools (no blog tools, no image tools, no search tools, no web scraping tools). If you list tools that don't exist, you will confuse the user.

**Available Tools (COMPLETE LIST):**

**📖 Document Reading:**
- **getDocumentContent**: Read the current document content programmatically. NOTE: You already have document access in the system prompt, but use this tool if you need to re-fetch the latest content or get it in a structured format.

**📝 Document Editing:**
- **editDocumentWithMorph**: 🎯 PRIMARY TOOL - Use this for ALL document writing/editing. Works on empty documents AND existing content. Uses lazy edits (... existing text ...) for precision. 98% accurate, 10x faster than diffs. **CRITICAL: Use this immediately when user asks to add, write, change, fix, or modify ANY content.**

**📊 Document Analysis:**
- **getTextStats**: Get word count, character count, sentence count, paragraph count, reading time, etc. Use when user asks "how many words" or "document stats".
- **findString**: Find all occurrences of a word/phrase. Returns count and locations. CRITICAL: You cannot count accurately without this tool! Use when user asks "how many times does X appear".
- **analyzeReadability**: Get Flesch Reading Ease score, grade level, and readability metrics. Use when user asks "how readable is this" or "what grade level".
- **extractHeadings**: Extract document structure and create outline. Shows heading hierarchy. Use when user asks "show me the outline" or "what are the sections".

**🔧 Document Utilities:**
- **findAndReplace**: Replace all occurrences of text. More precise than manual editing. Use when user asks "replace all X with Y".
- **generateTOC**: Auto-generate formatted table of contents from headings. Use when user asks "create a table of contents".
- **findDuplicates**: Find duplicate or near-duplicate sentences/paragraphs. Use when user asks "find duplicates" or "check for redundancy".

**🌍 General Utilities:**
- **getWeather**: Get current weather information for any location
- **calculate**: Perform mathematical calculations
- **generateCode**: Generate code snippets in various programming languages
- **manageTask**: Create and manage to-do items

**❌ TOOLS YOU DO NOT HAVE:**
- NO web search (use Perplexity models for that)
- NO blog planning tools
- NO image generation/editing tools
- NO web scraping tools
- NO code editing tools (those are on /elementor-editor page)

**CRITICAL INSTRUCTIONS:**
1. When user asks "what tools do you have" → List ONLY the 12 tools above
2. **When user asks to ADD, WRITE, CHANGE, FIX, or EDIT content → Use editDocumentWithMorph IMMEDIATELY** (don't ask for confirmation, just do it)
3. When user asks "how many words" or counting questions → Use **getTextStats** or **findString** (you cannot count accurately without tools!)
4. When user asks about readability → Use **analyzeReadability**
5. When user wants to replace text → Use **findAndReplace** (more accurate than manual edits)
6. **Remember: You ALWAYS have document access** - the content is in your system prompt whether empty or full

**CRITICAL EDITING BEHAVIOR:**
- User says "Add an H1" → Use editDocumentWithMorph immediately (don't explain first, just edit)
- User says "Write introduction" → Use editDocumentWithMorph immediately
- User says "Fix this" → Use editDocumentWithMorph immediately
- User says "Change X to Y" → Use editDocumentWithMorph immediately
- **Default assumption: ALL requests are about editing the document unless explicitly stated otherwise**

After using a tool, provide a brief text response explaining what you did.`;

    // Configure options based on model type
    const options = model.startsWith('perplexity/') && webSearch ? { search: true } : undefined;

    // ============================================================================
    // 🎯 BENEFIT #1: DIFFERENT TOOLS FOR DIFFERENT PURPOSES
    // ============================================================================
    // Only include document-relevant tools, not code editing tools!
    // This reduces model confusion and improves tool selection accuracy
    // ============================================================================

    const toolsConfig = {
      // Basic utility tools
      getWeather: tools.getWeather,
      calculate: tools.calculate,
      generateCode: tools.generateCode,
      manageTask: tools.manageTask,

      // Document reading tool - ONLY available when context is enabled
      ...(includeContext ? {
        getDocumentContent: {
          ...tools.getDocumentContent,
          execute: async ({ requestType = 'full' }) => {
            if (!documentContent) {
              return {
                requestType,
                content: 'No document content available',
                wordCount: 0,
                characterCount: 0,
                message: 'Document is empty or not loaded'
              };
            }

            const wordCount = documentContent.trim().split(/\s+/).filter(w => w.length > 0).length;
            const characterCount = documentContent.length;

            return {
              requestType,
              content: documentContent,
              wordCount,
              characterCount,
              message: 'Document content retrieved successfully'
            };
          }
        },
      } : {}),

      // Document editing
      editDocumentWithMorph: tools.editDocumentWithMorph,  // ⭐ THE PRIMARY DOCUMENT EDITING TOOL

      // Document analysis tools (NEW!)
      getTextStats: tools.getTextStats,                     // Word count, reading time, statistics
      findString: tools.findString,                         // Find occurrences of text
      analyzeReadability: tools.analyzeReadability,         // Flesch score, grade level
      extractHeadings: tools.extractHeadings,               // Document outline/structure

      // Document utility tools (NEW!)
      findAndReplace: tools.findAndReplace,                 // Replace all occurrences
      generateTOC: tools.generateTOC,                       // Auto-generate table of contents
      findDuplicates: tools.findDuplicates,                 // Detect redundant content

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

    // 🔍 DETAILED LOGGING: Show what's actually being sent to the API
    console.log('📋 SYSTEM PROMPT PREVIEW (first 500 chars):', systemPrompt.substring(0, 500));
    console.log('📋 SYSTEM PROMPT (full length):', systemPrompt.length, 'characters');
    console.log('📋 DOCUMENT CONTENT IN SYSTEM PROMPT:', {
      includeContext,
      documentContentLength: documentContent.length,
      documentContentPreview: documentContent.substring(0, 200),
    });
    console.log('📋 MESSAGES BEING SENT:', {
      messageCount: convertedMessages.length,
      messages: convertedMessages.map((msg: any, i: number) => ({
        index: i,
        role: msg.role,
        contentType: Array.isArray(msg.content) ? 'parts[]' : typeof msg.content,
        contentLength: typeof msg.content === 'string' ? msg.content.length : JSON.stringify(msg.content).length,
        contentPreview: typeof msg.content === 'string' ? msg.content.substring(0, 100) : JSON.stringify(msg.content).substring(0, 100),
      })),
    });

    // ============================================================================
    // 🔍 TOKEN VALIDATION: Check if prompt fits within model's context window
    // ============================================================================
    // Use async image-aware token counting for accurate vision token calculation
    const messagesTokens = await estimateMessagesTokens(convertedMessages, model);
    const systemTokens = estimateTokenCount(systemPrompt);
    const totalInputTokens = systemTokens + messagesTokens;

    const contextLimit = getModelContextLimit(model);
    const effectiveLimit = contextLimit - 4000; // Reserve for output

    const percentUsed = (totalInputTokens / effectiveLimit) * 100;
    const exceeded = Math.max(0, totalInputTokens - effectiveLimit);

    let validation = {
      isValid: totalInputTokens <= effectiveLimit,
      tokenCount: totalInputTokens,
      limit: effectiveLimit,
      percentUsed,
      exceeded,
      warning: percentUsed > 75 ? `Prompt uses ${percentUsed.toFixed(1)}% of context window.` : undefined,
      error: totalInputTokens > effectiveLimit ? `Prompt exceeds model context limit by ${exceeded.toLocaleString()} tokens.` : undefined,
    };

    console.log('📊 Token validation (before management):', {
      model,
      tokenCount: validation.tokenCount.toLocaleString(),
      limit: validation.limit.toLocaleString(),
      percentUsed: validation.percentUsed.toFixed(1) + '%',
      isValid: validation.isValid,
      warning: validation.warning,
      error: validation.error,
    });

    // ============================================================================
    // 🔄 CONVERSATION WINDOW MANAGEMENT: Auto-manage if needed
    // If context exceeds thresholds, automatically apply sliding window or summarization
    // ============================================================================
    let managedMessages = convertedMessages;
    let windowStrategy: 'full' | 'sliding-window' | 'summarized' | 'exceeded' = 'full';

    if (validation.percentUsed >= 70 || !validation.isValid) {
      const { manageConversationWindow } = await import('@/lib/token-validator');

      // Convert to conversation message format
      const conversationMessages = convertedMessages.map((msg: any) => ({
        role: msg.role,
        content: Array.isArray(msg.content)
          ? msg.content.map((c: any) => c.text || '').join('\n')
          : msg.content,
      }));

      const windowResult = manageConversationWindow(
        conversationMessages,
        systemPrompt,
        model
      );

      console.log('🔄 Conversation window management:', {
        strategy: windowResult.strategy,
        originalMessages: windowResult.originalMessageCount,
        keptMessages: windowResult.keptMessageCount,
        summarizedCount: windowResult.summarizedCount,
        newTokenCount: windowResult.totalTokens.toLocaleString(),
      });

      // Convert managed messages back to API format
      if (windowResult.strategy !== 'full') {
        managedMessages = windowResult.messages.map((msg: any) => ({
          role: msg.role,
          content: [{ type: 'text', text: msg.content }],
        }));

        windowStrategy = windowResult.strategy;

        // Re-validate with managed messages (async image-aware counting)
        const managedMessagesTokens = await estimateMessagesTokens(managedMessages, model);
        const managedTotalTokens = systemTokens + managedMessagesTokens;
        const managedPercentUsed = (managedTotalTokens / effectiveLimit) * 100;
        const managedExceeded = Math.max(0, managedTotalTokens - effectiveLimit);

        validation = {
          isValid: managedTotalTokens <= effectiveLimit,
          tokenCount: managedTotalTokens,
          limit: effectiveLimit,
          percentUsed: managedPercentUsed,
          exceeded: managedExceeded,
          warning: managedPercentUsed > 75 ? `Prompt uses ${managedPercentUsed.toFixed(1)}% of context window.` : undefined,
          error: managedTotalTokens > effectiveLimit ? `Prompt exceeds model context limit by ${managedExceeded.toLocaleString()} tokens.` : undefined,
        };

        console.log('📊 Token validation (after management):', {
          model,
          tokenCount: validation.tokenCount.toLocaleString(),
          limit: validation.limit.toLocaleString(),
          percentUsed: validation.percentUsed.toFixed(1) + '%',
          isValid: validation.isValid,
        });
      }
    }

    // If STILL exceeds after management, return error
    if (!validation.isValid) {
      console.error('❌ Prompt exceeds token limit even after management:', validation.error);
      return Response.json(
        {
          error: 'Conversation too large',
          details: 'Even after applying conversation management strategies, the context exceeds model limits. Please start a new conversation.',
          tokenCount: validation.tokenCount,
          limit: validation.limit,
          exceeded: validation.exceeded,
          strategy: windowStrategy,
        },
        { status: 400 }
      );
    }

    // If prompt uses >90% of context, log warning
    if (validation.warning) {
      console.warn('⚠️ High token usage:', validation.warning);
    }

    const streamConfig: any = {
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      system: systemPrompt,
      messages: managedMessages, // Use managed messages (may be truncated/summarized)
      // Perplexity models don't support tools, so only include tools for non-Perplexity models
      ...(model.startsWith('perplexity/') && webSearch
        ? { } // No tools for Perplexity web search
        : { tools: toolsConfig, maxSteps: 10 } // Tools + maxSteps for other models
      ),
      ...(options ? options : {}), // Add search: true for Perplexity if needed
      onStepStart: ({ stepType, toolCalls }) => {
        // Log when a tool call step starts
        if (stepType === 'tool-call' && toolCalls) {
          console.log('🔧 TOOL CALL STEP START (chat-doc):', toolCalls.map(tc => ({
            name: tc.toolName,
            args: tc.args,
          })));
        }
      },
      onStepFinish: ({ stepType, toolCalls, toolResults, finishReason }) => {
        // Log when a tool call step finishes
        if (stepType === 'tool-call') {
          console.log('✅ TOOL CALL STEP FINISH (chat-doc):', {
            toolCalls: toolCalls?.map(tc => tc.toolName),
            resultCount: toolResults?.length,
            results: toolResults?.map(tr => ({
              toolName: tr.toolName,
              hasResult: !!tr.result,
              resultPreview: JSON.stringify(tr.result).substring(0, 200),
            })),
            finishReason,
          });
        }
      },
      onFinish: async ({ usage }) => {
        const responseTime = Date.now() - startTime;
        const [provider, modelName] = model.includes('/')
          ? model.split('/')
          : ['unknown', model];

        apiMonitor.log({
          endpoint: '/api/chat-doc',
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

          // Calculate token usage recommendation
          const recommendation = getTokenUsageRecommendation(validation.percentUsed);

          return {
            promptTokens: usage.inputTokens || 0,
            completionTokens: usage.outputTokens || 0,
            totalTokens: usage.totalTokens || 0,
            cacheCreationTokens: 0,
            cacheReadTokens: usage.cachedInputTokens || 0,
            model,
            // Add context window info for frontend
            contextWindow: {
              tokenCount: validation.tokenCount,
              limit: validation.limit,
              percentUsed: validation.percentUsed,
              level: recommendation.level,
              message: recommendation.message,
              action: recommendation.action,
              model,
              strategy: windowStrategy, // 'full', 'sliding-window', 'summarized', or 'exceeded'
            },
          };
        }
      },
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    apiMonitor.log({
      endpoint: '/api/chat-doc',
      method: 'POST',
      provider: 'unknown',
      model: 'unknown',
      responseStatus: 500,
      responseTime,
      success: false,
      error: error.message || 'Chat request failed',
    });

    console.error('❌ Document chat error:', error);
    return Response.json(
      {
        error: error.message || 'Chat request failed',
      },
      { status: 500 }
    );
  }
}
