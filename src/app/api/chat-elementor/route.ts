// AI Gateway chat endpoint for Elementor JSON Editor
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { tools } from '@/lib/tools';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // Log the referer to see which page is calling this endpoint
    const referer = req.headers.get('referer') || 'unknown';
    console.log('🌐 CHAT-ELEMENTOR ENDPOINT CALLED from:', referer);

    const {
      messages = [],
      model = 'anthropic/claude-haiku-4-5-20251001',
      currentJson = {},
      webSearch = false,
      currentSection = null,
      includeContext = true,
    }: {
      messages: UIMessage[];
      model: string;
      currentJson: any;
      webSearch: boolean;
      currentSection: any;
      includeContext: boolean;
    } = await req.json();

    console.log('📨 Elementor Chat request:', {
      model,
      messageCount: messages.length,
      hasJson: Object.keys(currentJson).length > 0,
      webSearch,
      lastMessage: messages[messages.length - 1],
    });

    console.log('🔧 Available tools:', Object.keys({
      getWeather: tools.getWeather,
      calculate: tools.calculate,
      generateCode: tools.generateCode,
      manageTask: tools.manageTask,
      editCodeWithMorph: tools.editCodeWithMorph,  // ⭐ THE ONLY CODE TOOL
    }));

    // Convert messages with error handling (same as main chat)
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

    // Build system prompt for Elementor section editing
    let systemPrompt = `You are an expert HTML/CSS/JS/PHP code writing assistant. You help users create and edit web sections for WordPress Elementor pages.

**Current date:** ${currentDate}

**CRITICAL INSTRUCTIONS:**

**🎯 THE ONLY TOOL YOU NEED - editCodeWithMorph:**

Use \`editCodeWithMorph\` for EVERYTHING (writing, editing, creating):

✅ **Empty files** - Write complete new code
✅ **Existing files** - Make targeted edits with lazy markers
✅ **Any file type** - HTML, CSS, JS, PHP
✅ **Any change size** - Small tweaks or complete rewrites

**How to use Morph:**

1. **For EMPTY files (no code exists):**
   - Write the complete code directly
   - Example: \`editCodeWithMorph({ file: 'html', instruction: 'Adding h1', lazyEdit: '<h1>Hello</h1>' })\`

2. **For EXISTING files (code already exists):**
   - Use lazy edit markers: \`// ... existing code ...\`
   - Show only what changes
   - Example:
     \`\`\`css
     // ... existing code ...
     .button {
       background: red;  /* Just the change! */
     }
     // ... existing code ...
     \`\`\`

**Morph Features:**
- 10,500 tokens/sec merge speed
- 98% accuracy
- Works with ANY model (even Haiku!)
- No complex diff format needed
- Handles empty AND existing files

**IMPORTANT FILE TYPE DETECTION:**
- If user shows you code with \`<?php\` tags → Use \`editCodeWithMorph\` with file='php'
- HTML sections should NEVER contain PHP code - they are client-side only
- PHP code cannot be previewed in the editor - user must copy to WordPress

**📁 CURRENT FILES IN EDITOR:**
${includeContext && currentSection && (currentSection.html || currentSection.css || currentSection.js || currentSection.php) ? `
✅ **YES - You have full access to all code files below:**

**Section Name:** ${currentSection.name || 'Untitled'}

**📄 HTML FILE (${currentSection.html?.length || 0} characters):**
\`\`\`html
${currentSection.html?.substring(0, 5000) || '(empty file)'}
${currentSection.html?.length > 5000 ? '\n...(file continues - total ' + currentSection.html.length + ' chars. You can see first 5000 chars. If you need to edit text beyond this, ask user for surrounding context)' : ''}
\`\`\`

**🎨 CSS FILE (${currentSection.css?.length || 0} characters):**
\`\`\`css
${currentSection.css?.substring(0, 5000) || '(empty file)'}
${currentSection.css?.length > 5000 ? '\n...(file continues - total ' + currentSection.css.length + ' chars. You can see first 5000 chars)' : ''}
\`\`\`

**⚡ JS FILE (${currentSection.js?.length || 0} characters):**
\`\`\`javascript
${currentSection.js?.substring(0, 3000) || '(empty file)'}
${currentSection.js?.length > 3000 ? '\n...(file continues - total ' + currentSection.js.length + ' chars. You can see first 3000 chars)' : ''}
\`\`\`

**🔧 PHP FILE (${currentSection.php?.length || 0} characters):**
\`\`\`php
${currentSection.php?.substring(0, 5000) || '(empty file)'}
${currentSection.php?.length > 5000 ? '\n...(file continues - total ' + currentSection.php.length + ' chars. You can see first 5000 chars)' : ''}
\`\`\`

**IMPORTANT:**
- You CAN see the code above (first 3000-5000 characters of each file)
- Each file is labeled with its full length
- When user asks to edit specific text, search within the visible portion first
- If text isn't visible, ask user to provide surrounding context or use file search
- Use \`editCodeWithMorph\` with lazy markers to edit any visible portion
` : `
❌ NO - No section currently loaded in the editor.

The editor is empty. You can write new code directly using the \`editCodeWithMorph\` tool.

When user asks "can you see my code", say NO - the editor is empty.
`}

**Important guidelines:**
- 🎯 **PRIMARY ACTION:** Use \`editCodeWithMorph\` for ALL code writing/editing (new or existing files)
- 📝 **Code format rules:** Section-level code only (NO DOCTYPE, html, head, body tags), CSS without <style> tags, JS without <script> tags
- 💬 **Communication:** Be concise, explain what you changed
- ⚠️ **CRITICAL:** ALWAYS use \`editCodeWithMorph\` tool - NEVER write code directly in your text response

**When user asks "can you see my code":**
- If files are shown above with ✅: Say "Yes, I can see your [HTML/CSS/JS/PHP] code" and reference specific content
- If you see ❌: Say "No, the editor appears empty"`;

    // Enable web search for Perplexity models (same as main chat)
    if (webSearch && model.startsWith('perplexity/')) {
      console.log('Web search enabled with Perplexity model:', model);
      systemPrompt = `You are an expert Elementor JSON editor assistant. ALWAYS USE SEARCH to provide accurate and up-to-date information with sources. Keep responses concise and focused.

**Current date:** ${currentDate}

**Current Elementor JSON context:**
${Object.keys(currentJson).length > 0 ? 'Current page has: ' + JSON.stringify(currentJson, null, 2).substring(0, 1000) + '...' : 'No current JSON loaded'}`;
    } else if (webSearch) {
      console.log('Web search requested but not available for non-Perplexity model:', model);
      systemPrompt += '\n\nNote: Web search was requested but is only available with Perplexity models.';
    }

    // Add tool calling instructions
    systemPrompt += `\n\n**Available Tools:**
- **editCodeWithMorph**: 🎯 PRIMARY TOOL - Use this for ALL code writing/editing. Works on empty files AND existing code. Uses lazy edits (// ... existing code ...) for precision. 98% accurate, 10x faster than diffs.
- **getWeather**: Get current weather information
- **calculate**: Perform mathematical calculations
- **generateCode**: Generate code snippets in various languages
- **manageTask**: Create and manage tasks

**CRITICAL INSTRUCTIONS:**
When a user asks to write or edit code (e.g., "create a hero section", "change the button color", "add a navbar"), you MUST use the editCodeWithMorph tool. This tool works on BOTH empty files AND existing code.

After using a tool, provide a helpful text response that explains what the tool will do or what results it returned.`;

    // Configure options based on model type
    const options = model.startsWith('perplexity/') && webSearch ? { search: true } : undefined;

    const toolsConfig = {
      getWeather: tools.getWeather,
      calculate: tools.calculate,
      generateCode: tools.generateCode,
      manageTask: tools.manageTask,
      // REMOVED: generateHTML - use editCodeWithMorph instead
      // REMOVED: updateSectionHtml/Css/Js/Php - use editCodeWithMorph instead (handles everything!)
      // REMOVED: testPing - diagnostic tool no longer needed
      // REMOVED: switchTab - tab navigation handled by UI, not tools
      editCodeWithMorph: tools.editCodeWithMorph,  // ⭐ THE ONLY CODE TOOL - Works on empty AND existing files
    };

    console.log('🚀 Calling streamText...', {
      model,
      webSearch,
      options,
      toolsConfigured: Object.keys(toolsConfig),
      systemPromptLength: systemPrompt.length,
      systemPromptPreview: systemPrompt.substring(0, 500),
    });

    // Check if the last user message mentions test ping ONLY (removed HTML keyword detection)
    // HTML generation should be triggered naturally by the model based on system prompt
    // Check last user message for context
    const lastUserMessage = messages[messages.length - 1];

    // Safely extract text from message - handle both content string and parts array
    let userText = '';
    if (lastUserMessage) {
      if ('content' in lastUserMessage && typeof lastUserMessage.content === 'string') {
        userText = lastUserMessage.content;
      } else if ('parts' in lastUserMessage && Array.isArray(lastUserMessage.parts)) {
        const textPart = lastUserMessage.parts.find((p: any) =>
          p && typeof p === 'object' && 'type' in p && p.type === 'text' && 'text' in p
        );
        userText = (textPart as any)?.text || '';
      }
    }

    // Log edit requests for debugging
    const editKeywords = ['edit', 'change', 'modify', 'update', 'fix', 'alter', 'adjust', 'create', 'add', 'make'];
    const isEditRequest = editKeywords.some(keyword => userText.toLowerCase().includes(keyword));

    if (isEditRequest) {
      console.log('✏️ Edit request detected - model will use editCodeWithMorph tool');
    }

    const streamConfig: any = {
      model: model, // Just pass the model string (gateway is handled automatically)
      system: systemPrompt,
      messages: convertedMessages,
      tools: toolsConfig,
      stopWhen: stepCountIs(2), // Limit tool calls to prevent UI duplication (was 5)
    };

    console.log('📤 Final stream config:', {
      hasTools: !!streamConfig.tools,
      toolChoice: streamConfig.toolChoice,
      toolCount: Object.keys(streamConfig.tools).length,
    });

    const result = streamText(streamConfig);

    console.log('✅ Returning stream response with sources and tools');

    // Log usage after completion (for debugging)
    result.usage.then(usage => {
      console.log('📊 Usage data from AI:', usage);
    }).catch(err => {
      console.error('❌ Error getting usage:', err);
    });

    // Return with sources, tool results, and usage metadata
    // CORRECT: Use messageMetadata callback to send usage data to client
    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
      messageMetadata: ({ part }) => {
        // Send usage data when stream completes
        if (part.type === 'finish') {
          console.log('✅ Sending usage metadata - part:', JSON.stringify(part, null, 2));

          // Extract usage data from part
          const usage = part.totalUsage || {};

          return {
            promptTokens: usage.inputTokens || 0,
            completionTokens: usage.outputTokens || 0,
            totalTokens: usage.totalTokens || 0,
            cacheCreationTokens: 0, // Not available in totalUsage
            cacheReadTokens: usage.cachedInputTokens || 0,
            model,
          };
        }
      },
    });

  } catch (error: any) {
    console.error('❌ Elementor chat error:', error);
    return Response.json(
      {
        error: error.message || 'Chat request failed',
      },
      { status: 500 }
    );
  }
}
