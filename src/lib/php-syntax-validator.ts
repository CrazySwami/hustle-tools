/**
 * PHP Syntax Validator
 *
 * Validates generated PHP widget code to catch syntax errors before deployment.
 * Prevents common issues: orphaned tags, nested PHP blocks, invalid escaping.
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'syntax' | 'structure' | 'security';
  message: string;
  line?: number;
  snippet?: string;
}

export interface ValidationWarning {
  type: 'performance' | 'best-practice' | 'compatibility';
  message: string;
  line?: number;
}

/**
 * Validate PHP widget code
 */
export function validatePhpWidget(phpCode: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Split into lines for line-number reporting
  const lines = phpCode.split('\n');

  // ===== 1. CHECK FOR ORPHANED PHP TAGS =====
  checkOrphanedPhpTags(lines, errors);

  // ===== 2. CHECK PHP MODE TRANSITIONS =====
  checkPhpModeTransitions(phpCode, errors);

  // ===== 3. CHECK FOR HTML DOCUMENT STRUCTURE =====
  checkHtmlDocumentStructure(phpCode, errors);

  // ===== 4. CHECK FOR UNESCAPED OUTPUT =====
  checkUnescapedOutput(phpCode, warnings);

  // ===== 5. CHECK FOR DANGEROUS CSS SELECTORS =====
  checkDangerousCss(phpCode, warnings);

  // ===== 5. CHECK FOR INVALID CONTROL NAMES =====
  checkControlNames(phpCode, errors);

  // ===== 6. CHECK FOR BALANCED QUOTES =====
  checkBalancedQuotes(lines, errors);

  // ===== 7. CHECK CLASS STRUCTURE =====
  checkClassStructure(phpCode, errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check for orphaned <?php tags that appear when already in PHP mode
 */
function checkOrphanedPhpTags(lines: string[], errors: ValidationError[]): void {
  let inPhpMode = false;
  let inRenderMethod = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Track render method
    if (trimmed.includes('protected function render()')) {
      inRenderMethod = true;
      inPhpMode = true; // render() starts in PHP mode
    }

    if (inRenderMethod) {
      // Check for orphaned <?php when already in PHP mode
      if (inPhpMode && trimmed === '<?php') {
        // Exception 1: Allow <?php after ?> (closing HTML block)
        const prevLine = lines[index - 1]?.trim();
        const prevLineEndsWithClose = prevLine && prevLine.endsWith('?>');

        // Exception 2: Allow <?php after } (closing if/loop block)
        const prevLineIsClosingBrace = prevLine === '}';

        if (!prevLineEndsWithClose && !prevLineIsClosingBrace) {
          errors.push({
            type: 'syntax',
            message: `Orphaned <?php tag on line ${index + 1}. Already in PHP mode.`,
            line: index + 1,
            snippet: line
          });
        }
      }

      // Track PHP mode transitions
      // Check the LAST occurrence to handle lines like "<?php echo ... ?>"
      const lastClose = trimmed.lastIndexOf('?>');
      const lastOpen = trimmed.lastIndexOf('<?php');

      if (lastClose > lastOpen) {
        inPhpMode = false; // Line ends with ?>, so we're in HTML mode
      } else if (lastOpen !== -1) {
        inPhpMode = true; // Line ends with <?php, so we're in PHP mode
      }
    }

    // Exit render method tracking
    if (inRenderMethod && trimmed === '}' && !inPhpMode) {
      inRenderMethod = false;
    }
  });
}

/**
 * Check PHP mode transitions are valid
 */
function checkPhpModeTransitions(phpCode: string, errors: ValidationError[]): void {
  // Check for ?> immediately followed by <?php with only whitespace between
  const redundantTransitions = phpCode.match(/\?>\s*<\?php\s+(?!echo|if|foreach|while)/g);
  if (redundantTransitions) {
    errors.push({
      type: 'syntax',
      message: `Found ${redundantTransitions.length} redundant PHP close/open transitions (?>...<?php). Consider staying in PHP mode.`,
      snippet: redundantTransitions[0]
    });
  }

  // Check for HTML output without closing PHP first
  const htmlInPhpMode = phpCode.match(/\$settings\s*=.*?;\s*<(?!php|\/php|script)/);
  if (htmlInPhpMode) {
    errors.push({
      type: 'syntax',
      message: 'HTML output detected without closing PHP mode first. Add ?> before HTML.',
      snippet: htmlInPhpMode[0]
    });
  }
}

/**
 * Check for HTML document structure that shouldn't be in widgets
 */
function checkHtmlDocumentStructure(phpCode: string, errors: ValidationError[]): void {
  const forbidden = [
    { pattern: /<!DOCTYPE/i, name: 'DOCTYPE declaration' },
    { pattern: /<html[>\s]/i, name: '<html> tag' },
    { pattern: /<\/html>/i, name: '</html> tag' },
    { pattern: /<head[>\s]/i, name: '<head> tag' },
    { pattern: /<body[>\s]/i, name: '<body> tag' },
  ];

  forbidden.forEach(({ pattern, name }) => {
    if (pattern.test(phpCode)) {
      errors.push({
        type: 'structure',
        message: `Widget contains ${name}. Widgets should only output section-level HTML, not full documents.`,
      });
    }
  });
}

/**
 * Check for unescaped output (security warning)
 */
function checkUnescapedOutput(phpCode: string, warnings: ValidationWarning[]): void {
  // Look for <?php echo $settings without esc_html/esc_url/esc_attr
  const unescapedEcho = phpCode.match(/echo\s+\$settings\[[^\]]+\][^;]*;(?![^<]*(?:esc_html|esc_url|esc_attr))/g);

  if (unescapedEcho && unescapedEcho.length > 0) {
    warnings.push({
      type: 'security',
      message: `Found ${unescapedEcho.length} potentially unescaped output statements. Consider using esc_html(), esc_url(), or esc_attr().`,
    });
  }
}

/**
 * Check for dangerous CSS selectors that could break the editor
 */
function checkDangerousCss(phpCode: string, warnings: ValidationWarning[]): void {
  // Check if custom_css default value contains dangerous selectors
  const cssDefaultMatch = phpCode.match(/'default'\s*=>\s*'([^']+)'/);
  if (!cssDefaultMatch) return;

  const cssContent = cssDefaultMatch[1];

  // Check for body/html selectors (these break the Elementor editor)
  const hasBodySelector = /\\bbody\s*[,{]/i.test(cssContent);
  const hasHtmlSelector = /\\bhtml\s*[,{]/i.test(cssContent);

  if (hasBodySelector || hasHtmlSelector) {
    warnings.push({
      type: 'best-practice',
      message: `Custom CSS contains global 'body' or 'html' selectors. These will be automatically removed to prevent breaking the Elementor editor. Scope your CSS to the widget using class selectors instead.`,
    });
  }
}

/**
 * Check for invalid control names (PHP variable names)
 */
function checkControlNames(phpCode: string, errors: ValidationError[]): void {
  // Control names must be valid PHP array keys (alphanumeric + underscore)
  const controlPattern = /\$settings\[['"]([^'"]+)['"]\]/g;
  let match;

  while ((match = controlPattern.exec(phpCode)) !== null) {
    const controlName = match[1];
    if (!/^[a-zA-Z0-9_]+$/.test(controlName)) {
      errors.push({
        type: 'syntax',
        message: `Invalid control name: "${controlName}". Must be alphanumeric with underscores only.`,
        snippet: match[0]
      });
    }
  }
}

/**
 * Check for balanced quotes in PHP code
 */
function checkBalancedQuotes(lines: string[], errors: ValidationError[]): void {
  lines.forEach((line, index) => {
    // Skip HTML lines
    if (!line.includes('<?php') && !line.includes('$') && !line.includes('=>')) {
      return;
    }

    // Count quotes (simple check - doesn't handle escaped quotes perfectly)
    const singleQuotes = (line.match(/(?<!\\)'/g) || []).length;
    const doubleQuotes = (line.match(/(?<!\\)"/g) || []).length;

    if (singleQuotes % 2 !== 0) {
      errors.push({
        type: 'syntax',
        message: `Unbalanced single quotes on line ${index + 1}`,
        line: index + 1,
        snippet: line.trim()
      });
    }

    if (doubleQuotes % 2 !== 0) {
      errors.push({
        type: 'syntax',
        message: `Unbalanced double quotes on line ${index + 1}`,
        line: index + 1,
        snippet: line.trim()
      });
    }
  });
}

/**
 * Check class structure is valid
 */
function checkClassStructure(phpCode: string, errors: ValidationError[]): void {
  // Must have class declaration
  if (!phpCode.includes('extends \\Elementor\\Widget_Base')) {
    errors.push({
      type: 'structure',
      message: 'Widget class must extend \\Elementor\\Widget_Base',
    });
  }

  // Must have required methods
  const requiredMethods = ['get_name', 'get_title', 'get_icon', 'get_categories', 'register_controls', 'render'];

  requiredMethods.forEach(method => {
    const pattern = new RegExp(`(public|protected)\\s+function\\s+${method}\\s*\\(`);
    if (!pattern.test(phpCode)) {
      errors.push({
        type: 'structure',
        message: `Missing required method: ${method}()`,
      });
    }
  });
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return '✅ PHP widget code is valid';
  }

  let output = '';

  if (result.errors.length > 0) {
    output += `❌ Found ${result.errors.length} error(s):\n\n`;
    result.errors.forEach((error, i) => {
      output += `${i + 1}. [${error.type.toUpperCase()}] ${error.message}\n`;
      if (error.line) output += `   Line: ${error.line}\n`;
      if (error.snippet) output += `   Code: ${error.snippet.trim()}\n`;
      output += '\n';
    });
  }

  if (result.warnings.length > 0) {
    output += `⚠️  Found ${result.warnings.length} warning(s):\n\n`;
    result.warnings.forEach((warning, i) => {
      output += `${i + 1}. [${warning.type.toUpperCase()}] ${warning.message}\n`;
      if (warning.line) output += `   Line: ${warning.line}\n`;
      output += '\n';
    });
  }

  return output;
}
