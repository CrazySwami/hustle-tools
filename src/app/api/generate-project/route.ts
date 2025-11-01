import { streamText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { description, projectType, projectName, model = 'anthropic/claude-sonnet-4-5-20250929' } = await req.json();

    console.log('🚀 Project Generation Request:', { description, projectType, projectName, model });

    // Build prompt based on project type
    const isElementor = projectType === 'elementor';

    const systemPrompt = isElementor
      ? `You are an expert Elementor widget developer. Generate complete, production-ready code for an Elementor widget based on the user's description.

**CRITICAL RULES:**
1. **HTML**: Section-level markup only (NO DOCTYPE, html, head, body tags). Use semantic HTML5.
2. **CSS**: Include {{WRAPPER}} prefix for ALL widget-specific selectors. Do NOT scope global selectors (body, html, *, :root) or @rules (@font-face, @keyframes, @media).
3. **JavaScript**: Vanilla JS only, wrapped in IIFE. No jQuery. Use modern ES6+.
4. **Structure**: Follow Elementor widget best practices - proper nesting, controls, responsive design.
5. **Accessibility**: Include ARIA labels, semantic markup, keyboard navigation.
6. **Performance**: Optimize images, minimize DOM manipulation, use CSS transforms.

**IMPORTANT**: Generate code that will be converted to a PHP Elementor widget. Focus on clean, maintainable markup that works well in the Elementor editor.`
      : `You are an expert frontend developer. Generate complete, production-ready HTML/CSS/JS code for a web section based on the user's description.

**CRITICAL RULES:**
1. **HTML**: Section-level markup only (NO DOCTYPE, html, head, body tags). Use semantic HTML5.
2. **CSS**: Complete styles including responsive design, modern layout (flexbox/grid), transitions/animations.
3. **JavaScript**: Vanilla JS only if needed. Modern ES6+. No framework dependencies.
4. **Design**: Modern, clean, professional design with good spacing, typography, and color harmony.
5. **Accessibility**: Semantic HTML, ARIA labels where needed, keyboard navigation.
6. **Responsive**: Mobile-first approach, breakpoints at 768px (tablet) and 1024px (desktop).

**IMPORTANT**: Create standalone, copy-paste ready code that works immediately in any modern browser.`;

    const userPrompt = `Create a ${isElementor ? 'Elementor widget' : 'HTML section'} for: ${description}

**Project Name**: ${projectName}
**Type**: ${projectType}

Generate the code in THREE PARTS (in order):
1. **HTML** - Complete markup
2. **CSS** - Complete styles${isElementor ? ' (with {{WRAPPER}} scoping where appropriate)' : ''}
3. **JavaScript** - Complete functionality (if needed, otherwise return empty)

${isElementor ? `
**Elementor-Specific Requirements:**
- Use {{WRAPPER}} for widget-specific selectors (e.g., {{WRAPPER}} .button, {{WRAPPER}} .heading)
- Do NOT use {{WRAPPER}} for: body, html, *, :root, @font-face, @keyframes, @media
- Structure markup for easy conversion to PHP render() method
- Include data attributes for Elementor controls if relevant
` : ''}

Start with HTML, then CSS, then JS. Be comprehensive and production-ready.`;

    // Stream the generation
    const result = await streamText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Return streaming response
    return new Response(result.textStream, {
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
