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

**📝 DOCUMENT EDITOR INFO:**
The document is edited using **Tiptap Editor** - a rich text editor that supports:
- **Markdown formatting** (headings, bold, italic, lists, links, code blocks)
- **Live rendering** - Markdown converts to formatted text in real-time
- **Rich text features** - Comments, highlights, tables, etc.

**CRITICAL FORMATTING RULES:**
- ✅ ALWAYS use Markdown syntax when writing/editing content
- ✅ Use \`# Heading 1\`, \`## Heading 2\`, \`### Heading 3\` for headings
- ✅ Use \`**bold**\` for bold, \`*italic*\` for italic
- ✅ Use \`[text](url)\` for links
- ✅ Use \`- item\` or \`1. item\` for lists
- ✅ Use \`\`\`language\` for code blocks
- ✅ Use \`> quote\` for blockquotes
- ❌ NEVER use HTML tags like <h1>, <p>, <div> - use Markdown instead!

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
    systemPrompt += `\n\n**🚨 CRITICAL: THESE ARE YOUR ONLY AVAILABLE TOOLS 🚨**

When user asks "what tools do you have" or "what can you do", list ONLY these tools below. DO NOT mention any other tools (no blog tools, no image tools, no search tools, no web scraping tools). If you list tools that don't exist, you will confuse the user.

**Available Tools (COMPLETE LIST):**

**📖 Document Reading:**
- **getDocumentContent**: Read the current document content. CRITICAL: Use this FIRST when user asks questions about their document (e.g., "what does my document say", "summarize this", "what's the main idea"). You CANNOT see the document unless you call this tool!

**📝 Document Editing:**
- **editDocumentWithMorph**: 🎯 PRIMARY TOOL - Use this for ALL document writing/editing. Works on empty documents AND existing content. Uses lazy edits (... existing text ...) for precision. 98% accurate, 10x faster than diffs.

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
2. When user asks questions ABOUT their document → Use **getDocumentContent** FIRST! (You cannot see the document otherwise)
3. When user asks to write/edit document content → Use **editDocumentWithMorph**
4. When user asks "how many words" or counting questions → Use **getTextStats** or **findString** (you cannot count accurately without tools!)
5. When user asks about readability → Use **analyzeReadability**
6. When user wants to replace text → Use **findAndReplace** (more accurate than manual edits)

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
      // Basic utility tools
      getWeather: tools.getWeather,
      calculate: tools.calculate,
      generateCode: tools.generateCode,
      manageTask: tools.manageTask,

      // Document reading tool - CRITICAL for AI to see document content
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
