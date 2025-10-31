/**
 * Programmatic Widget Converter
 *
 * Converts HTML/CSS/JS to Elementor PHP widgets using predefined templates.
 * Much faster than AI-based conversion (~100ms vs 3-5 minutes).
 *
 * Flow:
 * 1. Parse HTML to identify elements
 * 2. Look up control templates for each element
 * 3. Generate PHP widget code with all controls
 * 4. Optionally: Quick AI call for widget metadata
 */

import controlTemplates from './elementor-control-templates.json';

export interface WidgetMetadata {
  name: string; // snake_case, e.g., "hero_section"
  title: string; // Human readable, e.g., "Hero Section"
  description: string; // One sentence
  category: string; // e.g., "marketing"
  icon: string; // e.g., "eicon-banner"
}

export interface ParsedElement {
  tag: string;
  classes: string[];
  id?: string;
  text?: string;
  attributes: Record<string, string>;
  children: ParsedElement[];
  selector: string; // CSS selector for this element
}

/**
 * Parse HTML and extract element structure
 */
export function parseHTML(html: string): ParsedElement[] {
  if (typeof window === 'undefined') {
    // Server-side parsing would need a different approach
    // For now, return empty array on server
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function parseElement(el: Element, index: number = 0): ParsedElement {
    const tag = el.tagName.toLowerCase();
    const classes = Array.from(el.classList);
    const id = el.id || undefined;
    const text = el.textContent?.trim() || undefined;

    // Build attributes object
    const attributes: Record<string, string> = {};
    Array.from(el.attributes).forEach(attr => {
      if (attr.name !== 'class' && attr.name !== 'id') {
        attributes[attr.name] = attr.value;
      }
    });

    // Build CSS selector
    let selector = tag;
    if (id) selector += `#${id}`;
    if (classes.length > 0) selector += `.${classes.join('.')}`;

    // Parse children
    const children = Array.from(el.children).map((child, i) => parseElement(child, i));

    return {
      tag,
      classes,
      id,
      text,
      attributes,
      children,
      selector
    };
  }

  const bodyChildren = Array.from(doc.body.children);
  return bodyChildren.map((el, i) => parseElement(el, i));
}

/**
 * Extract widget metadata from HTML comment or use defaults
 */
export function extractMetadataFromHTML(html: string): Partial<WidgetMetadata> | null {
  // Look for <!-- WIDGET_META ... --> comment
  const metaMatch = html.match(/<!--\s*WIDGET_META\s*([\s\S]*?)-->/);
  if (!metaMatch) return null;

  const metaText = metaMatch[1];
  const metadata: Partial<WidgetMetadata> = {};

  // Parse key: value pairs
  const lines = metaText.split('\n');
  lines.forEach(line => {
    const match = line.match(/(\w+):\s*(.+)/);
    if (match) {
      const [, key, value] = match;
      metadata[key as keyof WidgetMetadata] = value.trim();
    }
  });

  return metadata;
}

/**
 * Generate widget metadata using Claude Haiku (fast, ~200ms)
 */
export async function generateMetadataWithAI(html: string, css: string, js: string): Promise<WidgetMetadata> {
  // Quick analysis with Haiku
  const response = await fetch('/api/analyze-widget-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, css, js })
  });

  if (!response.ok) {
    throw new Error('Failed to generate metadata');
  }

  return await response.json();
}

/**
 * Get control template for an element tag
 */
function getControlsForElement(element: ParsedElement): any {
  const templates = (controlTemplates as any).elementControls;
  let template = templates[element.tag];

  // Handle extends
  if (template?.extends) {
    template = { ...templates[template.extends], ...template };
  }

  return template || templates['div']; // Default to div if no template
}

/**
 * Generate PHP widget code programmatically
 */
export function generateWidgetPHP(
  metadata: WidgetMetadata,
  elements: ParsedElement[],
  html: string,
  css: string,
  js: string
): string {
  const className = toPascalCase(metadata.name) + '_Widget';

  // Generate controls PHP code
  const controlsCode = generateControlsCode(elements, css, js);

  // Generate render PHP code
  const renderCode = generateRenderCode(elements, html, css, js);

  return `<?php
/**
 * ${metadata.title}
 *
 * ${metadata.description}
 *
 * @package Hustle_Tools
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class ${className} extends \\Elementor\\Widget_Base {

    /**
     * Get widget name.
     */
    public function get_name() {
        return '${metadata.name}';
    }

    /**
     * Get widget title.
     */
    public function get_title() {
        return esc_html__('${metadata.title}', 'hustle-tools');
    }

    /**
     * Get widget icon.
     */
    public function get_icon() {
        return '${metadata.icon}';
    }

    /**
     * Get widget categories.
     */
    public function get_categories() {
        return ['${metadata.category}'];
    }

    /**
     * Get widget keywords.
     */
    public function get_keywords() {
        return ${generateKeywordsArray(metadata.title, elements)};
    }

    /**
     * Register widget controls.
     */
    protected function register_controls() {
${controlsCode}
    }

    /**
     * Render widget output on the frontend.
     */
    protected function render() {
${renderCode}
    }
}
`;
}

/**
 * Generate controls registration code
 */
function generateControlsCode(elements: ParsedElement[], css: string, js: string): string {
  const controls: string[] = [];
  let controlIndex = 0;

  elements.forEach((element, elementIndex) => {
    const template = getControlsForElement(element);
    if (!template) return;

    const sectionId = `section_${element.tag}_${elementIndex}`;
    const selectorPlaceholder = element.selector;

    // Content Tab Controls
    if (template.content && template.content.length > 0) {
      controls.push(`
        // ===== ${template.label || element.tag.toUpperCase()} - Content =====
        $this->start_controls_section(
            '${sectionId}_content',
            [
                'label' => esc_html__('${template.label || element.tag} Content', 'hustle-tools'),
                'tab' => \\Elementor\\Controls_Manager::TAB_CONTENT,
            ]
        );
`);

      template.content.forEach((control: any) => {
        const controlId = `${element.tag}_${elementIndex}_${control.id}`;
        const defaultValue = getDefaultValue(control, element);
        controls.push(generateControlPHP(controlId, control, defaultValue, selectorPlaceholder));
      });

      controls.push(`
        $this->end_controls_section();
`);
    }

    // Style Tab Controls
    if (template.style && template.style.length > 0) {
      controls.push(`
        // ===== ${template.label || element.tag.toUpperCase()} - Style =====
        $this->start_controls_section(
            '${sectionId}_style',
            [
                'label' => esc_html__('${template.label || element.tag} Style', 'hustle-tools'),
                'tab' => \\Elementor\\Controls_Manager::TAB_STYLE,
            ]
        );
`);

      template.style.forEach((control: any) => {
        const controlId = `${element.tag}_${elementIndex}_${control.id}`;
        controls.push(generateControlPHP(controlId, control, null, selectorPlaceholder));
      });

      controls.push(`
        $this->end_controls_section();
`);
    }

    // Advanced Tab Controls
    if (template.advanced && template.advanced.length > 0) {
      controls.push(`
        // ===== ${template.label || element.tag.toUpperCase()} - Advanced =====
        $this->start_controls_section(
            '${sectionId}_advanced',
            [
                'label' => esc_html__('${template.label || element.tag} Advanced', 'hustle-tools'),
                'tab' => \\Elementor\\Controls_Manager::TAB_ADVANCED,
            ]
        );
`);

      template.advanced.forEach((control: any) => {
        const controlId = `${element.tag}_${elementIndex}_${control.id}`;
        controls.push(generateControlPHP(controlId, control, null, selectorPlaceholder));
      });

      controls.push(`
        $this->end_controls_section();
`);
    }
  });

  // CRITICAL: Strip dangerous global selectors BEFORE escaping
  // These selectors break the Elementor editor by affecting the entire page
  let cleanedCss = css
    .replace(/\bbody\s*,?\s*/gi, '')     // Remove "body" selector
    .replace(/\bhtml\s*,?\s*/gi, '')     // Remove "html" selector
    .replace(/^\s*,\s*/gm, '');          // Clean up leading commas

  // Escape CSS for PHP string literals
  const escapedCss = cleanedCss
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/'/g, "\\'")     // Escape single quotes
    .replace(/\n/g, '\\n')    // Preserve newlines
    .replace(/\r/g, '');      // Remove carriage returns

  const escapedJs = js
    .replace(/\\/g, '\\\\')   // Escape backslashes
    .replace(/'/g, "\\'")     // Escape single quotes
    .replace(/\n/g, '\\n')    // Preserve newlines
    .replace(/\r/g, '');      // Remove carriage returns

  // Add Custom CSS/JS section
  controls.push(`
        // ===== Custom Code =====
        $this->start_controls_section(
            'section_custom_code',
            [
                'label' => esc_html__('Custom Code', 'hustle-tools'),
                'tab' => \\Elementor\\Controls_Manager::TAB_ADVANCED,
            ]
        );

        $this->add_control(
            'custom_css',
            [
                'label' => esc_html__('Custom CSS', 'hustle-tools'),
                'type' => \\Elementor\\Controls_Manager::CODE,
                'language' => 'css',
                'rows' => 20,
                'description' => esc_html__('Add custom CSS. Use "selector" to target the widget wrapper.', 'hustle-tools'),
                'placeholder' => 'selector { color: red; }',
                'default' => '${escapedCss}',
            ]
        );

        $this->add_control(
            'custom_js',
            [
                'label' => esc_html__('Custom JavaScript', 'hustle-tools'),
                'type' => \\Elementor\\Controls_Manager::CODE,
                'language' => 'javascript',
                'rows' => 20,
                'description' => esc_html__('Add custom JavaScript. Code will be wrapped in jQuery(document).ready().', 'hustle-tools'),
                'default' => '${escapedJs}',
            ]
        );

        $this->end_controls_section();
`);

  return controls.join('\n');
}

/**
 * Generate single control PHP code
 */
function generateControlPHP(id: string, control: any, defaultValue: any, selector: string): string {
  const type = control.type;
  const label = control.label;

  // Replace {{SELECTOR}} placeholder
  const actualSelector = selector;
  const wrappedSelector = `{{WRAPPER}} ${actualSelector}`;

  let code = `
        $this->add_control(
            '${id}',
            [
                'label' => esc_html__('${label}', 'hustle-tools'),
                'type' => \\Elementor\\Controls_Manager::${type},`;

  // Add default value if provided
  if (defaultValue !== null && defaultValue !== undefined) {
    code += `\n                'default' => '${escapePhpString(defaultValue)}',`;
  } else if (control.default) {
    code += `\n                'default' => '${escapePhpString(control.default)}',`;
  }

  // Add options for SELECT controls
  if (control.options) {
    if (Array.isArray(control.options)) {
      code += `\n                'options' => [`;
      control.options.forEach((opt: string) => {
        code += `\n                    '${opt}' => '${opt}',`;
      });
      code += `\n                ],`;
    }
  }

  // Add selector for style controls
  if (control.selector && control.property) {
    code += `\n                'selectors' => [`;
    code += `\n                    '${wrappedSelector}' => '${control.property}: {{VALUE}};',`;
    code += `\n                ],`;
  }

  // Add dynamic support
  if (control.dynamic) {
    code += `\n                'dynamic' => ['active' => true],`;
  }

  code += `\n            ]
        );`;

  return code;
}

/**
 * Generate render method code
 */
function generateRenderCode(elements: ParsedElement[], html: string, css: string, js: string): string {
  // Generate dynamic PHP code that uses the controls
  let dynamicHtml = html;

  // For each parsed element, inject PHP variables for editable content
  elements.forEach((element, elementIndex) => {
    const controlPrefix = `${element.tag}_${elementIndex}_`;

    // Replace text content with PHP variable if this element has text
    if (element.text && element.text.trim()) {
      // Handle headings (h1, h2, etc.)
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(element.tag)) {
        const originalTag = `<${element.tag}${element.classes.length > 0 ? ' class="' + element.classes.join(' ') + '"' : ''}>${element.text}</${element.tag}>`;
        const controlId = `${controlPrefix}heading_text`;
        const htmlTag = `${controlPrefix}html_tag`;

        // Build dynamic heading with controls
        const dynamicTag = `
        $heading_text_${elementIndex} = $settings['${controlId}'];
        $html_tag_${elementIndex} = !empty($settings['${htmlTag}']) ? $settings['${htmlTag}'] : '${element.tag}';
        $link_${elementIndex} = !empty($settings['${controlPrefix}link']) ? $settings['${controlPrefix}link'] : null;

        // Add render attributes
        $this->add_render_attribute('heading_${elementIndex}', 'class', '${element.classes.join(' ')}');
        ?>
        <?php if ($link_${elementIndex} && !empty($link_${elementIndex}['url'])) : ?>
            <a href="<?php echo esc_url($link_${elementIndex}['url']); ?>"
               <?php echo !empty($link_${elementIndex}['is_external']) ? 'target="_blank"' : ''; ?>
               <?php echo !empty($link_${elementIndex}['nofollow']) ? 'rel="nofollow"' : ''; ?>>
                <<?php echo esc_attr($html_tag_${elementIndex}); ?> <?php echo $this->get_render_attribute_string('heading_${elementIndex}'); ?>>
                    <?php echo esc_html($heading_text_${elementIndex}); ?>
                </<?php echo esc_attr($html_tag_${elementIndex}); ?>>
            </a>
        <?php else : ?>
            <<?php echo esc_attr($html_tag_${elementIndex}); ?> <?php echo $this->get_render_attribute_string('heading_${elementIndex}'); ?>>
                <?php echo esc_html($heading_text_${elementIndex}); ?>
            </<?php echo esc_attr($html_tag_${elementIndex}); ?>>
        <?php endif; ?>`;

        dynamicHtml = dynamicHtml.replace(originalTag, dynamicTag);
      }
      // Handle buttons/links
      else if (element.tag === 'a' || element.tag === 'button') {
        const href = element.attributes['href'] || '#';
        const buttonText = element.text;
        const originalTag = new RegExp(`<${element.tag}[^>]*>${escapeRegex(buttonText)}</${element.tag}>`, 'g');
        const controlId = `${controlPrefix}${element.tag === 'button' ? 'button_text' : 'link_text'}`;
        const linkId = `${controlPrefix}${element.tag === 'button' ? 'button_link' : 'link_url'}`;

        const dynamicTag = `
        $link_${elementIndex} = !empty($settings['${linkId}']) ? $settings['${linkId}'] : ['url' => '${href}'];
        ?>
        <${element.tag} href="<?php echo esc_url($link_${elementIndex}['url']); ?>"${element.classes.length > 0 ? ` class="${element.classes.join(' ')}"` : ''}>
            <?php echo esc_html($settings['${controlId}']); ?>
        </${element.tag}>
        <?php`;

        dynamicHtml = dynamicHtml.replace(originalTag, dynamicTag);
      }
      // Handle images
      else if (element.tag === 'img') {
        const src = element.attributes['src'] || '';
        const alt = element.attributes['alt'] || '';
        const originalTag = new RegExp(`<img[^>]*src="${escapeRegex(src)}"[^>]*>`, 'g');
        const imageId = `${controlPrefix}image`;
        const altId = `${controlPrefix}alt_text`;

        const dynamicTag = `
        $image_${elementIndex} = !empty($settings['${imageId}']) ? $settings['${imageId}'] : ['url' => '${src}'];
        $alt_${elementIndex} = !empty($settings['${altId}']) ? $settings['${altId}'] : '${alt}';
        ?>
        <img src="<?php echo esc_url($image_${elementIndex}['url']); ?>" alt="<?php echo esc_attr($alt_${elementIndex}); ?>"${element.classes.length > 0 ? ` class="${element.classes.join(' ')}"` : ''}>
        <?php`;

        dynamicHtml = dynamicHtml.replace(originalTag, dynamicTag);
      }
      // Handle regular text elements (p, span, div with text)
      else if (['p', 'span', 'div', 'label'].includes(element.tag) && element.text) {
        const originalTag = new RegExp(`<${element.tag}([^>]*)>${escapeRegex(element.text)}</${element.tag}>`, 'g');
        const controlId = `${controlPrefix}text`;

        const dynamicTag = `<${element.tag}$1><?php echo esc_html($settings['${controlId}']); ?></${element.tag}>`;
        dynamicHtml = dynamicHtml.replace(originalTag, dynamicTag);
      }
    }

    // Handle input placeholders
    if (element.tag === 'input' && element.attributes['placeholder']) {
      const placeholder = element.attributes['placeholder'];
      const controlId = `${controlPrefix}placeholder`;
      dynamicHtml = dynamicHtml.replace(
        `placeholder="${placeholder}"`,
        `placeholder="<?php echo esc_attr($settings['${controlId}']); ?>"`
      );
    }
  });

  // Check if we need to manage PHP tag transitions
  // Dynamic HTML has embedded <?php...?> blocks, so we DON'T add ?> at start
  // Static HTML is pure HTML, so we DO add ?> at start
  const hasPhpTags = dynamicHtml.includes('<?php');

  // Check if dynamicHtml ends in PHP mode or HTML mode
  // Look at the last PHP-related tag to determine mode
  const lastPhpOpen = dynamicHtml.lastIndexOf('<?php');
  const lastPhpClose = dynamicHtml.lastIndexOf('?>');

  // If last <?php comes after last ?>, we're in PHP mode
  const endsInPhpMode = lastPhpOpen > lastPhpClose;

  return `        $settings = $this->get_settings_for_display();

        // Render HTML with dynamic controls
        ${hasPhpTags ? '' : '?>'}
${dynamicHtml}
${hasPhpTags ? '' : '\n        <?php'}
        // Custom CSS
        if (!empty($settings['custom_css'])) {
            $custom_css = str_replace('selector', '{{WRAPPER}}', $settings['custom_css']);
            $custom_css = str_replace('{{WRAPPER}}', '.elementor-element-' . $this->get_id(), $custom_css);
            ?>
            <style>
                <?php echo $custom_css; ?>
            </style>
            <?php
        }

        // Custom JavaScript
        if (!empty($settings['custom_js'])) {
            ?>
            <script>
                (function($) {
                    $(document).ready(function() {
                        <?php echo $settings['custom_js']; ?>
                    });
                })(jQuery);
            </script>
            <?php
        }`;
}

/**
 * Helper: Escape string for use in regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get default value from element
 */
function getDefaultValue(control: any, element: ParsedElement): any {
  switch (control.id) {
    case 'heading_text':
    case 'text':
    case 'link_text':
    case 'button_text':
      return element.text || control.default || '';
    case 'link_url':
    case 'button_link':
      return element.attributes['href'] || '#';
    case 'image':
      return element.attributes['src'] ? { url: element.attributes['src'] } : null;
    case 'alt_text':
      return element.attributes['alt'] || '';
    case 'placeholder':
      return element.attributes['placeholder'] || '';
    default:
      return control.default || null;
  }
}

/**
 * Generate keywords array for widget
 */
function generateKeywordsArray(title: string, elements: ParsedElement[]): string {
  const keywords = new Set<string>();

  // Add words from title
  title.toLowerCase().split(' ').forEach(word => {
    if (word.length > 3) keywords.add(word);
  });

  // Add element tags
  elements.forEach(el => {
    keywords.add(el.tag);
  });

  const keywordsArray = Array.from(keywords).slice(0, 10);
  return `['${keywordsArray.join("', '")}']`;
}

/**
 * Helper: Convert to PascalCase
 */
function toPascalCase(str: string): string {
  return str.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

/**
 * Helper: Escape PHP string
 */
function escapePhpString(str: string): string {
  return str.toString().replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/**
 * Main entry point: Convert HTML/CSS/JS to Elementor Widget
 */
export async function convertToWidgetProgrammatic(
  html: string,
  css: string,
  js: string,
  options?: {
    metadata?: Partial<WidgetMetadata>;
    useAIForMetadata?: boolean;
  }
): Promise<string> {
  console.log('⚡ Starting programmatic widget conversion...');
  const startTime = Date.now();

  // 0. Clean HTML - remove DOCTYPE, html, head, body, style, script tags, and HTML comments
  let cleanHtml = html;
  cleanHtml = cleanHtml.replace(/<!DOCTYPE[^>]*>/gi, '');
  cleanHtml = cleanHtml.replace(/<html[^>]*>|<\/html>/gi, '');
  cleanHtml = cleanHtml.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  cleanHtml = cleanHtml.replace(/<body[^>]*>|<\/body>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleanHtml = cleanHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments
  cleanHtml = cleanHtml.trim();

  console.log('🧹 Cleaned HTML:', {
    original: html.length,
    cleaned: cleanHtml.length,
    removed: html.length - cleanHtml.length
  });

  // 1. Extract or generate metadata
  let metadata: WidgetMetadata;

  // Try HTML comment first
  const extractedMeta = extractMetadataFromHTML(cleanHtml);

  if (extractedMeta && extractedMeta.name && extractedMeta.title) {
    metadata = {
      name: extractedMeta.name,
      title: extractedMeta.title,
      description: extractedMeta.description || `${extractedMeta.title} widget`,
      category: extractedMeta.category || 'general',
      icon: extractedMeta.icon || 'eicon-code'
    };
    console.log('✅ Found metadata in HTML comment');
  } else if (options?.useAIForMetadata) {
    metadata = await generateMetadataWithAI(cleanHtml, css, js);
    console.log('🤖 Generated metadata with AI');
  } else {
    // Use defaults
    metadata = {
      name: options?.metadata?.name || 'custom_widget',
      title: options?.metadata?.title || 'Custom Widget',
      description: options?.metadata?.description || 'A custom widget created with Quick Widget',
      category: options?.metadata?.category || 'general',
      icon: options?.metadata?.icon || 'eicon-code'
    };
    console.log('📝 Using default metadata');
  }

  // 2. Parse HTML structure (use cleaned HTML)
  const elements = parseHTML(cleanHtml);
  console.log(`📦 Parsed ${elements.length} top-level elements`);

  // 3. Generate PHP widget code (use cleaned HTML)
  const widgetPHP = generateWidgetPHP(metadata, elements, cleanHtml, css, js);

  // 4. Validate generated PHP code
  const { validatePhpWidget, formatValidationResult } = await import('./php-syntax-validator');
  const validation = validatePhpWidget(widgetPHP);

  if (!validation.valid) {
    const errorReport = formatValidationResult(validation);
    console.error('❌ Widget validation failed:', errorReport);

    // Debug: Show the render method to see what's wrong
    const renderMatch = widgetPHP.match(/protected function render\(\)[^{]*\{([\s\S]*?)\n    \}/);
    if (renderMatch) {
      console.log('🔍 Generated render() method (around error lines):');
      const renderLines = renderMatch[1].split('\n');
      renderLines.forEach((line, i) => {
        const lineNum = i + 1;
        // Highlight error lines
        const hasError = validation.errors.some(e => e.line && Math.abs(e.line - lineNum) < 3);
        console.log(`${hasError ? '❌' : '  '} ${lineNum}: ${line}`);
      });
    }

    throw new Error(`Widget validation failed:\n\n${errorReport}`);
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Widget validation warnings:', formatValidationResult(validation));
  }

  const elapsed = Date.now() - startTime;
  console.log(`⚡ Conversion complete in ${elapsed}ms`);
  console.log('✅ Widget code validated successfully');

  return widgetPHP;
}
