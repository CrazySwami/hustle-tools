// Code Editing API with streaming - AI-powered code modifications
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { selectModelForCodeEdit } from '@/lib/model-router';
import { validateCode } from '@/lib/code-validator';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const {
      instruction,
      fileType,
      currentCode,
      context = '',
      allFiles = {
        html: '',
        css: '',
        js: '',
        php: ''
      }
    }: {
      instruction: string;
      fileType: 'html' | 'css' | 'js' | 'php';
      currentCode: string;
      context?: string;
      allFiles?: {
        html: string;
        css: string;
        js: string;
        php?: string;
      };
    } = await req.json();

    console.log(`✏️  Editing ${fileType.toUpperCase()} code...`, {
      instruction: instruction.substring(0, 100),
      codeLength: currentCode.length,
      hasContext: !!context,
      contextFiles: {
        html: allFiles.html?.length || 0,
        css: allFiles.css?.length || 0,
        js: allFiles.js?.length || 0,
        php: allFiles.php?.length || 0,
      }
    });

    // Smart model selection based on task complexity
    const codeLineCount = currentCode.split('\n').length;
    const modelSelection = selectModelForCodeEdit(instruction, fileType, codeLineCount);

    console.log(`🤖 Using model: ${modelSelection.model} (${modelSelection.tier})`, {
      reasoning: modelSelection.reasoning,
      lineCount: codeLineCount,
    });

    // Detect if this is an Elementor widget (PHP file exists) or HTML section
    const isElementorWidget = !!(allFiles.php && allFiles.php.trim().length > 0);
    const isEmptyFile = !currentCode || currentCode.trim().length === 0;
    const actionVerb = isEmptyFile ? 'Generate' : 'Edit';

    // Build context section from other files
    const buildContextSection = (targetFile: string) => {
      const sections: string[] = [];

      if (allFiles.html && targetFile !== 'html' && allFiles.html.trim()) {
        sections.push(`**HTML Structure (for reference):**
\`\`\`html
${allFiles.html}
\`\`\``);
      }

      if (allFiles.css && targetFile !== 'css' && allFiles.css.trim()) {
        sections.push(`**CSS Styles (for reference):**
\`\`\`css
${allFiles.css}
\`\`\``);
      }

      if (allFiles.js && targetFile !== 'js' && allFiles.js.trim()) {
        sections.push(`**JavaScript (for reference):**
\`\`\`javascript
${allFiles.js}
\`\`\``);
      }

      if (allFiles.php && targetFile !== 'php' && allFiles.php.trim()) {
        sections.push(`**PHP Widget (for reference):**
\`\`\`php
${allFiles.php}
\`\`\``);
      }

      return sections.length > 0 ? '\n\n' + sections.join('\n\n') : '';
    };

    const contextSection = buildContextSection(fileType);

    const prompts = {
      html: `You are an expert ${isElementorWidget ? 'Elementor widget' : 'HTML'} developer. ${actionVerb} the HTML code according to the user's instruction.

**USER INSTRUCTION:** ${instruction}

${context ? `**ADDITIONAL CONTEXT:** ${context}\n` : ''}

**SEPARATION OF CONCERNS (CRITICAL):**
- **HTML = STRUCTURE ONLY** - Define the layout, hierarchy, and content structure
- **NO STYLING IN HTML** - All visual design belongs in the CSS file
- **NO FUNCTIONALITY IN HTML** - All interactivity belongs in the JavaScript file
- Unless the user explicitly instructs otherwise, ALWAYS maintain strict separation
- Do NOT add inline styles, style attributes, or onclick handlers
- Do NOT include <style> or <script> tags in the HTML

${isEmptyFile ? `
**GENERATION MODE ACTIVE:**
You are creating NEW code from scratch. ${contextSection ? 'Use the context files as reference to ensure compatibility:' : ''}
- Match the design patterns and structure from existing files
- Use consistent naming conventions (classes, IDs, data attributes)
- Ensure the new ${fileType} integrates seamlessly with existing files
- ${isElementorWidget ? 'Follow Elementor widget render() method structure' : 'Create standalone section markup'}
` : `
**EDIT MODE ACTIVE:**
You are modifying EXISTING code. Make minimal, targeted changes:
- Preserve existing structure and only change what's necessary
- Maintain compatibility with existing code in other files
- Keep the original style and patterns
- ${isElementorWidget ? 'Maintain Elementor widget structure and controls' : 'Maintain section-level markup'}
`}

**CRITICAL REQUIREMENTS - OUTPUT FORMAT:**
${isEmptyFile ? `
- Output the COMPLETE new HTML code (generating from scratch)
- Start immediately with the opening tag
` : `
- Output ONLY a UNIFIED DIFF PATCH (NOT the full file!)
- Use standard unified diff format with @@ line markers
- Include 3 lines of context before/after changes
- Mark deletions with - (minus) and additions with + (plus)
`}
- NO markdown code fences - NO \`\`\`html or \`\`\` markers
- NO explanatory text before or after
${isElementorWidget ? `
- This is ELEMENTOR WIDGET MARKUP - render() method content only
- Use Elementor helper methods: $this->get_settings_for_display()
- Use proper escaping: <?php echo esc_html(...); ?>, <?php echo esc_attr(...); ?>
- Include data attributes for Elementor editor: data-id, data-element_type
` : `
- NO <!DOCTYPE html> - THIS IS A SECTION, NOT A PAGE
- NO <html>, <head>, or <body> tags - SECTION ONLY
`}
- NO <style> or <script> tags - ONLY HTML markup
- Preserve existing structure and only make the requested changes
- Maintain proper indentation and formatting
- Keep all existing HTML comments
- Use semantic HTML5 elements where appropriate
- Ensure all tags are properly closed

OUTPUT FORMAT: Start immediately with the opening tag (like <div> or <section>) and end with the closing tag.`,

      css: `You are an expert CSS developer. ${actionVerb} the CSS code according to the user's instruction.

**USER INSTRUCTION:** ${instruction}

${context ? `**ADDITIONAL CONTEXT:** ${context}\n` : ''}

**SEPARATION OF CONCERNS (CRITICAL):**
- **CSS = STYLING ONLY** - Define all visual presentation, colors, spacing, typography
- **NO STRUCTURE IN CSS** - Do not add content via ::before/::after unless purely decorative
- **NO FUNCTIONALITY IN CSS** - All interactivity belongs in the JavaScript file
- Unless the user explicitly instructs otherwise, ALWAYS maintain strict separation
- Do NOT include HTML markup or JavaScript in CSS

${isEmptyFile ? `
**GENERATION MODE ACTIVE:**
You are creating NEW CSS from scratch. ${contextSection ? 'Use the context files as reference:' : ''}
- Style elements that exist in the HTML structure
- Use class names and IDs that match the HTML
- ${isElementorWidget ? 'Use Elementor-specific selectors (.elementor-widget, .elementor-element)' : 'Create section-specific styles'}
- Ensure responsive design (mobile-first approach)
` : `
**EDIT MODE ACTIVE:**
You are modifying EXISTING CSS. Make minimal, targeted changes:
- Preserve existing selectors and only change what's necessary
- Maintain compatibility with HTML structure
- Keep the original CSS architecture
`}

**CRITICAL REQUIREMENTS - OUTPUT FORMAT:**
${isEmptyFile ? `
- Output the COMPLETE new CSS code (generating from scratch)
- Start immediately with the first selector
` : `
- Output ONLY a UNIFIED DIFF PATCH (NOT the full file!)
- Use standard unified diff format with @@ line markers
- Include 3 lines of context before/after changes
- Mark deletions with - (minus) and additions with + (plus)
- Example format:
@@ -10,7 +10,7 @@
   padding: 20px;
   margin: 0 auto;
 }
-.button {
-  background: red;
+.button {
+  background: blue;
 }
`}
- NO markdown code fences - NO \`\`\`css or \`\`\` markers
- NO explanatory text before or after
- Preserve existing selectors and only make the requested changes
- Maintain proper indentation and formatting
- Keep all existing CSS comments
- Use modern CSS features where appropriate
- Ensure proper syntax (semicolons, braces)
- Keep CSS custom properties (variables) intact
- ${isElementorWidget ? 'Use Elementor CSS best practices (BEM-like naming)' : 'Use semantic class names'}

OUTPUT FORMAT: Start immediately with the first selector and end with the last closing brace. NOTHING else.`,

      js: `You are an expert JavaScript developer. ${actionVerb} the JavaScript code according to the user's instruction.

**USER INSTRUCTION:** ${instruction}

${context ? `**ADDITIONAL CONTEXT:** ${context}\n` : ''}

**SEPARATION OF CONCERNS (CRITICAL):**
- **JavaScript = FUNCTIONALITY ONLY** - Define all interactivity, event handling, dynamic behavior
- **NO STRUCTURE IN JS** - Do not create HTML elements in JS unless absolutely necessary for dynamic content
- **NO STYLING IN JS** - Do not manipulate inline styles; add/remove CSS classes instead
- Unless the user explicitly instructs otherwise, ALWAYS maintain strict separation
- Prefer classList.add/remove over setting style.property
- Do NOT include HTML markup or CSS stylesheets in JavaScript

${isEmptyFile ? `
**GENERATION MODE ACTIVE:**
You are creating NEW JavaScript from scratch. ${contextSection ? 'Use the context files as reference:' : ''}
- Target DOM elements that exist in the HTML structure
- Use selectors (querySelector) for elements in the HTML
- ${isElementorWidget ? 'Use Elementor frontend API: elementorFrontend.hooks, $element' : 'Use vanilla JavaScript or jQuery'}
- Ensure cross-browser compatibility
` : `
**EDIT MODE ACTIVE:**
You are modifying EXISTING JavaScript. Make minimal, targeted changes:
- Preserve existing functionality and only change what's necessary
- Maintain compatibility with HTML and CSS
- Keep the original code structure
`}

**CRITICAL REQUIREMENTS - OUTPUT FORMAT:**
${isEmptyFile ? `
- Output the COMPLETE new JavaScript code (generating from scratch)
- Start immediately with the first line of code
` : `
- Output ONLY a UNIFIED DIFF PATCH (NOT the full file!)
- Use standard unified diff format with @@ line markers
- Include 3 lines of context before/after changes
- Mark deletions with - (minus) and additions with + (plus)
`}
- NO markdown code fences - NO \`\`\`javascript or \`\`\` markers
- NO explanatory text before or after
- Preserve existing functionality and only make the requested changes
- Maintain proper indentation and formatting
- Keep all existing comments
- Use modern JavaScript (ES6+) features
- Ensure proper syntax (parentheses, braces, semicolons)
- Preserve variable scoping (const, let)
- ${isElementorWidget ? 'Use Elementor JavaScript patterns (elementorFrontend, $scope)' : 'Use standard DOM manipulation'}

OUTPUT FORMAT: Start immediately with the first line of code and end with the last line. NOTHING else.`,

      php: `You are an expert PHP/Elementor widget developer. ${actionVerb} the PHP widget code according to the user's instruction.

**USER INSTRUCTION:** ${instruction}

${context ? `**ADDITIONAL CONTEXT:** ${context}\n` : ''}

${isEmptyFile ? `
**GENERATION MODE ACTIVE:**
You are creating a NEW Elementor widget from scratch. ${contextSection ? 'Use the context files as reference:' : ''}
- Create complete widget class extending \\Elementor\\Widget_Base
- Include all required methods: get_name(), get_title(), get_icon(), get_categories()
- Define controls in register_controls() method
- Render HTML/CSS/JS in render() method using settings
- Use HTML/CSS/JS from context files as the render() output
` : `
**EDIT MODE ACTIVE:**
You are modifying an EXISTING Elementor widget. Make minimal, targeted changes:
- Preserve widget class structure
- Maintain existing controls and settings
- Keep the original architecture
- Only modify the requested parts
`}

**CRITICAL REQUIREMENTS:**
- Output ONLY the complete, edited PHP code
- NO markdown code fences - NO \`\`\`php or \`\`\` markers
- NO explanatory text before or after the code
- Preserve Elementor widget structure (get_name, get_title, register_controls, render)
- Maintain proper indentation and formatting
- Keep all existing comments
- Use proper escaping (esc_html, esc_attr, esc_url, wp_kses_post)
- Ensure proper PHP syntax
- Preserve namespace and class declarations
- Use $this->get_settings_for_display() in render() method
- Include proper docblocks for methods

**CRITICAL REQUIREMENTS - OUTPUT FORMAT:**
${isEmptyFile ? `
- Output the COMPLETE new PHP widget code (generating from scratch)
- Start immediately with <?php
` : `
- Output ONLY a UNIFIED DIFF PATCH (NOT the full file!)
- Use standard unified diff format with @@ line markers
- Include 3 lines of context before/after changes
- Mark deletions with - (minus) and additions with + (plus)
`}
- NO markdown code fences - NO \`\`\`php or \`\`\` markers
- NO explanatory text before or after`,
    };

    // Stream the edited code with prompt caching
    // Cache system prompts and context for massive token savings
    const result = streamText({
      model: gateway(modelSelection.model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      messages: [
        {
          role: 'user',
          content: [
            // CACHE LAYER 1: System prompt (99% cache hit - rarely changes)
            {
              type: 'text',
              text: prompts[fileType],
              experimental_providerMetadata: {
                anthropic: {
                  cacheControl: { type: 'ephemeral' }
                }
              }
            },
            // CACHE LAYER 2: Context files (90% cache hit - changes when other files edited)
            {
              type: 'text',
              text: contextSection,
              experimental_providerMetadata: {
                anthropic: {
                  cacheControl: { type: 'ephemeral' }
                }
              }
            },
            // CACHE LAYER 3: Current code (80% cache hit - changes per edit iteration)
            {
              type: 'text',
              text: `\n\n**CURRENT ${fileType.toUpperCase()} CODE TO EDIT:**\n\`\`\`${fileType}\n${currentCode}\n\`\`\``,
              experimental_providerMetadata: {
                anthropic: {
                  cacheControl: { type: 'ephemeral' }
                }
              }
            },
            // NOT CACHED: Instruction (changes every request)
            {
              type: 'text',
              text: `\n\n**FINAL INSTRUCTION:** ${instruction}${context ? `\n**CONTEXT:** ${context}` : ''}`
            }
          ]
        }
      ],
      temperature: 0.3, // Lower temperature for more precise code editing
    });

    console.log(`✅ Streaming edited ${fileType.toUpperCase()} code with ${modelSelection.model}`);

    // Wrap the stream with validation to catch empty/invalid responses
    const textStream = result.toTextStreamResponse();
    const reader = textStream.body?.getReader();

    if (!reader) {
      throw new Error('Failed to create stream reader');
    }

    let accumulatedText = '';
    const decoder = new TextDecoder();

    const validatedStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Validate final output before closing
              const trimmedText = accumulatedText.trim();

              // Check 1: Output is too short (likely empty or error)
              if (trimmedText.length < 10) {
                console.error('❌ VALIDATION FAILED: Empty or very short AI response:', trimmedText.length, 'chars');
                const errorMsg = `\n\n<!-- ⚠️ AI RESPONSE ERROR ⚠️

Output too short (${trimmedText.length} chars). This may be due to:
- Model rate limiting or timeout
- Invalid prompt formatting
- Context window exceeded
- Model returned empty response

SOLUTIONS:
1. Try again in a few seconds (may be rate limit)
2. Simplify your instruction
3. Use direct file replacement mode instead
4. Check that your code is valid ${fileType.toUpperCase()}

If this persists, the issue is likely with the AI model, not your code. -->`;

                controller.enqueue(new TextEncoder().encode(errorMsg));
              }

              // Check 2: Edit mode but no diff markers (model failed to generate diff)
              if (!isEmptyFile && trimmedText.length > 0 && trimmedText.length < 50) {
                const hasDiffMarkers = trimmedText.includes('@@') || trimmedText.startsWith('---') || trimmedText.startsWith('diff');

                if (!hasDiffMarkers) {
                  console.error('❌ VALIDATION FAILED: Edit mode missing diff markers');
                  const warningMsg = `\n\n<!-- ⚠️ DIFF FORMAT ERROR ⚠️

Expected unified diff format but got incomplete response.
The AI model should have returned a diff like:

@@ -10,7 +10,7 @@
  context line
  context line
- old line
+ new line
  context line

SOLUTIONS:
1. Try your request again (model may have failed)
2. Be more specific about what to change
3. Use direct replacement: "replace the CSS with..."

Response received: "${trimmedText.substring(0, 100)}..." -->`;

                  controller.enqueue(new TextEncoder().encode(warningMsg));
                }
              }

              console.log(`✅ Stream complete: ${trimmedText.length} chars`);
              controller.close();
              break;
            }

            // Track accumulated text for validation
            const chunk = decoder.decode(value, { stream: true });
            accumulatedText += chunk;

            // Forward the chunk to client
            controller.enqueue(value);
          }
        } catch (error: any) {
          console.error('❌ Stream validation error:', error);
          const errorMsg = `\n\n<!-- ❌ STREAM ERROR: ${error.message} -->`;
          controller.enqueue(new TextEncoder().encode(errorMsg));
          controller.close();
        }
      }
    });

    return new Response(validatedStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error('❌ Code editing error:', error);
    return Response.json(
      {
        error: error.message || 'Code editing failed',
      },
      { status: 500 }
    );
  }
}
