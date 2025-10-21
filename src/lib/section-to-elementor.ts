/**
 * Section to Elementor HTML Widget Conversion
 * Converts our Section schema to Elementor HTML widget JSON format
 */

import {
  Section,
  sectionSettingsToCSS,
  getAnimationCSS,
  getAnimationClassName
} from './section-schema';

/**
 * Elementor HTML Widget structure
 */
export interface ElementorHtmlWidget {
  id: string;
  elType: 'widget';
  widgetType: 'html';
  settings: {
    html: string;
    _element_id?: string;
    _css_classes?: string;
  };
}

/**
 * Elementor Container/Section wrapper
 */
export interface ElementorContainer {
  id: string;
  elType: 'container';
  settings: {
    content_width?: string;
    _element_id?: string;
  };
  elements: ElementorHtmlWidget[];
}

/**
 * Convert a single Section to an Elementor HTML widget
 */
export function sectionToHtmlWidget(section: Section): ElementorHtmlWidget {
  // Generate inline CSS from settings
  const inlineStyles = sectionSettingsToCSS(section.settings);

  // Get animation class if any
  const animationClass = getAnimationClassName(section.settings.animation);

  // Get custom classes
  const customClasses = section.settings.advanced.customClasses.join(' ');

  // Combine all classes
  const allClasses = [animationClass, customClasses].filter(Boolean).join(' ');

  // Build the complete HTML with styles and scripts
  let htmlContent = '';

  // Add animation CSS if needed
  if (section.settings.animation.type !== 'none') {
    htmlContent += `<style>\n${getAnimationCSS(section.settings.animation)}\n</style>\n\n`;
  }

  // Add section-specific CSS if any
  if (section.css.trim()) {
    htmlContent += `<style>\n${section.css}\n</style>\n\n`;
  }

  // Add main HTML with wrapper div that has inline styles
  htmlContent += `<div class="custom-section ${allClasses}" style="${inlineStyles}">\n`;
  htmlContent += section.html;
  htmlContent += `\n</div>`;

  // Add JavaScript if any
  if (section.js.trim()) {
    htmlContent += `\n\n<script>\n${section.js}\n</script>`;
  }

  return {
    id: `html_${section.id}`,
    elType: 'widget',
    widgetType: 'html',
    settings: {
      html: htmlContent,
      _element_id: section.id,
      _css_classes: allClasses
    }
  };
}

/**
 * Convert multiple Sections to Elementor HTML widgets array
 */
export function sectionsToHtmlWidgets(sections: Section[]): ElementorHtmlWidget[] {
  return sections.map(sectionToHtmlWidget);
}

/**
 * Convert Sections to full Elementor container structure
 * This creates a container with all sections as HTML widgets inside
 */
export function sectionsToElementorContainer(sections: Section[]): ElementorContainer {
  const widgets = sectionsToHtmlWidgets(sections);

  return {
    id: `container_${Date.now()}`,
    elType: 'container',
    settings: {
      content_width: 'full',
      _element_id: 'main-sections-container'
    },
    elements: widgets
  };
}

/**
 * Convert Sections to Elementor template JSON
 * This is the full structure that Elementor expects for import
 */
export function sectionsToElementorTemplate(sections: Section[], globalCss?: string) {
  const container = sectionsToElementorContainer(sections);

  // Build the complete template
  const template = {
    version: '0.4',
    title: 'Imported Sections',
    type: 'page',
    content: [container],
    page_settings: [],
    metadata: {
      template_type: 'page',
      created: Date.now(),
      source: 'hustle-tools'
    }
  };

  return template;
}

/**
 * Generate a preview URL for sections
 * Creates an HTML string suitable for iframe preview
 */
export function generateSectionsPreviewHTML(sections: Section[], globalCss?: string): string {
  const widgets = sectionsToHtmlWidgets(sections);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Section Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
    }
    ${globalCss || ''}
  </style>
</head>
<body>
`;

  // Add each widget's HTML
  widgets.forEach(widget => {
    html += widget.settings.html + '\n\n';
  });

  html += `
</body>
</html>`;

  return html;
}

/**
 * Validate Elementor widget structure
 */
export function validateElementorWidget(widget: ElementorHtmlWidget): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!widget.id) {
    errors.push('Widget ID is required');
  }

  if (widget.elType !== 'widget') {
    errors.push('elType must be "widget"');
  }

  if (widget.widgetType !== 'html') {
    errors.push('widgetType must be "html"');
  }

  if (!widget.settings || !widget.settings.html) {
    errors.push('HTML content is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract sections from Elementor HTML widgets (reverse conversion)
 * Useful for importing from Elementor back into our system
 */
export function elementorWidgetToSection(widget: ElementorHtmlWidget): Partial<Section> {
  const htmlContent = widget.settings.html || '';

  // Try to extract styles and scripts
  const styleMatches = htmlContent.match(/<style>([\s\S]*?)<\/style>/g) || [];
  const scriptMatches = htmlContent.match(/<script>([\s\S]*?)<\/script>/g) || [];

  // Extract CSS
  const css = styleMatches
    .map(match => match.replace(/<\/?style>/g, '').trim())
    .join('\n\n');

  // Extract JS
  const js = scriptMatches
    .map(match => match.replace(/<\/?script>/g, '').trim())
    .join('\n\n');

  // Remove styles and scripts from HTML
  let cleanHtml = htmlContent
    .replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/<script>[\s\S]*?<\/script>/g, '')
    .trim();

  // Try to unwrap the outer div if it exists
  const wrapperMatch = cleanHtml.match(/<div[^>]*class="custom-section[^"]*"[^>]*>([\s\S]*)<\/div>$/);
  if (wrapperMatch) {
    cleanHtml = wrapperMatch[1].trim();
  }

  return {
    name: widget.settings._element_id || 'Imported Section',
    html: cleanHtml,
    css,
    js
  };
}
