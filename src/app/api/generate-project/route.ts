import { streamText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { description, projectType, projectName, model = 'anthropic/claude-sonnet-4-5-20250929' } = await req.json();

    console.log('🚀 Project Generation Request:', { description, projectType, projectName, model });

    // Build prompt based on project type
    const isElementor = projectType === 'elementor';

    const systemPrompt = isElementor
      ? `You are an expert Elementor widget developer. Generate a COMPLETE, PRODUCTION-READY PHP widget class.

**CRITICAL REQUIREMENTS:**

1. **Complete PHP Class Structure**:
   - Extend \\Elementor\\Widget_Base
   - Include proper PHP opening tags and namespace
   - Add ABSPATH security check
   - Implement ALL required methods

2. **Required Methods**:
   - get_name() - Return widget identifier (snake_case)
   - get_title() - Return human-readable title
   - get_icon() - Return Elementor icon (eicon-*)
   - get_categories() - Return ['general'] or specific category
   - get_keywords() - Return relevant search keywords array
   - register_controls() - Define all Elementor controls
   - render() - Output the widget HTML

3. **register_controls() Guidelines**:
   - Use start_controls_section() and end_controls_section()
   - Add controls for CONTENT tab (text, images, URLs, etc.)
   - Add controls for STYLE tab (colors, typography, spacing)
   - Use proper control types: TEXT, TEXTAREA, COLOR, TYPOGRAPHY, DIMENSIONS, etc.
   - Include 'selector' and 'description' for each control
   - Group related controls logically

4. **render() Method Rules**:
   - Use $settings = $this->get_settings_for_display()
   - Output semantic HTML5 markup
   - Use esc_html(), esc_attr(), esc_url() for all dynamic content
   - Add CSS classes for styling hooks
   - Include data attributes if needed for JS

5. **CSS Scoping**:
   - All styles use {{WRAPPER}} prefix for widget-specific selectors
   - Do NOT use {{WRAPPER}} for: body, html, *, :root, @font-face, @keyframes, @media
   - Use 'selectors' parameter in controls for dynamic styling

6. **Best Practices**:
   - Add helpful descriptions to controls
   - Use default values for all controls
   - Follow WordPress coding standards
   - Include proper escaping and sanitization
   - Make widget fully responsive
   - Add ARIA labels for accessibility

**IMPORTANT**: Generate ONLY the complete PHP class. Do NOT include plugin registration code or file includes.`
      : `You are an expert frontend developer. Generate complete, production-ready HTML/CSS/JS code for a web section based on the user's description.

**CRITICAL RULES:**
1. **HTML**: Section-level markup only (NO DOCTYPE, html, head, body tags). Use semantic HTML5.
2. **CSS**: Complete styles including responsive design, modern layout (flexbox/grid), transitions/animations.
3. **JavaScript**: Vanilla JS only if needed. Modern ES6+. No framework dependencies.
4. **Design**: Modern, clean, professional design with good spacing, typography, and color harmony.
5. **Accessibility**: Semantic HTML, ARIA labels where needed, keyboard navigation.
6. **Responsive**: Mobile-first approach, breakpoints at 768px (tablet) and 1024px (desktop).

**IMPORTANT**: Create standalone, copy-paste ready code that works immediately in any modern browser.`;

    const userPrompt = isElementor
      ? `Create a complete Elementor PHP widget for: ${description}

**Widget Name**: ${projectName}

Generate a COMPLETE PHP widget class with:

1. **Class name**: Elementor_${projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_')}_Widget
2. **Widget identifier**: ${projectName}
3. **Widget title**: ${projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}

**Structure the widget with:**
- Proper PHP class extending \\Elementor\\Widget_Base
- All 7 required methods (get_name, get_title, get_icon, get_categories, get_keywords, register_controls, render)
- Comprehensive controls in register_controls() - add controls for ALL customizable elements
- Complete render() method that outputs semantic HTML using $settings
- Include inline styles using {{WRAPPER}} scoping where appropriate

**Make it production-ready:**
- Add default values for all controls
- Use proper escaping (esc_html, esc_attr, esc_url)
- Include helpful control descriptions
- Add responsive design considerations
- Follow WordPress/Elementor coding standards

Output ONLY the PHP code wrapped in \`\`\`php code blocks. Be comprehensive and include all necessary controls.`
      : `Create a ${projectType} for: ${description}

**Project Name**: ${projectName}
**Type**: ${projectType}

Generate the code in THREE PARTS (in order):
1. **HTML** - Complete markup
2. **CSS** - Complete styles
3. **JavaScript** - Complete functionality (if needed, otherwise return empty)

Start with HTML, then CSS, then JS. Be comprehensive and production-ready.`;

    // Stream the generation
    const result = await streamText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Create a custom stream that includes usage metadata at the end
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the text content
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk));
          }

          // Get final usage after streaming completes
          const usage = await result.usage;
          const finishReason = await result.finishReason;

          // Send usage metadata as a special marker at the end
          const usageMetadata = {
            __USAGE__: true,
            usage,
            finishReason,
            model,
          };
          controller.enqueue(encoder.encode('\n\n__USAGE__:' + JSON.stringify(usageMetadata)));

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('❌ Project generation error:', error);
    return Response.json(
      { error: 'Project generation failed', details: error.message },
      { status: 500 }
    );
  }
}
