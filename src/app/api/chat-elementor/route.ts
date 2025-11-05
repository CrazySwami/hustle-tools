// AI Gateway chat endpoint for Elementor JSON Editor
import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { tools } from '@/lib/tools';
import { apiMonitor } from '@/lib/api-monitor';
import { validatePromptTokens, smartTruncateFile, getTokenUsageRecommendation, estimateMessagesTokens, estimateTokenCount, getModelContextLimit } from '@/lib/token-validator';

export const maxDuration = 60;

export async function POST(req: Request) {
  const startTime = Date.now(); // Track request start time for monitoring

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
      includeCss = false,
      globalCss = '',
    }: {
      messages: UIMessage[];
      model: string;
      currentJson: any;
      webSearch: boolean;
      currentSection: any;
      includeContext: boolean;
      includeCss: boolean;
      globalCss: string;
    } = await req.json();

    // Detect project type for validation tool
    const hasPhpCode = currentSection?.php && currentSection.php.length > 0;
    const projectType = hasPhpCode ? 'PHP Widget' : 'HTML Section';

    console.log('📨 Elementor Chat request:', {
      model,
      messageCount: messages.length,
      hasJson: Object.keys(currentJson).length > 0,
      webSearch,
      includeContext,
      currentSection: currentSection ? {
        id: currentSection.id,
        name: currentSection.name,
        htmlLength: currentSection.html?.length || 0,
        cssLength: currentSection.css?.length || 0,
        jsLength: currentSection.js?.length || 0,
        phpLength: currentSection.php?.length || 0,
      } : null,
      lastMessage: messages[messages.length - 1],
    });

    console.log('🔧 Available tools:', Object.keys({
      getWeather: tools.getWeather,
      calculate: tools.calculate,
      generateCode: tools.generateCode,
      manageTask: tools.manageTask,
      editCodeWithMorph: tools.editCodeWithMorph,  // ⭐ THE ONLY CODE TOOL
      ...(hasPhpCode ? { validateWidget: tools.validateWidget } : {}), // ⭐ PHP VALIDATION
    }));

    // Debug: Log last message if it has parts (especially for image debugging)
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.parts) {
      console.log('🖼️ Last message has parts:', {
        partsCount: lastMsg.parts.length,
        parts: lastMsg.parts.map((p: any) => ({
          type: p.type,
          hasImage: !!p.image,
          imagePrefix: p.image ? (typeof p.image === 'string' ? p.image.substring(0, 50) + '...' : 'not a string') : null,
        }))
      });
    }

    // Convert messages with error handling (same as main chat)
    let convertedMessages;
    try {
      convertedMessages = convertToModelMessages(messages);
      console.log('✅ Successfully converted messages. Count:', convertedMessages.length);
    } catch (error: any) {
      console.error('❌ Error converting messages:', error);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      console.error('   Original messages:', JSON.stringify(messages, null, 2));
      return new Response(
        JSON.stringify({ error: 'Message conversion failed', details: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current date and time for context
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Build system prompt for Elementor section editing
    let systemPrompt = `You are an expert HTML/CSS/JS/PHP code writing assistant. You help users create and edit web sections for WordPress Elementor pages.

**Current Date & Time:** ${currentDate}, ${currentTime}

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
- 🔍 **REVIEW FIRST:** Before making any edits, ALWAYS review the existing code to understand:
  - Current styling methodology and patterns
  - Color schemes and design system
  - Code structure and organization
  - Existing formatting conventions
  - Then apply edits that match the existing style

**When user asks "can you see my code":**
- If files are shown above with ✅: Say "Yes, I can see your [HTML/CSS/JS/PHP] code" and reference specific content
- If you see ❌: Say "No, the editor appears empty"

${currentSection ? `
**🎯 CURRENT PROJECT:**
- Name: ${currentSection.name || 'Untitled'}
- Type: ${projectType}
- Files: ${['html', 'css', 'js', ...(hasPhpCode ? ['php'] : [])].join(', ')}

When using editCodeWithMorph or validateWidget tools, you are working with the "${currentSection.name || 'Untitled'}" project.
${hasPhpCode ? '\n⚠️ This is a PHP widget project. You can use the validateWidget tool to check code quality before deployment.' : ''}

${currentSection.projectManifest ? `
**📋 PROJECT DOCUMENTATION:**

The following documentation explains what each file in this project does and how they work together:

${currentSection.projectManifest}

**Use this documentation to:**
- Understand the purpose and structure of each file before making edits
- Maintain consistency with the existing architecture
- Know which file to edit when the user requests a specific change
- Provide more contextual and accurate responses about the project
` : ''}
` : ''}

${hasPhpCode ? `
**🔧 ELEMENTOR WIDGET DEVELOPMENT RULES (PHP Projects):**

When working with PHP Elementor widgets, you MUST follow these critical rules:

1. **{{WRAPPER}} CSS Scoping:**
   - ALL CSS selectors MUST start with \`{{WRAPPER}}\` to scope styles to this widget instance only
   - Example: \`.button { }\` is WRONG → \`{{WRAPPER}} .button { }\` is CORRECT
   - This prevents style conflicts with other widgets and site styles
   - {{WRAPPER}} is automatically replaced with a unique selector by Elementor

2. **Widget Structure:**
   - Must extend \`\\Elementor\\Widget_Base\`
   - Required methods: \`get_name()\`, \`get_title()\`, \`get_icon()\`, \`get_categories()\`
   - \`register_controls()\`: Define all widget settings and controls
   - \`render()\`: Output the HTML markup (use \`$settings = $this->get_settings_for_display();\`)
   - \`render_plain_content()\`: Usually empty for custom widgets

3. **Elementor Controls:**
   - Use \`$this->add_control()\` to add settings
   - Control types: text, textarea, wysiwyg, number, color, select, slider, dimensions, etc.
   - Group controls with \`$this->start_controls_section()\` and \`$this->end_controls_section()\`
   - Tabs: TAB_CONTENT (content/layout), TAB_STYLE (styling), TAB_ADVANCED (advanced settings)

4. **Dynamic Content:**
   - Access settings in render() with: \`$settings = $this->get_settings_for_display();\`
   - Use \`$this->add_render_attribute()\` to add HTML attributes dynamically
   - Use \`$this->add_inline_editing_attributes()\` for live inline editing
   - Escape output properly: \`esc_html()\`, \`esc_attr()\`, \`esc_url()\`

5. **Best Practices:**
   - Widget class name format: \`Elementor_WidgetName_Widget\`
   - Widget slug format: \`widget-name\` (lowercase, hyphens)
   - Category: Usually \`'hustle-tools'\` for custom widgets
   - Icon: Elementor icons like \`'eicon-posts-ticker'\`
   - Always validate and sanitize user inputs

6. **Common Mistakes to AVOID:**
   - ❌ CSS without {{WRAPPER}} prefix
   - ❌ Direct echo of user input without escaping
   - ❌ Missing required widget methods
   - ❌ Wrong control types or missing labels
   - ❌ Not using \`get_settings_for_display()\` in render()

**Example PHP Widget Structure:**
\`\`\`php
<?php
namespace ElementorCustomWidgets;

class Elementor_MyWidget_Widget extends \\Elementor\\Widget_Base {

    public function get_name() {
        return 'my-widget';
    }

    public function get_title() {
        return __('My Widget', 'elementor-custom-widgets');
    }

    public function get_icon() {
        return 'eicon-code';
    }

    public function get_categories() {
        return ['hustle-tools'];
    }

    protected function register_controls() {
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'elementor-custom-widgets'),
                'tab' => \\Elementor\\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'title',
            [
                'label' => __('Title', 'elementor-custom-widgets'),
                'type' => \\Elementor\\Controls_Manager::TEXT,
                'default' => __('Default title', 'elementor-custom-widgets'),
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <div class="my-widget">
            <h2><?php echo esc_html($settings['title']); ?></h2>
        </div>
        <?php
    }
}
\`\`\`

**Example CSS with {{WRAPPER}}:**
\`\`\`css
{{WRAPPER}} .my-widget {
    padding: 20px;
    background: #f5f5f5;
}

{{WRAPPER}} .my-widget h2 {
    color: #333;
    font-size: 24px;
}
\`\`\`

**ALWAYS review the existing PHP/CSS code to understand the widget's structure before making edits!**
` : ''}`;

    // Add global CSS context if includeCss is true
    if (includeCss && globalCss && globalCss.trim()) {
      systemPrompt += `\n\n**🎨 GLOBAL STYLE KIT CSS:**

The following CSS represents the global style system for this project. Use these styles as a reference for consistency:

\`\`\`css
${globalCss}
\`\`\`

When generating or modifying HTML/CSS, try to align with these global styles (fonts, colors, spacing) for visual consistency. You can reference or override these styles as needed.`;
    }

    // Enable web search for Perplexity models (same as main chat)
    if (webSearch && model.startsWith('perplexity/')) {
      console.log('Web search enabled with Perplexity model:', model);
      systemPrompt = `You are an expert Elementor JSON editor assistant. ALWAYS USE SEARCH to provide accurate and up-to-date information with sources. Keep responses concise and focused.

**Current Date & Time:** ${currentDate}, ${currentTime}

**Current Elementor JSON context:**
${Object.keys(currentJson).length > 0 ? 'Current page has: ' + JSON.stringify(currentJson, null, 2).substring(0, 1000) + '...' : 'No current JSON loaded'}`;
    } else if (webSearch) {
      console.log('Web search requested but not available for non-Perplexity model:', model);
      systemPrompt += '\n\nNote: Web search was requested but is only available with Perplexity models.';
    }

    // Add tool calling instructions
    systemPrompt += `\n\n**Available Tools:**
- **generateProject**: 🚀 NEW PROJECT GENERATOR - Creates a NEW project from scratch with complete code generation
  - Use when: "generate a hero section", "create a pricing card", "build a contact form", "make a navigation menu"
  - Triggers: "generate", "create", "build", "make" + description of what to build
  - Automatically creates project AND streams HTML/CSS/JS code
  - DO NOT use when editing existing files - use editCodeWithMorph instead
- **editCodeWithMorph**: 🎯 PRIMARY TOOL - For editing EXISTING code or current project files
  - Use when: "change button color", "add navbar", "fix CSS", "update heading"
  - Works on empty files AND existing code
  - Uses lazy edits (// ... existing code ...) for precision
  - 98% accurate, 10x faster than diffs
${hasPhpCode ? '- **validateWidget**: ✅ Validate PHP widget code against Elementor best practices. Returns detailed report with scores and specific issues. Use BEFORE deployment or when user asks to "check" or "validate" the widget.\n' : ''}
- **getWeather**: Get current weather information
- **calculate**: Perform mathematical calculations
- **generateCode**: Generate code snippets in various languages
- **manageTask**: Create and manage tasks

**CRITICAL DECISION TREE:**
1. Is user asking to CREATE something NEW from scratch? → Use **generateProject**
   - Examples: "generate a hero", "create pricing cards", "build a footer"
2. Is user asking to EDIT/MODIFY existing code? → Use **editCodeWithMorph**
   - Examples: "change the color", "add a class", "fix the layout"
${hasPhpCode ? '3. Is user asking to VALIDATE PHP code? → Use **validateWidget**\n' : ''}

After using a tool, provide a brief explanation of what will happen next.`;

    // Configure options based on model type
    const options = model.startsWith('perplexity/') && webSearch ? { search: true } : undefined;

    // Create custom validateWidget tool that has access to currentSection
    const validateWidgetWithContext = tool({
      description: tools.validateWidget.description,
      parameters: tools.validateWidget.parameters,
      execute: async ({ projectName }: { projectName?: string }) => {
        // Check if we have PHP code to validate
        if (!hasPhpCode || !currentSection?.php) {
          return {
            error: 'No PHP widget code found in current project',
            projectName: projectName || currentSection?.name || 'unknown',
            projectType,
          };
        }

        try {
          // Call validation API
          const validationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/validate-widget`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              widgetPhp: currentSection.php,
              widgetName: currentSection.name || 'widget',
              widgetTitle: currentSection.name || 'Widget',
            }),
          });

          if (!validationResponse.ok) {
            return {
              error: 'Validation API request failed',
              status: validationResponse.status,
            };
          }

          const validationResult = await validationResponse.json();

          return {
            ...validationResult,
            projectName: projectName || currentSection.name || 'current',
            projectType: 'PHP Widget',
          };
        } catch (error: any) {
          return {
            error: 'Validation request failed',
            details: error.message,
          };
        }
      },
    });

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
      generateProject: tools.generateProject,      // ⭐ PROJECT GENERATION - Creates new HTML/Elementor projects
      ...(hasPhpCode ? { validateWidget: validateWidgetWithContext } : {}), // ⭐ PHP VALIDATION TOOL - Only available for PHP widgets
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

    // Log the system prompt for debugging
    console.log('📋 System Prompt (first 1000 chars):', systemPrompt.substring(0, 1000) + '...');
    console.log('📋 System Prompt includes currentSection files:', systemPrompt.includes('📄 HTML FILE'));

    const streamConfig: any = {
      model: model, // Just pass the model string (gateway is handled automatically)
      system: systemPrompt,
      messages: convertedMessages,
      // Disable tools when web search is enabled
      ...(!webSearch && { tools: toolsConfig, maxSteps: 10 }),
      onStepStart: ({ stepType, toolCalls }) => {
        // Log when a tool call step starts
        if (stepType === 'tool-call' && toolCalls) {
          console.log('🔧 TOOL CALL STEP START:', toolCalls.map(tc => ({
            name: tc.toolName,
            args: tc.args,
          })));
        }
      },
      onStepFinish: ({ stepType, toolCalls, toolResults, finishReason }) => {
        // Log when a tool call step finishes
        if (stepType === 'tool-call') {
          console.log('✅ TOOL CALL STEP FINISH:', {
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
      onFinish: async ({ usage, finishReason }) => {
        // Log to API Monitor when stream completes
        const responseTime = Date.now() - startTime;

        // Extract provider from model string (e.g., "anthropic/claude-haiku-4-5-20251001" -> "anthropic")
        const [provider, modelName] = model.includes('/')
          ? model.split('/')
          : ['unknown', model];

        apiMonitor.log({
          endpoint: '/api/chat-elementor',
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

        console.log('📊 Usage data from AI:', usage);
      },
    };

    console.log('📤 Final stream config:', {
      hasTools: !!streamConfig.tools,
      toolChoice: streamConfig.toolChoice,
      toolCount: Object.keys(streamConfig.tools).length,
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
    // ============================================================================
    let managedMessages = convertedMessages;
    let windowStrategy: 'full' | 'sliding-window' | 'summarized' | 'exceeded' = 'full';

    if (validation.percentUsed >= 70 || !validation.isValid) {
      const { manageConversationWindow } = await import('@/lib/token-validator');

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

        // Update streamConfig to use managed messages
        streamConfig.messages = managedMessages;
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

    // When web search is enabled, filter out tool messages from history
    // This prevents errors when switching from tool-using models to Perplexity
    if (webSearch) {
      console.log('🔧 Filtering tool messages for web search mode (chat-elementor)');
      const currentMessages = streamConfig.messages;
      const filteredMessages: any[] = [];

      for (let i = 0; i < currentMessages.length; i++) {
        const msg = currentMessages[i];

        // Skip tool-result messages
        if (msg.role === 'tool') {
          console.log('⚠️ Skipping tool-result message');
          continue;
        }

        // Skip assistant messages that only contain tool-calls
        if (msg.role === 'assistant' && Array.isArray(msg.content)) {
          const hasOnlyToolCalls = msg.content.every((part: any) => part.type === 'tool-call');
          if (hasOnlyToolCalls) {
            console.log('⚠️ Skipping assistant message with only tool-calls');
            continue;
          }

          // If message has both text and tool-calls, keep only the text
          const hasToolCalls = msg.content.some((part: any) => part.type === 'tool-call');
          if (hasToolCalls) {
            console.log('⚠️ Filtering tool-calls from assistant message, keeping text');
            msg.content = msg.content.filter((part: any) => part.type !== 'tool-call');
          }
        }

        filteredMessages.push(msg);
      }
      streamConfig.messages = filteredMessages;
      console.log('✅ Filtered messages for web search (chat-elementor):', filteredMessages.length, 'messages remaining');
    }

    const result = streamText(streamConfig);

    console.log('✅ Returning stream response with sources and tools');

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

          // Calculate token usage recommendation
          const recommendation = getTokenUsageRecommendation(validation.percentUsed);

          return {
            promptTokens: usage.inputTokens || 0,
            completionTokens: usage.outputTokens || 0,
            totalTokens: usage.totalTokens || 0,
            cacheCreationTokens: 0, // Not available in totalUsage
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
              strategy: windowStrategy,
            },
          };
        }
      },
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    // Log error to API Monitor
    apiMonitor.log({
      endpoint: '/api/chat-elementor',
      method: 'POST',
      provider: 'unknown',
      model: 'unknown',
      responseStatus: 500,
      responseTime,
      success: false,
      error: error.message || 'Chat request failed',
    });

    console.error('❌ Elementor chat error:', error);
    return Response.json(
      {
        error: error.message || 'Chat request failed',
      },
      { status: 500 }
    );
  }
}
