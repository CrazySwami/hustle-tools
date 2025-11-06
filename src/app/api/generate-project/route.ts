import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { getProjectConfig } from '@/lib/project-generation/config';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const {
      description,
      projectType,
      projectName,
      model = 'anthropic/claude-sonnet-4-5-20250929',
      existingCode,
      globalCSS,
      hubspotModuleType = 'email',
      images = [] // Array of image data URLs
    } = await req.json();

    console.log('🚀 Project Generation Request:', {
      description,
      projectType,
      projectName,
      model,
      hasExistingCode: !!existingCode,
      hasGlobalCSS: !!globalCSS,
      hubspotModuleType,
      imageCount: images.length
    });

    // Build prompt based on project type
    const isElementor = projectType === 'elementor' || projectType === 'convert-to-elementor';
    const isHubSpot = projectType === 'hubspot';

    // Get project config (system prompt, parsers, etc.)
    const config = getProjectConfig(
      isElementor ? 'elementor' : isHubSpot ? 'hubspot' : projectType,
      hubspotModuleType
    );
    const systemPrompt = config.systemPrompt;

    // Build existing code context if provided
    const isConvertMode = projectType === 'convert-to-elementor';
    const existingCodeContext = existingCode ? `
**📋 EXISTING CODE TO CONVERT:**

**HTML (${existingCode.html?.length || 0} characters):**
\`\`\`html
${existingCode.html || '(empty)'}
\`\`\`

**CSS (${existingCode.css?.length || 0} characters):**
\`\`\`css
${existingCode.css || '(empty)'}
\`\`\`

**JavaScript (${existingCode.js?.length || 0} characters):**
\`\`\`javascript
${existingCode.js || '(empty)'}
\`\`\`

**CRITICAL**: ${isConvertMode ? 'You are converting an existing HTML project to an Elementor widget. Your goal is to maintain the EXACT look, structure, and styling of the original code while adapting it to the Elementor widget format. Preserve all visual design, element hierarchy, and functionality.' : 'Use this EXACT code as the foundation. Convert it to an Elementor widget while preserving all functionality, styles, and behavior. Do NOT create something new - convert what is here.'}

` : '';

    const userPrompt = isElementor
      ? `${existingCode ? 'Convert the existing HTML/CSS/JS code below into' : 'Create'} a complete Elementor widget${existingCode ? '' : ' for: ' + description}

${existingCodeContext}${existingCode ? `**Conversion Requirements**: ${description}` : ''}

${globalCSS && !existingCode ? `**Global CSS Reference** (for consistent styling):\n\`\`\`css\n${globalCSS}\n\`\`\`\n\nUse these styles for colors, typography, and design consistency.\n\n` : ''}

**Widget Name**: ${projectName}
**Class Name**: Elementor_${projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_')}_Widget
**Widget ID**: ${projectName}
**Title**: ${projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}

Generate **TWO PHP FILES** for a complete WordPress plugin:

**📦 FILE 1: Main Plugin File (main-plugin.php)**

This file must include:
- Plugin header comment with Name, Description, Version, Author
- Check for ABSPATH to prevent direct access
- Register custom Elementor widget category 'hustle-tools'
- Auto-require widget.php file from same directory
- Register widget with Elementor

Example structure:
\`\`\`php
<?php
/**
 * Plugin Name: ${projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
 * Description: Custom Elementor widget for ${description}
 * Version: 1.0.0
 * Author: Your Name
 * Text Domain: elementor-${projectName}
 */

if (!defined('ABSPATH')) exit;

// Register custom category
add_action('elementor/elements/categories_registered', function($elements_manager) {
    $elements_manager->add_category('hustle-tools', [
        'title' => __('Hustle Tools', 'elementor-${projectName}'),
        'icon' => 'fa fa-plug',
    ]);
});

// Register widget
add_action('elementor/widgets/register', function($widgets_manager) {
    require_once(__DIR__ . '/widget.php');
    $widgets_manager->register(new \\Elementor_${projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_')}_Widget());
});
?>
\`\`\`

**🎨 FILE 2: Widget Class File with Inline CSS/JS (widget.php)**

The widget class MUST include:

1. **Widget Class Structure**:
   - Complete class extending \\Elementor\\Widget_Base
   - All 7 required methods: get_name, get_title, get_icon, get_categories, get_keywords, register_controls, render
   - **CRITICAL**: register_controls() must create controls for EVERY SINGLE visual element (text, color, size, spacing, etc.)

2. **Control Organization**:
   - Organize controls into logical sections (Content tab and Style tab)
   - Use proper control types:
     - TEXT, TEXTAREA for text content
     - URL for links
     - MEDIA for images
     - COLOR for colors
     - TYPOGRAPHY for font styling
     - DIMENSIONS for spacing/padding/margin
     - SLIDER for numeric values
     - CHOOSE for alignment/position
     - SELECT for dropdown options
   - Add 'selector' to style controls so they apply to the correct HTML element
   - Add 'description' to explain each control's purpose

3. **render() Method**:
   - Use $settings = $this->get_settings_for_display()
   - Output HTML with proper escaping (esc_html, esc_attr, esc_url)
   - Include inline <style> tag with {{WRAPPER}}-scoped CSS
   - Include inline <script> tag if JavaScript is needed (or omit if not needed)

4. **CSS Scoping Rules** (inside render() method):
   - ALL styles must use {{WRAPPER}} prefix for widget-specific selectors
   - ✅ USE {{WRAPPER}}: .my-element, .heading, .button, etc.
   - ❌ NEVER use {{WRAPPER}} on: body, html, *, :root, @font-face, @keyframes, @media
   - Responsive design (mobile-first)
   - Include hover states, transitions, animations

5. **JavaScript** (inside render() method, if needed):
   - Wrap in IIFE: (function($) { ... })(jQuery);
   - Use jQuery (Elementor includes it)
   - Target elements with widget-specific classes
   - If no JS needed, don't include <script> tag

**MAKE EVERYTHING EDITABLE** - Users should NEVER need to touch code. Every text, color, size, spacing, image, link, etc. must have a control.

**Output Format:**

**Main Plugin File (main-plugin.php):**
\`\`\`php
<?php
/**
 * Plugin Name: Widget Name
 * Description: Description here
 * Version: 1.0.0
 * Author: Your Name
 */

if (!defined('ABSPATH')) exit;

add_action('elementor/elements/categories_registered', function($elements_manager) {
    $elements_manager->add_category('hustle-tools', [
        'title' => __('Hustle Tools', 'elementor-widget'),
        'icon' => 'fa fa-plug',
    ]);
});

add_action('elementor/widgets/register', function($widgets_manager) {
    require_once(__DIR__ . '/widget.php');
    $widgets_manager->register(new \\Elementor_Widget_Name_Widget());
});
?>
\`\`\`

**Widget Class File (widget.php):**
\`\`\`php
<?php
if (!defined('ABSPATH')) exit;

class Elementor_Widget_Name extends \\Elementor\\Widget_Base {
    // ... all methods here ...

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <style>
        {{WRAPPER}} .my-class {
            /* All CSS here with {{WRAPPER}} scoping */
        }
        </style>

        <div class="my-widget">
            <!-- HTML output here -->
        </div>

        <script>
        (function($) {
            // JavaScript here if needed
        })(jQuery);
        </script>
        <?php
    }
}
?>
\`\`\`

**CRITICAL**: Generate TWO PHP files as shown above. The widget.php file should have CSS and JS inline in the render() method. Do NOT generate separate CSS or JS files. The main-plugin.php file makes this a complete, installable WordPress plugin.

Be comprehensive - this widget should be production-ready and fully customizable through Elementor's interface.`
      : isHubSpot
        ? hubspotModuleType === 'email'
          ? `Create a HubSpot EMAIL module for: ${description}

**Project Name**: ${projectName}
**Module Type**: EMAIL (Email Client Compatibility Required)
**Target**: Gmail, Outlook, Apple Mail, and other email clients

${globalCSS ? `**Global CSS Reference** (for color/font inspiration only - DO NOT include directly):\n\`\`\`css\n${globalCSS}\n\`\`\`\n` : ''}

Generate the code in TWO PARTS:

1. **HTML** - Email-safe markup with inline styles
   - **MUST use table-based layout** (NO flexbox/grid)
   - ALL styles must be inline (style="...")
   - Example structure:
     \`\`\`html
     <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #f5f5f5;">
       <tr>
         <td align="center" style="padding: 40px 20px;">
           <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px;">
             <tr>
               <td style="padding: 30px; text-align: center;">
                 <h1 style="color: #333; font-size: 28px; margin: 0 0 16px 0; font-family: Arial, sans-serif;">Title</h1>
                 <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0; font-family: Arial, sans-serif;">Description text here.</p>
               </td>
             </tr>
           </table>
         </td>
       </tr>
     </table>
     \`\`\`

2. **HubL** - (Empty placeholder)
   - Output: \`<!-- HubL will be generated automatically -->\`

**CRITICAL EMAIL RULES:**
- ✅ Tables only (width="X", cellpadding="0", cellspacing="0")
- ✅ All styles inline
- ✅ Web-safe fonts (Arial, Verdana, Georgia)
- ✅ Fixed widths in pixels (email standard: 600px max)
- ❌ NO flexbox/grid
- ❌ NO @media queries
- ❌ NO background-image
- ❌ NO JavaScript

**Output Format:**
\`\`\`html
<!-- Table-based email HTML here -->
\`\`\`

\`\`\`hubl
<!-- HubL generated automatically -->
\`\`\`

Keep it simple and email-compatible!`
          : `Create a HubSpot PAGE module for: ${description}

**Project Name**: ${projectName}
**Module Type**: PAGE (Modern Web Standards)
**Target**: HubSpot CMS pages with full CSS/JS support

${globalCSS ? `**Global CSS Reference** (use for inspiration and consistency):\n\`\`\`css\n${globalCSS}\n\`\`\`\n` : ''}

Generate the code in TWO PARTS:

1. **HTML** - Modern semantic markup
   - Use modern HTML5 elements (div, section, header, etc.)
   - Flexbox and Grid are fully supported
   - Inline or class-based styles both work
   - Example structure:
     \`\`\`html
     <section class="hero" style="padding: 80px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
       <div class="container" style="max-width: 1200px; margin: 0 auto; text-align: center;">
         <h1 style="font-size: 3rem; color: white; margin-bottom: 1rem;">Modern Hero Section</h1>
         <p style="font-size: 1.2rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 2rem;">Beautiful, responsive design for your HubSpot pages.</p>
         <a href="#" class="btn" style="display: inline-block; padding: 14px 32px; background: white; color: #667eea; border-radius: 8px; text-decoration: none; font-weight: 600;">Get Started</a>
       </div>
     </section>
     \`\`\`

2. **HubL** - (Empty placeholder)
   - Output: \`<!-- HubL will be generated automatically -->\`

**PAGE MODULE CAPABILITIES:**
- ✅ Flexbox and Grid layouts
- ✅ Modern CSS (gradients, shadows, transforms)
- ✅ Media queries for responsive design
- ✅ Background images and videos
- ✅ CSS animations and transitions
- ✅ JavaScript interactivity
- ✅ Google Fonts and custom typography

**Output Format:**
\`\`\`html
<!-- Modern HTML5 page module here -->
\`\`\`

\`\`\`hubl
<!-- HubL generated automatically -->
\`\`\`

Use modern web standards - flexbox, grid, and JavaScript are all supported!`
        : `Create a ${projectType} for: ${description}

**Project Name**: ${projectName}
**Type**: ${projectType}

${globalCSS ? `**Global CSS Reference** (for maintaining consistent styling):\n\`\`\`css\n${globalCSS}\n\`\`\`\n\nUse these styles as reference for colors, fonts, and design patterns.\n\n` : ''}

Generate the code in THREE PARTS (in order):
1. **HTML** - Complete markup
2. **CSS** - Complete styles
3. **JavaScript** - Complete functionality (if needed, otherwise return empty)

Start with HTML, then CSS, then JS. Be comprehensive and production-ready.`;

    // Build messages array (supports text + images)
    const messages: any[] = [
      {
        role: 'user',
        content: images.length > 0
          ? [
              { type: 'text', text: userPrompt },
              ...images.map((img: { url: string }) => ({
                type: 'image',
                image: img.url // data URL or URL
              }))
            ]
          : userPrompt // Plain text if no images
      }
    ];

    console.log('📸 Message content:', {
      hasImages: images.length > 0,
      imageCount: images.length,
      messageType: images.length > 0 ? 'multipart (text + images)' : 'text only'
    });

    // Stream the generation with AI Gateway
    const result = await streamText({
      model: gateway(model, {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      system: systemPrompt,
      messages, // Use messages instead of prompt to support images
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
          const finalResult = await result;
          const usage = finalResult.usage;
          const finishReason = finalResult.finishReason;

          console.log('📊 Generation complete. Usage:', usage);

          // Send usage metadata as a special marker at the end
          const usageMetadata = {
            usage,
            finishReason,
            model,
          };
          controller.enqueue(encoder.encode('\n\n__USAGE__:' + JSON.stringify(usageMetadata)));

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
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
