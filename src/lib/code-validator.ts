// Code Validator - Validates syntax before applying edits
// Prevents broken code from being applied to the editor

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate HTML syntax (basic checks)
 */
export function validateHTML(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for unclosed tags
  const openTags: string[] = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  let match;

  while ((match = tagRegex.exec(code)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    // Self-closing tags
    const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    if (selfClosing.includes(tagName)) continue;

    if (fullTag.startsWith('</')) {
      // Closing tag
      if (openTags.length === 0 || openTags[openTags.length - 1] !== tagName) {
        errors.push(`Unexpected closing tag: </${tagName}>`);
      } else {
        openTags.pop();
      }
    } else if (!fullTag.endsWith('/>')) {
      // Opening tag
      openTags.push(tagName);
    }
  }

  if (openTags.length > 0) {
    errors.push(`Unclosed tags: ${openTags.join(', ')}`);
  }

  // Check for dangerous patterns
  if (code.includes('<script') && !code.includes('</script>')) {
    warnings.push('Script tag may be unclosed');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate CSS syntax (basic checks)
 */
export function validateCSS(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for balanced braces
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
  }

  // Check for semicolons in declarations (warning only)
  const declarationRegex = /([a-zA-Z-]+)\s*:\s*([^;{}]+)(?=[;}])/g;
  let declMatch;
  while ((declMatch = declarationRegex.exec(code)) !== null) {
    const property = declMatch[1];
    const value = declMatch[2].trim();

    if (value && !code.substring(declMatch.index + declMatch[0].length).startsWith(';') &&
        !code.substring(declMatch.index + declMatch[0].length).startsWith('}')) {
      warnings.push(`Missing semicolon after property: ${property}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate JavaScript syntax (basic checks)
 */
export function validateJS(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for balanced parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;

  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`);
  }

  // Check for balanced braces
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
  }

  // Check for balanced brackets
  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/\]/g) || []).length;

  if (openBrackets !== closeBrackets) {
    errors.push(`Unbalanced brackets: ${openBrackets} opening, ${closeBrackets} closing`);
  }

  // Check for common syntax errors
  if (code.includes('function (') || code.includes('function(')) {
    // Anonymous functions are OK
  }

  // Try to catch obvious syntax errors
  try {
    // Don't actually eval - just check for common patterns
    if (code.includes('var var') || code.includes('const const') || code.includes('let let')) {
      warnings.push('Duplicate variable declaration keyword detected');
    }
  } catch (e) {
    // Ignore - basic validation only
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate PHP syntax (basic checks)
 */
export function validatePHP(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for PHP opening tag
  if (!code.trim().startsWith('<?php') && !code.includes('<?php')) {
    warnings.push('Missing PHP opening tag (<?php)');
  }

  // Check for balanced braces
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
  }

  // Check for balanced parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;

  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`);
  }

  // Check for common syntax errors
  if (code.includes(';;')) {
    warnings.push('Double semicolon detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Main validation function - routes to appropriate validator
 */
export function validateCode(code: string, fileType: 'html' | 'css' | 'js' | 'php'): ValidationResult {
  switch (fileType) {
    case 'html':
      return validateHTML(code);
    case 'css':
      return validateCSS(code);
    case 'js':
      return validateJS(code);
    case 'php':
      return validatePHP(code);
    default:
      return { isValid: true, errors: [], warnings: [] };
  }
}
