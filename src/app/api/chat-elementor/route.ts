// AI Gateway chat endpoint for Elementor JSON Editor
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { gateway } from '@ai-sdk/gateway';
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
    }: {
      messages: UIMessage[];
      model: string;
      currentJson: any;
      webSearch: boolean;
      currentSection: any;
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
      generateHTML: tools.generateHTML,
      updateSectionHtml: tools.updateSectionHtml,
      updateSectionCss: tools.updateSectionCss,
      updateSectionJs: tools.updateSectionJs,
      getEditorContent: tools.getEditorContent,
      editCodeWithDiff: tools.editCodeWithDiff,
      testPing: tools.testPing,
      switchTab: tools.switchTab,
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
    let systemPrompt = `You are an expert HTML/CSS/JS section editor assistant. You help users create and edit web sections for WordPress Elementor pages.

**Current date:** ${currentDate}

**CRITICAL INSTRUCTIONS:**

**For CREATING new sections:**
When a user asks to "generate", "create", "build", or "make" a NEW section (hero, pricing table, contact form, navbar, footer, etc.), call the \`generateHTML\` tool. DO NOT generate code yourself.

**For EDITING existing sections:**
When a user asks to "modify", "change", "update", "edit", or "fix" the CURRENT section:
- \`updateSectionHtml\` - To modify the HTML markup
- \`updateSectionCss\` - To modify the styling/colors/layout
- \`updateSectionJs\` - To modify interactivity/functionality

**For NAVIGATING between tabs:**
When a user asks to "open", "switch to", "go to", "navigate to", or "show me" a specific tab, you MUST use the \`switchTab\` tool. DO NOT just say you opened it - actually call the tool. Available tabs: 'json' (Code Editor), 'visual' (Visual Editor), 'sections' (Section Library), 'playground' (WordPress Playground), 'site-content' (Site Content), 'style-guide' (Style Guide).

**IMPORTANT:** You can see the current section code above. Generate the COMPLETE updated code (not just the changed parts). The system will automatically show a diff preview to the user before applying changes.

**CURRENT SECTION IN EDITOR:**
${currentSection && (currentSection.html || currentSection.css || currentSection.js) ? `
✅ YES - You can see the current section code:

**Section Name:** ${currentSection.name || 'Untitled'}

**HTML (${currentSection.html?.length || 0} characters):**
\`\`\`html
${currentSection.html?.substring(0, 1000) || 'No HTML'}
${currentSection.html?.length > 1000 ? '...(truncated)' : ''}
\`\`\`

**CSS (${currentSection.css?.length || 0} characters):**
\`\`\`css
${currentSection.css?.substring(0, 1000) || 'No CSS'}
${currentSection.css?.length > 1000 ? '...(truncated)' : ''}
\`\`\`

**JS (${currentSection.js?.length || 0} characters):**
\`\`\`javascript
${currentSection.js?.substring(0, 1000) || 'No JS'}
${currentSection.js?.length > 1000 ? '...(truncated)' : ''}
\`\`\`

When user asks "can you see my code", say YES and show what you can see above.
` : `
❌ NO - No section currently loaded in the editor.

The section editor appears empty. The user needs to either:
1. Generate a new section using the "generateHTML" tool
2. Load a section from the Section Library
3. Type/paste code directly into the editor

When user asks "can you see my code", say NO - the editor is empty.
`}

**Important guidelines:**
- For NEW sections: Use \`generateHTML\` tool
- For EDITING current section: Use \`updateSection*\` tools
- DO NOT try to call \`getDocumentContent\` - you already have the section content above
- Always output section-level code only (NO DOCTYPE, html, head, body tags)
- CSS should be pure selectors (NO <style> tags)
- JavaScript should be pure code (NO <script> tags)
- Be concise and explain what you changed
- **ALWAYS use tools - never generate code in your response**`;

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
- **testPing**: DIAGNOSTIC TOOL - Use this IMMEDIATELY when user says "test ping" or "ping test". This verifies the tool calling system is working. ALWAYS use this tool when requested - DO NOT just respond with text.
- **generateHTML**: Use this tool whenever a user asks to generate, create, or build HTML, CSS, or JavaScript. This tool opens an interactive UI for generating web components with optional image references.
- **switchTab**: Use this tool when the user wants to navigate to a different tab (Code Editor, Visual Editor, Section Library, WordPress Playground, Site Content, or Style Guide).
- **updateSectionHtml/Css/Js**: Use these tools to edit the current section code with diff preview.
- **getWeather**: Get current weather information
- **calculate**: Perform mathematical calculations
- **generateCode**: Generate code snippets in various languages
- **manageTask**: Create and manage tasks

**CRITICAL INSTRUCTIONS:**
1. When user says "test ping" or "ping test", you MUST call the testPing tool. DO NOT just say you're calling it - actually call it.
2. When a user asks to generate HTML, CSS, or JavaScript (e.g., "generate some HTML", "create a hero section", "make a contact form"), you MUST use the generateHTML tool. Do not generate the code yourself - the tool will handle it.
3. When user asks to switch tabs or navigate, you MUST use the switchTab tool.

After using a tool, provide a helpful text response that explains what the tool will do or what results it returned.`;

    // Configure options based on model type
    const options = model.startsWith('perplexity/') && webSearch ? { search: true } : undefined;

    const toolsConfig = {
      getWeather: tools.getWeather,
      calculate: tools.calculate,
      generateCode: tools.generateCode,
      manageTask: tools.manageTask,
      generateHTML: tools.generateHTML,
      updateSectionHtml: tools.updateSectionHtml,
      updateSectionCss: tools.updateSectionCss,
      updateSectionJs: tools.updateSectionJs,
      testPing: tools.testPing,
      switchTab: tools.switchTab,
    };

    console.log('🚀 Calling streamText...', {
      model,
      webSearch,
      options,
      toolsConfigured: Object.keys(toolsConfig),
      systemPromptLength: systemPrompt.length,
      systemPromptPreview: systemPrompt.substring(0, 500),
    });

    // Check if the last user message mentions HTML generation keywords or test ping
    const lastUserMessage = messages[messages.length - 1];
    const userText = lastUserMessage?.parts?.[0]?.text || '';
    const htmlKeywords = ['generate', 'create', 'build', 'make', 'html', 'css', 'javascript', 'hero', 'pricing', 'table', 'form', 'contact', 'navbar', 'footer', 'section'];
    const toolForceKeywords = [...htmlKeywords, 'test ping', 'ping test', 'ping'];
    const shouldForceHTMLTool = toolForceKeywords.some(keyword => userText.toLowerCase().includes(keyword));

    if (shouldForceHTMLTool) {
      console.log('🎯 Tool trigger keywords detected! Forcing tool usage for:', userText);
    }

    const streamConfig: any = {
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      system: systemPrompt,
      messages: convertedMessages,
      tools: toolsConfig,
      stopWhen: stepCountIs(5), // Use stopWhen instead of maxSteps
    };

    // Force tool usage if HTML keywords detected
    if (shouldForceHTMLTool) {
      streamConfig.toolChoice = 'required'; // Force the model to call a tool
      console.log('🔧 Setting toolChoice to "required" to force tool call');
    }

    console.log('📤 Final stream config:', {
      hasTools: !!streamConfig.tools,
      toolChoice: streamConfig.toolChoice,
      toolCount: Object.keys(streamConfig.tools).length,
    });

    const result = streamText(streamConfig);

    console.log('✅ Returning stream response with sources and tools');

    // Return with sources and tool results enabled (same as main chat)
    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
      sendToolResults: true,
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
