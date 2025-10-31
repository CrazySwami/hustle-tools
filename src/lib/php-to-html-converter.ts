/**
 * PHP-to-HTML Converter
 *
 * Extracts HTML, CSS, and JavaScript from Elementor widget PHP code
 * so you can edit it as simple HTML and convert back to widget later.
 */

export interface ExtractedCode {
  html: string;
  css: string;
  js: string;
  success: boolean;
  error?: string;
}

/**
 * Extract HTML/CSS/JS from PHP widget code
 */
export function extractCodeFromPhp(phpCode: string): ExtractedCode {
  try {
    let html = '';
    let css = '';
    let js = '';

    // 1. Extract HTML from render() method
    // Look for the HTML output between ?> and <?php tags or end of render method
    const renderMatch = phpCode.match(/protected function render\(\)[\s\S]*?\{[\s\S]*?\?\>([\s\S]*?)(?:<\?php|\}[\s]*$)/);

    if (renderMatch) {
      html = renderMatch[1].trim();

      // Clean up the HTML
      // Remove any PHP echo statements that might be left
      html = html.replace(/<\?php[\s\S]*?\?>/g, '');
      html = html.replace(/\$settings\[['"][^'"]+['"]\]/g, ''); // Remove $settings references
      html = html.replace(/esc_html\((.*?)\)/g, '$1'); // Remove esc_html()
      html = html.replace(/esc_url\((.*?)\)/g, '$1'); // Remove esc_url()
      html = html.replace(/esc_attr\((.*?)\)/g, '$1'); // Remove esc_attr()

      console.log('✅ Extracted HTML:', html.length, 'characters');
    } else {
      console.warn('⚠️ Could not find render() method HTML');
    }

    // 2. Extract CSS from Custom CSS section or embedded styles
    // Look for CSS in the render method after the HTML
    const cssMatch = phpCode.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (cssMatch) {
      css = cssMatch[1].trim();
      // Remove PHP template placeholders
      css = css.replace(/\{\{WRAPPER\}\}/g, '.widget-wrapper');
      css = css.replace(/<\?php[\s\S]*?\?>/g, '');
      console.log('✅ Extracted CSS:', css.length, 'characters');
    }

    // 3. Extract JavaScript from Custom JS section or embedded scripts
    const jsMatch = phpCode.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (jsMatch) {
      js = jsMatch[1].trim();
      // Remove jQuery wrapper if present
      js = js.replace(/\(function\(\$\)\s*\{[\s]*\$\(document\)\.ready\(function\(\)\s*\{/g, '');
      js = js.replace(/\}\);[\s]*\}\)\(jQuery\);[\s]*$/g, '');
      // Remove PHP template code
      js = js.replace(/<\?php[\s\S]*?\?>/g, '');
      js = js.trim();
      console.log('✅ Extracted JS:', js.length, 'characters');
    }

    // If no HTML was found, it might be a different format
    if (!html) {
      // Try to find any HTML-like content in the render method
      const renderMethodMatch = phpCode.match(/protected function render\(\)[\s\S]*?\{([\s\S]*)\}[\s]*(?:\/\*\*|$)/);
      if (renderMethodMatch) {
        const renderContent = renderMethodMatch[1];
        // Look for HTML tags
        const htmlTags = renderContent.match(/<(?!php)[^>]+>/g);
        if (htmlTags && htmlTags.length > 0) {
          html = renderContent.trim();
          console.log('⚠️ Extracted raw render content as HTML');
        }
      }
    }

    return {
      html,
      css,
      js,
      success: html.length > 0,
      error: html.length === 0 ? 'Could not extract HTML from PHP widget code' : undefined
    };

  } catch (error: any) {
    console.error('❌ PHP extraction error:', error);
    return {
      html: '',
      css: '',
      js: '',
      success: false,
      error: error.message || 'Failed to extract code from PHP'
    };
  }
}

/**
 * Check if code is a PHP widget
 */
export function isPhpWidget(code: string): boolean {
  return (
    code.includes('class') &&
    code.includes('extends \\Elementor\\Widget_Base') &&
    code.includes('protected function render()')
  );
}
