import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

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

    // Get current date and time
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

    const systemPrompt = isElementor
      ? `You are an expert Elementor widget developer. Generate a COMPLETE, PRODUCTION-READY PHP widget class.

**Current Date & Time:** ${currentDate}, ${currentTime}

**🎯 HIGHEST PRIORITY - USER INSTRUCTIONS:**
The user's instructions in their prompt are the FINAL SAY and HIGHEST PRIORITY. These instructions come from the project owner and decision-maker. If the user's instructions conflict with any guidelines below, ALWAYS follow the user's instructions. Their requirements override everything else.

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
      : isHubSpot
        ? hubspotModuleType === 'email'
          ? `You are an expert HubSpot email module developer. Generate production-ready HTML with inline CSS optimized for email clients.

**Current Date & Time:** ${currentDate}, ${currentTime}

**MODULE TYPE: EMAIL (Strict Compatibility Mode)**

**🎯 HIGHEST PRIORITY - USER INSTRUCTIONS:**
The user's instructions in their prompt are the FINAL SAY and HIGHEST PRIORITY. These instructions come from the project owner and decision-maker. If the user's instructions conflict with any guidelines below, ALWAYS follow the user's instructions. Their requirements override everything else.

**CRITICAL EMAIL CONSTRAINTS:**

1. **HTML Structure**:
   - Section-level markup only (NO DOCTYPE, html, head, body tags)
   - **MUST use table-based layouts** - NO flexbox, NO grid
   - Use <table>, <tr>, <td> for all layout structure
   - Keep nesting shallow (max 3-4 table levels)
   - Use semantic class names for HubL tokenization

2. **CSS Requirements (EMAIL-SPECIFIC)**:
   - **ALL styles MUST be inline** using style="..." attributes
   - ❌ NEVER use <style> tags or external CSS
   - ❌ NEVER use @media queries (unreliable across email clients)
   - ❌ NEVER use display: grid or display: flex
   - ❌ NEVER use background-image (use <img> instead)
   - ❌ NEVER use position: absolute or position: fixed
   - ❌ NEVER use @font-face or custom web fonts
   - ✅ USE: Basic properties (color, font-size, padding, margin, text-align)
   - ✅ USE: Table properties (width, cellpadding, cellspacing, align, valign, bgcolor)
   - ✅ USE: Web-safe fonts only (Arial, Verdana, Georgia, Times New Roman, Courier)

3. **Email-Safe Design Patterns**:
   - Use <table width="100%"> for full-width sections
   - Use <td style="padding: X"> for spacing (NOT margin on tables)
   - Use bgcolor attribute for background colors when possible
   - Set explicit widths in pixels for fixed layouts
   - Use <img> with width/height attributes for all images
   - Center content with align="center" on td elements

4. **JavaScript**:
   - ⚠️ CRITICAL: NO JavaScript allowed in email modules
   - Scripts are completely blocked in email clients

5. **Accessibility**:
   - Add alt text to ALL images
   - Use role="presentation" on layout tables
   - Ensure good color contrast for readability

**OUTPUT FORMAT:**
\`\`\`html
<!-- Table-based layout with inline styles -->
\`\`\`

\`\`\`hubl
<!-- HubL tokenization generated programmatically -->
\`\`\`

**IMPORTANT**: Email compatibility is CRITICAL. Always use tables with inline styles. Test across Gmail, Outlook, Apple Mail.`
          : `You are an expert HubSpot page module developer. Generate production-ready HTML with modern CSS for HubSpot CMS pages.

**Current Date & Time:** ${currentDate}, ${currentTime}

**MODULE TYPE: PAGE (Modern Web Standards)**

**🎯 HIGHEST PRIORITY - USER INSTRUCTIONS:**
The user's instructions in their prompt are the FINAL SAY and HIGHEST PRIORITY. These instructions come from the project owner and decision-maker. If the user's instructions conflict with any guidelines below, ALWAYS follow the user's instructions. Their requirements override everything else.

**PAGE MODULE CAPABILITIES:**

1. **HTML Structure**:
   - Section-level markup only (NO DOCTYPE, html, head, body tags)
   - Use modern semantic HTML5 elements
   - **Flexbox and Grid are allowed** for page modules
   - Div-based layouts are perfectly acceptable
   - Use semantic class names for HubL tokenization

2. **CSS Requirements (PAGE-SPECIFIC)**:
   - Inline styles are acceptable
   - External CSS classes are also fine (HubSpot will handle them)
   - ✅ USE: Modern layout (flexbox, grid)
   - ✅ USE: CSS variables for theming
   - ✅ USE: Media queries for responsive design
   - ✅ USE: Background images and gradients
   - ✅ USE: Transitions and animations
   - ✅ USE: Modern web fonts (Google Fonts, etc.)
   - Keep structure modular for easy HubL field extraction

3. **Modern Design Patterns**:
   - Use flexbox for flexible layouts
   - Use CSS Grid for complex grid systems
   - Apply responsive breakpoints with @media queries
   - Use modern typography and spacing
   - Include hover states and interactions
   - Add smooth transitions for better UX

4. **JavaScript**:
   - ✅ JavaScript IS supported in page modules
   - Use vanilla JS or jQuery (HubSpot includes jQuery)
   - Add interactive features as needed
   - Keep scripts modular and maintainable

5. **HubSpot-Specific**:
   - Output clean HTML for HubL tokenization
   - Use semantic class names
   - Structure content for easy field mapping
   - Consider HubDB integration points

6. **Accessibility**:
   - Use semantic HTML5 elements (header, nav, main, footer, etc.)
   - Add ARIA labels where appropriate
   - Ensure keyboard navigation
   - Maintain good color contrast

**OUTPUT FORMAT:**
\`\`\`html
<!-- Modern HTML5 with semantic elements -->
\`\`\`

\`\`\`hubl
<!-- HubL tokenization generated programmatically -->
\`\`\`

**IMPORTANT**: Page modules support modern web standards. Use flexbox, grid, and interactive features freely.`
        : `You are an expert frontend developer. Generate complete, production-ready HTML/CSS/JS code for a web section based on the user's description.

**Current Date & Time:** ${currentDate}, ${currentTime}

**🎯 HIGHEST PRIORITY - USER INSTRUCTIONS:**
The user's instructions in their prompt are the FINAL SAY and HIGHEST PRIORITY. These instructions come from the project owner and decision-maker. If the user's instructions conflict with any guidelines below, ALWAYS follow the user's instructions. Their requirements override everything else.

**CRITICAL RULES:**
1. **HTML**: Section-level markup only (NO DOCTYPE, html, head, body tags). Use semantic HTML5.
2. **CSS**: Complete styles including responsive design, modern layout (flexbox/grid), transitions/animations.
3. **JavaScript**: Vanilla JS only if needed. Modern ES6+. No framework dependencies.
4. **Design**: Modern, clean, professional design with good spacing, typography, and color harmony.
5. **Accessibility**: Semantic HTML, ARIA labels where needed, keyboard navigation.
6. **Responsive**: Mobile-first approach, breakpoints at 768px (tablet) and 1024px (desktop).

**IMPORTANT**: Create standalone, copy-paste ready code that works immediately in any modern browser.`;

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
