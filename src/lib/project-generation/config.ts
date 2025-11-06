/**
 * Unified Project Generation - Configuration
 *
 * Single source of truth for all project types.
 * This file centralizes:
 * - System prompts
 * - File parsing logic
 * - Model configurations
 * - Project-specific settings
 */

import type { ProjectConfig, ModelConfig, ParsedFiles } from './types';

/**
 * Get current date and time for prompts
 */
function getCurrentDateTime() {
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
  return { currentDate, currentTime };
}

/**
 * HTML Project Configuration
 */
const HTML_CONFIG: ProjectConfig = {
  name: 'html',
  label: 'HTML Section',
  icon: 'AiFillHtml5',
  fileTypes: ['html', 'css', 'js'],
  defaultModel: 'anthropic/claude-sonnet-4-5-20250929',

  systemPrompt: (() => {
    const { currentDate, currentTime } = getCurrentDateTime();
    return `You are an expert frontend developer. Generate complete, production-ready HTML/CSS/JS code for a web section based on the user's description.

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
  })(),

  parseResponse: (code: string): ParsedFiles => {
    const htmlMatch = code.match(/```html\n([\s\S]*?)(?:```|$)/);
    const cssMatch = code.match(/```css\n([\s\S]*?)(?:```|$)/);
    const jsMatch = code.match(/```(?:javascript|js)\n([\s\S]*?)(?:```|$)/);

    return {
      html: htmlMatch ? htmlMatch[1].trim() : undefined,
      css: cssMatch ? cssMatch[1].trim() : undefined,
      js: jsMatch ? jsMatch[1].trim() : undefined,
    };
  }
};

/**
 * Elementor Plugin Configuration
 */
const ELEMENTOR_CONFIG: ProjectConfig = {
  name: 'elementor',
  label: 'Elementor Widget',
  icon: 'FaWordpress',
  fileTypes: ['php'],
  defaultModel: 'anthropic/claude-sonnet-4-5-20250929',

  systemPrompt: (() => {
    const { currentDate, currentTime } = getCurrentDateTime();
    return `You are an expert Elementor widget developer. Generate a COMPLETE, PRODUCTION-READY PHP widget class.

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

**IMPORTANT**: Generate ONLY the complete PHP class. Do NOT include plugin registration code or file includes.`;
  })(),

  parseResponse: (code: string): ParsedFiles => {
    // Parse TWO PHP files: main-plugin.php and widget.php
    const phpBlocks = code.match(/```php\n([\s\S]*?)```/gi) || [];

    const phpContents = phpBlocks.map(block => {
      const match = block.match(/```php\n([\s\S]*?)```/);
      return match ? match[1].trim() : '';
    });

    let mainPluginCode = '';
    let widgetCode = '';

    for (const phpCode of phpContents) {
      if (phpCode.includes('Plugin Name:') && phpCode.includes('add_action')) {
        mainPluginCode = phpCode;
      } else if (phpCode.includes('class ') && phpCode.includes('extends \\Elementor\\Widget_Base')) {
        widgetCode = phpCode;
      }
    }

    return {
      pluginMainFile: mainPluginCode || undefined,
      php: widgetCode || undefined,
    };
  },

  extractMetadata: (files: ParsedFiles) => {
    if (!files.php) return {};

    // Extract widget class name
    const classNameMatch = files.php.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends/);
    const className = classNameMatch ? classNameMatch[1] : 'Generated_Widget';
    const widgetSlug = className.toLowerCase().replace(/_/g, '-');
    const widgetName = className.replace(/_/g, ' ').replace(/\bWidget\b/, '').trim();

    // Generate widget ID
    const widgetId = `widget_${Date.now()}`;

    return {
      widgetFiles: {
        [widgetId]: {
          name: widgetName || 'Generated Widget',
          slug: widgetSlug,
          content: files.php,
          className: className,
        }
      }
    };
  },

  deployment: {
    enabled: true,
    targets: ['wordpress']
  }
};

/**
 * HubSpot Email Module Configuration
 */
const HUBSPOT_EMAIL_CONFIG: ProjectConfig = {
  name: 'hubspot-email',
  label: 'HubSpot Email',
  icon: 'SiHubspot',
  fileTypes: ['html', 'hubl'],
  defaultModel: 'anthropic/claude-sonnet-4-5-20250929',

  systemPrompt: (() => {
    const { currentDate, currentTime } = getCurrentDateTime();
    return `You are an expert HubSpot email module developer. Generate production-ready HTML with inline CSS optimized for email clients.

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

**IMPORTANT**: Email compatibility is CRITICAL. Always use tables with inline styles. Test across Gmail, Outlook, Apple Mail.`;
  })(),

  parseResponse: (code: string): ParsedFiles => {
    const htmlMatch = code.match(/```html\n([\s\S]*?)(?:```|$)/);
    const hublMatch = code.match(/```hubl\n([\s\S]*?)(?:```|$)/);

    return {
      html: htmlMatch ? htmlMatch[1].trim() : undefined,
      hubl: hublMatch ? hublMatch[1].trim() : undefined,
    };
  }
};

/**
 * HubSpot Page Module Configuration
 */
const HUBSPOT_PAGE_CONFIG: ProjectConfig = {
  name: 'hubspot-page',
  label: 'HubSpot Page',
  icon: 'SiHubspot',
  fileTypes: ['html', 'hubl'],
  defaultModel: 'anthropic/claude-sonnet-4-5-20250929',

  systemPrompt: (() => {
    const { currentDate, currentTime } = getCurrentDateTime();
    return `You are an expert HubSpot page module developer. Generate production-ready HTML with modern CSS for HubSpot CMS pages.

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

**IMPORTANT**: Page modules support modern web standards. Use flexbox, grid, and interactive features freely.`;
  })(),

  parseResponse: (code: string): ParsedFiles => {
    const htmlMatch = code.match(/```html\n([\s\S]*?)(?:```|$)/);
    const hublMatch = code.match(/```hubl\n([\s\S]*?)(?:```|$)/);

    return {
      html: htmlMatch ? htmlMatch[1].trim() : undefined,
      hubl: hublMatch ? hublMatch[1].trim() : undefined,
    };
  }
};

/**
 * All project configurations
 */
export const PROJECT_CONFIGS: Record<string, ProjectConfig> = {
  html: HTML_CONFIG,
  elementor: ELEMENTOR_CONFIG,
  'hubspot-email': HUBSPOT_EMAIL_CONFIG,
  'hubspot-page': HUBSPOT_PAGE_CONFIG,
};

/**
 * Get project config by type and optional subtype
 */
export function getProjectConfig(projectType: string, subtype?: string): ProjectConfig {
  // Handle HubSpot subtypes
  if (projectType === 'hubspot') {
    const configKey = subtype === 'email' ? 'hubspot-email' : 'hubspot-page';
    return PROJECT_CONFIGS[configKey];
  }

  const config = PROJECT_CONFIGS[projectType];
  if (!config) {
    throw new Error(`Unknown project type: ${projectType}`);
  }

  return config;
}

/**
 * Model configurations
 */
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Anthropic Claude models
  'anthropic/claude-sonnet-4-5-20250929': {
    id: 'anthropic/claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    contextWindow: 200000,
    pricing: { input: 3, output: 15 }
  },
  'anthropic/claude-3-5-sonnet-20241022': {
    id: 'anthropic/claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    pricing: { input: 3, output: 15 }
  },
  'anthropic/claude-3-5-haiku-20241022': {
    id: 'anthropic/claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    pricing: { input: 0.8, output: 4 }
  },
  'anthropic/claude-opus-4-20250514': {
    id: 'anthropic/claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    contextWindow: 200000,
    pricing: { input: 15, output: 75 }
  },

  // OpenAI GPT models
  'openai/gpt-5': {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    contextWindow: 128000,
    pricing: { input: 5, output: 15 }
  },
  'openai/gpt-5-mini': {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    contextWindow: 128000,
    pricing: { input: 0.4, output: 1.2 }
  },
  'openai/gpt-5-nano': {
    id: 'openai/gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    contextWindow: 128000,
    pricing: { input: 0.1, output: 0.3 }
  },
  'openai/gpt-5-pro': {
    id: 'openai/gpt-5-pro',
    name: 'GPT-5 Pro',
    provider: 'openai',
    contextWindow: 128000,
    pricing: { input: 10, output: 30 }
  },
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128000,
    pricing: { input: 2.5, output: 10 }
  },
  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    pricing: { input: 0.15, output: 0.6 }
  },
  'openai/o1': {
    id: 'openai/o1',
    name: 'o1',
    provider: 'openai',
    contextWindow: 200000,
    pricing: { input: 15, output: 60 }
  },
  'openai/o1-mini': {
    id: 'openai/o1-mini',
    name: 'o1 Mini',
    provider: 'openai',
    contextWindow: 128000,
    pricing: { input: 3, output: 12 }
  },
  'openai/o3-mini': {
    id: 'openai/o3-mini',
    name: 'o3 Mini',
    provider: 'openai',
    contextWindow: 128000,
    pricing: { input: 1.1, output: 4.4 }
  },

  // Google Gemini models
  'google/gemini-2.0-flash-exp': {
    id: 'google/gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    contextWindow: 1000000,
    pricing: { input: 0, output: 0 } // Free tier
  },
  'google/gemini-2.0-flash-thinking-exp-01-21': {
    id: 'google/gemini-2.0-flash-thinking-exp-01-21',
    name: 'Gemini 2.0 Flash Thinking',
    provider: 'google',
    contextWindow: 1000000,
    pricing: { input: 0, output: 0 } // Free tier
  },
  'google/gemini-exp-1206': {
    id: 'google/gemini-exp-1206',
    name: 'Gemini Experimental',
    provider: 'google',
    contextWindow: 2000000,
    pricing: { input: 0, output: 0 } // Free tier
  },
};

/**
 * Get all available models
 */
export function getAvailableModels(): ModelConfig[] {
  return Object.values(MODEL_CONFIGS);
}

/**
 * Get model config by ID
 */
export function getModelConfig(modelId: string): ModelConfig {
  const config = MODEL_CONFIGS[modelId];
  if (!config) {
    // Return default if not found
    return MODEL_CONFIGS['anthropic/claude-sonnet-4-5-20250929'];
  }
  return config;
}

/**
 * Get models grouped by provider
 */
export function getModelsByProvider(): Record<string, ModelConfig[]> {
  const grouped: Record<string, ModelConfig[]> = {};

  for (const model of Object.values(MODEL_CONFIGS)) {
    if (!grouped[model.provider]) {
      grouped[model.provider] = [];
    }
    grouped[model.provider].push(model);
  }

  return grouped;
}
