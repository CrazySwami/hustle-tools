/**
 * Unified Project Generation - Code Parsing Utilities
 *
 * Centralized parsing functions for extracting code blocks from AI responses.
 * Handles all project types: HTML, Elementor, HubSpot.
 */

import type { ParsedFiles, ProjectType } from './types';
import { getProjectConfig } from './config';

/**
 * Parse AI response into structured files
 *
 * @param code - Raw AI response text
 * @param projectType - Type of project being generated
 * @param subtype - Optional subtype (e.g., 'email' for HubSpot)
 * @returns Parsed files object
 */
export function parseProjectCode(
  code: string,
  projectType: ProjectType,
  subtype?: string
): ParsedFiles {
  const config = getProjectConfig(projectType, subtype);
  return config.parseResponse(code);
}

/**
 * Extract metadata from parsed files
 *
 * @param files - Parsed files
 * @param projectType - Type of project
 * @param subtype - Optional subtype
 * @returns Metadata object
 */
export function extractProjectMetadata(
  files: ParsedFiles,
  projectType: ProjectType,
  subtype?: string
): Record<string, any> {
  const config = getProjectConfig(projectType, subtype);
  if (config.extractMetadata) {
    return config.extractMetadata(files);
  }
  return {};
}

/**
 * Parse HTML project response
 * Extracts HTML, CSS, and JavaScript code blocks
 */
export function parseHTMLProject(code: string): ParsedFiles {
  const htmlMatch = code.match(/```html\n([\s\S]*?)(?:```|$)/);
  const cssMatch = code.match(/```css\n([\s\S]*?)(?:```|$)/);
  const jsMatch = code.match(/```(?:javascript|js)\n([\s\S]*?)(?:```|$)/);

  return {
    html: htmlMatch ? htmlMatch[1].trim() : undefined,
    css: cssMatch ? cssMatch[1].trim() : undefined,
    js: jsMatch ? jsMatch[1].trim() : undefined,
  };
}

/**
 * Parse Elementor plugin response
 * Extracts main plugin file and widget file
 */
export function parseElementorProject(code: string): ParsedFiles {
  // Find ALL PHP code blocks
  const phpBlocks = code.match(/```php\n([\s\S]*?)```/gi) || [];

  // Extract content from each block
  const phpContents = phpBlocks.map(block => {
    const match = block.match(/```php\n([\s\S]*?)```/);
    return match ? match[1].trim() : '';
  });

  // Identify which block is which based on content
  let mainPluginCode = '';
  let widgetCode = '';

  for (const phpCode of phpContents) {
    // Main plugin file: contains "Plugin Name:" header and registration hooks
    if (phpCode.includes('Plugin Name:') && phpCode.includes('add_action')) {
      mainPluginCode = phpCode;
    }
    // Widget file: contains class extending Elementor\Widget_Base
    else if (phpCode.includes('class ') && phpCode.includes('extends \\Elementor\\Widget_Base')) {
      widgetCode = phpCode;
    }
  }

  return {
    pluginMainFile: mainPluginCode || undefined,
    php: widgetCode || undefined,
  };
}

/**
 * Parse HubSpot module response
 * Extracts HTML and HubL code blocks
 */
export function parseHubSpotProject(code: string): ParsedFiles {
  const htmlMatch = code.match(/```html\n([\s\S]*?)(?:```|$)/);
  const hublMatch = code.match(/```hubl\n([\s\S]*?)(?:```|$)/);

  return {
    html: htmlMatch ? htmlMatch[1].trim() : undefined,
    hubl: hublMatch ? hublMatch[1].trim() : undefined,
  };
}

/**
 * Extract Elementor widget metadata from PHP code
 *
 * @param widgetCode - Widget PHP code
 * @param projectName - Project name for fallback
 * @returns Widget metadata
 */
export function extractElementorWidgetMetadata(
  widgetCode: string,
  projectName: string
): {
  className: string;
  widgetName: string;
  widgetSlug: string;
  widgetId: string;
} {
  // Extract class name from PHP
  const classNameMatch = widgetCode.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends/);
  const className = classNameMatch ? classNameMatch[1] : 'Generated_Widget';

  // Generate slug from class name
  const widgetSlug = className.toLowerCase().replace(/_/g, '-');

  // Generate human-readable name from class name
  const widgetName = className
    .replace(/_/g, ' ')
    .replace(/\bWidget\b/, '')
    .trim()
    || projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Generate unique widget ID
  const widgetId = `widget_${Date.now()}`;

  return {
    className,
    widgetName,
    widgetSlug,
    widgetId
  };
}

/**
 * Check if parsed files are complete
 *
 * @param files - Parsed files
 * @param projectType - Type of project
 * @returns True if all required files are present
 */
export function areFilesComplete(
  files: ParsedFiles,
  projectType: ProjectType
): boolean {
  switch (projectType) {
    case 'html':
      return !!(files.html); // At minimum need HTML

    case 'elementor':
      return !!(files.pluginMainFile && files.php); // Need both plugin files

    case 'hubspot':
      return !!(files.html); // At minimum need HTML (HubL optional)

    default:
      return false;
  }
}

/**
 * Get missing files for a project
 *
 * @param files - Parsed files
 * @param projectType - Type of project
 * @returns Array of missing file types
 */
export function getMissingFiles(
  files: ParsedFiles,
  projectType: ProjectType
): string[] {
  const missing: string[] = [];

  switch (projectType) {
    case 'html':
      if (!files.html) missing.push('HTML');
      if (!files.css) missing.push('CSS');
      if (!files.js) missing.push('JavaScript');
      break;

    case 'elementor':
      if (!files.pluginMainFile) missing.push('Main Plugin File');
      if (!files.php) missing.push('Widget File');
      break;

    case 'hubspot':
      if (!files.html) missing.push('HTML');
      if (!files.hubl) missing.push('HubL');
      break;
  }

  return missing;
}

/**
 * Validate code block format
 *
 * @param code - Raw AI response
 * @returns Validation result
 */
export function validateCodeFormat(code: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for markdown code blocks
  if (!code.includes('```')) {
    errors.push('No markdown code blocks found');
  }

  // Check for common malformed patterns
  if (code.includes('```\n\n```')) {
    warnings.push('Empty code blocks detected');
  }

  // Check for unclosed code blocks
  const openBlocks = (code.match(/```/g) || []).length;
  if (openBlocks % 2 !== 0) {
    errors.push('Unclosed code block detected');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Extract usage metadata from API response
 * Usage is sent as a special marker at the end: __USAGE__:{json}
 *
 * @param code - Raw API response
 * @returns Usage metadata and cleaned code
 */
export function extractUsageMetadata(code: string): {
  code: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
} {
  const usageMatch = code.match(/\n\n__USAGE__:(.+)$/);

  if (!usageMatch) {
    return { code };
  }

  try {
    const metadata = JSON.parse(usageMatch[1]);
    const cleanCode = code.replace(/\n\n__USAGE__:.+$/, '');

    return {
      code: cleanCode,
      usage: metadata.usage,
      model: metadata.model,
      finishReason: metadata.finishReason
    };
  } catch (error) {
    console.error('Failed to parse usage metadata:', error);
    return { code };
  }
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get file type from content (content-based detection)
 *
 * @param content - File content
 * @returns Detected file type
 */
export function detectFileType(content: string): 'html' | 'css' | 'js' | 'php' | 'hubl' | 'unknown' {
  // PHP detection
  if (content.trim().startsWith('<?php') || content.includes('<?php')) {
    return 'php';
  }

  // HubL detection (contains HubL tags)
  if (content.includes('{% ') || content.includes('{{ ')) {
    return 'hubl';
  }

  // HTML detection (contains HTML tags)
  if (content.includes('<') && content.includes('>')) {
    return 'html';
  }

  // CSS detection (contains CSS selectors and properties)
  if (content.includes('{') && content.includes('}') && content.includes(':')) {
    // Could be CSS or JS object, check for common CSS patterns
    if (content.match(/[.#][\w-]+\s*{/) || content.match(/@media|@keyframes/)) {
      return 'css';
    }
  }

  // JavaScript detection
  if (content.includes('function') || content.includes('=>') || content.includes('const ') || content.includes('let ')) {
    return 'js';
  }

  return 'unknown';
}
