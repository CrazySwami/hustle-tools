// HTML/CSS/JS generation API with streaming
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const {
      description,
      images = [],
      type = 'html', // 'html', 'css', or 'js'
      model = 'anthropic/claude-sonnet-4-5-20250929',
      generatedHtml = '', // Pass HTML to CSS/JS generation
      generatedCss = '', // Pass CSS to JS generation
    }: {
      description: string;
      images: Array<{ url: string; filename: string; description: string }>;
      type: 'html' | 'css' | 'js';
      model?: string;
      generatedHtml?: string;
      generatedCss?: string;
    } = await req.json();

    console.log(`🎨 Generating ${type.toUpperCase()}...`, {
      description: description.substring(0, 100),
      imageCount: images.length,
      hasHtml: !!generatedHtml,
      hasCss: !!generatedCss,
    });

    // Build comprehensive prompt
    const imageContext = images.length > 0
      ? `\n\n**Reference Images:**\n${images.map((img, i) => `\nImage ${i + 1} (${img.filename}):\n${img.description}`).join('\n\n')}`
      : '';

    const prompts = {
      html: `You are an expert web developer. Generate clean, semantic HTML5 code for a SECTION/COMPONENT (NOT a full page) based on this description:

**Description:** ${description}${imageContext}

**CRITICAL REQUIREMENTS:**
- Generate ONLY the section content - NO <!DOCTYPE>, NO <html>, NO <head>, NO <body> tags
- NO markdown code fences - NO \`\`\`html or \`\`\` markers
- DO NOT include ANY CSS - NO <style> tags, NO inline styles, NO style attributes
- NO explanatory text before or after the code
- The CSS will be generated separately, so only output pure HTML markup
- This is a reusable section/component that will be inserted into an existing page
- Use semantic HTML5 elements (section, article, header, div, etc.)
- Include appropriate ARIA labels for accessibility
- Add data attributes for potential JavaScript hooks
- Include comments for major sections
- Make it responsive-ready with appropriate class names
- Use descriptive class names (e.g., "hero-section", "pricing-card", "contact-form")

OUTPUT FORMAT: Start immediately with the opening tag (e.g., <section class="...">) and end with the closing tag (e.g., </section>). NOTHING else. No markdown. No explanations.`,

      css: `You are an expert CSS developer. Generate modern, production-ready CSS code for this section/component:

**Description:** ${description}${imageContext}

${generatedHtml ? `**GENERATED HTML STRUCTURE:**
\`\`\`html
${generatedHtml}
\`\`\`

Study the HTML structure above carefully. You MUST style ALL elements, classes, and components present in this HTML.` : ''}

**IMPORTANT CONTEXT:**
- The HTML has already been generated${generatedHtml ? ' (shown above)' : ' separately'}
- You are ONLY generating the CSS that styles that HTML
- DO NOT include any HTML markup in your response

**CRITICAL REQUIREMENTS:**
- This is PURE CSS ONLY for a SECTION/COMPONENT (not a full page)
- NO markdown code fences - NO \`\`\`css or \`\`\` markers
- NO <style> tags, NO <html> tags, NO HTML markup whatsoever
- NO explanatory text before or after the code
- **COMPREHENSIVE STYLING REQUIRED:** Style EVERY element in the HTML - headings, paragraphs, buttons, cards, containers, icons, etc.
- **VISUAL POLISH:** Add beautiful typography, spacing, colors, shadows, borders, and visual hierarchy
- Use CSS custom properties (variables) for colors, spacing, typography at the TOP of the CSS
- Implement responsive design with mobile-first approach
- Use modern CSS (Grid, Flexbox, Container Queries if appropriate)
- Include smooth transitions and hover states for interactive elements
- Add professional shadows, gradients, and visual effects where appropriate
- Style buttons with hover, active, and focus states
- Add subtle animations for visual appeal (fade-ins, scale effects, etc.)
- Ensure proper spacing and alignment for a polished look
- Add comments for major sections
- Use descriptive class selectors matching the HTML structure
- Include common breakpoints (mobile: 768px, tablet: 1024px, desktop: 1280px)
- Scope styles to the section to avoid conflicts with other page elements
- Make it production-ready and visually impressive

OUTPUT FORMAT: Start immediately with the first CSS selector (e.g., .hero-section { or :root {) and end with the last closing brace. NOTHING else.`,

      js: `You are an expert JavaScript developer. Generate clean, modern JavaScript code for this section/component:

**Description:** ${description}${imageContext}

${generatedHtml ? `**GENERATED HTML STRUCTURE:**
\`\`\`html
${generatedHtml}
\`\`\`

Study the HTML structure above carefully. Target the specific classes and elements shown.` : ''}

${generatedCss ? `**GENERATED CSS:**
\`\`\`css
${generatedCss.substring(0, 500)}...
\`\`\`

The CSS above provides styling context for your JavaScript.` : ''}

**IMPORTANT CONTEXT:**
- The HTML and CSS have already been generated${generatedHtml ? ' (shown above)' : ' separately'}
- You are ONLY generating the JavaScript that adds interactivity
- DO NOT include any HTML or CSS in your response

**CRITICAL REQUIREMENTS:**
- This is PURE JavaScript ONLY for a SECTION/COMPONENT (not a full page)
- NO markdown code fences - NO \`\`\`javascript or \`\`\` markers
- NO <script> tags, NO <html> tags, NO <style> tags, NO HTML/CSS markup whatsoever
- NO explanatory text before or after the code
- Use vanilla JavaScript (ES6+)
- Add interactivity, animations, or dynamic functionality as needed
- Include event listeners for user interactions (clicks, hovers, scrolls, etc.)
- Use modern patterns (arrow functions, destructuring, etc.)
- Add error handling where appropriate
- Include helpful comments
- Keep it modular and scoped to avoid conflicts
- Use query selectors that target the specific section classes from the HTML
- Wrap code in IIFE or use const/let to avoid global scope pollution
- Use DOMContentLoaded or defer execution if needed

OUTPUT FORMAT: Start immediately with JavaScript code (e.g., (function() { or const pricing = ...) and end with the last semicolon or closing brace. If no JavaScript is needed, output ONLY a comment like: // No JavaScript needed for this static section

NOTHING else. No markdown. No explanations.`,
    };

    const result = streamText({
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      prompt: prompts[type],
      temperature: 0.7,
    });

    console.log(`✅ Streaming ${type.toUpperCase()} response`);

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('❌ HTML generation error:', error);
    return Response.json(
      {
        error: error.message || 'HTML generation failed',
      },
      { status: 500 }
    );
  }
}
