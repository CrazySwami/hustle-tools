import { tool } from 'ai';
import { z } from 'zod';

/**
 * Elementor JSON Editor Tools
 * Converted from OpenAI function calling format to Vercel AI SDK format
 */

// Tool 1: Generate JSON Patch
export const generateJsonPatch = tool({
  description: 'Generates RFC 6902 JSON Patch operations to apply specific changes to the Elementor JSON. Each operation specifies an exact path and new value. Use this when the user wants to modify the JSON.',
  parameters: z.object({
    patches: z.array(z.object({
      op: z.enum(['replace', 'add', 'remove']).describe('The operation to perform'),
      path: z.string().describe('JSON Pointer path to target property (e.g., /content/0/settings/title_color)'),
      value: z.any().optional().describe('The new value to apply (not required for remove operation)'),
    })).describe('Array of JSON Patch operations to apply'),
    summary: z.string().describe('Human-readable description of what these patches accomplish'),
  }),
  execute: async ({ patches, summary }) => {
    return {
      tool: 'generate_json_patch',
      patches,
      summary,
      requiresApproval: true,
      timestamp: new Date().toISOString(),
    };
  },
});

// Tool 2: Analyze JSON Structure
export const analyzeJsonStructure = tool({
  description: 'Analyzes the user\'s CURRENT loaded JSON template. Use ONLY when user asks about THEIR SPECIFIC template: "what widgets do I have in this template?", "where is the button in my JSON?", "list my widgets". DO NOT use for general Elementor documentation questions.',
  parameters: z.object({
    query_type: z.enum(['find_property', 'list_widgets', 'get_widget_info', 'search_value']).describe('Type of analysis to perform'),
    target: z.string().optional().describe('Property name, widget type, or value to search for'),
  }),
  execute: async ({ query_type, target }, { currentJson }: any) => {
    const json = currentJson || {};
    const widgets = json?.content || [];

    if (query_type === 'list_widgets') {
      return {
        tool: 'analyze_json_structure',
        query_type,
        widgetType: json?.widgetType || 'custom_html_section',
        widgetCount: widgets.length,
        hasContent: widgets.length > 0,
        widgets: widgets.map((w: any) => ({
          elType: w.elType,
          widgetType: w.widgetType,
          id: w.id,
        })),
        timestamp: new Date().toISOString(),
      };
    }

    if (query_type === 'find_property' && target) {
      const results: any[] = [];
      const findInObject = (obj: any, path: string = '') => {
        for (const key in obj) {
          const currentPath = path ? `${path}/${key}` : key;
          if (key === target) {
            results.push({ path: currentPath, value: obj[key] });
          }
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            findInObject(obj[key], currentPath);
          }
        }
      };
      findInObject(json);

      return {
        tool: 'analyze_json_structure',
        query_type,
        target,
        found: results.length > 0,
        results,
        timestamp: new Date().toISOString(),
      };
    }

    if (query_type === 'search_value' && target) {
      const results: any[] = [];
      const searchInObject = (obj: any, path: string = '') => {
        for (const key in obj) {
          const currentPath = path ? `${path}/${key}` : key;
          if (typeof obj[key] === 'string' && obj[key].includes(target)) {
            results.push({ path: currentPath, value: obj[key] });
          }
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            searchInObject(obj[key], currentPath);
          }
        }
      };
      searchInObject(json);

      return {
        tool: 'analyze_json_structure',
        query_type,
        target,
        found: results.length > 0,
        results,
        timestamp: new Date().toISOString(),
      };
    }

    if (query_type === 'get_widget_info' && target) {
      const widget = widgets.find((w: any) =>
        w.widgetType === target || w.elType === target || w.id === target
      );

      return {
        tool: 'analyze_json_structure',
        query_type,
        target,
        found: !!widget,
        widget: widget || null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      tool: 'analyze_json_structure',
      query_type,
      target,
      result: 'No specific analysis performed',
      timestamp: new Date().toISOString(),
    };
  },
});

// Tool 3: Search Elementor Docs
export const searchElementorDocs = tool({
  description: 'Searches the Elementor widget documentation from the vector store. Use when user asks about ELEMENTOR DOCUMENTATION: widget properties, available settings, how widgets work. Examples: "what properties does button widget have?", "button widget documentation", "heading widget settings". DO NOT use for questions about the user\'s current JSON - use analyze_json_structure for that.',
  parameters: z.object({
    query: z.string().describe('The search query for Elementor documentation (e.g., "button widget settings", "heading widget properties")'),
    widget_type: z.string().optional().describe('Optional specific widget type to search for (e.g., "button", "heading", "image")'),
  }),
  execute: async ({ query, widget_type }) => {
    // TODO: Implement actual vector store search
    // Options:
    // 1. Use OpenAI Assistants API with vector store
    // 2. Use Supabase pgvector if Elementor docs are embedded
    // 3. Use local search as fallback

    // Placeholder implementation:
    const mockResults = [
      {
        filename: widget_type ? `${widget_type}.php` : 'button.php',
        snippet: `Documentation for ${widget_type || 'button'} widget. Properties include: text, link, style, size, alignment, typography, hover effects, and animation settings.`,
        relevance: 0.92,
      },
      {
        filename: 'widget-base.php',
        snippet: 'Base widget class with common properties: margin, padding, border, background, typography.',
        relevance: 0.85,
      },
      {
        filename: 'controls.php',
        snippet: 'Elementor controls documentation including color pickers, typography controls, dimension controls.',
        relevance: 0.78,
      },
    ];

    return {
      tool: 'search_elementor_docs',
      query,
      widget_type,
      filesSearched: 48,
      results: mockResults,
      timestamp: new Date().toISOString(),
    };
  },
});

// Tool 4: Open Template in Playground
export const openTemplateInPlayground = tool({
  description: 'Opens or refreshes the Elementor template in WordPress Playground. Use this when the user asks to view, preview, test, or open the template in WordPress/Playground. Also use after making changes if user wants to see the result.',
  parameters: z.object({
    action: z.enum(['launch', 'refresh', 'open_editor']).describe('Action to perform: launch (start playground), refresh (update existing template), open_editor (open Elementor editor)'),
    message: z.string().optional().describe('Optional message to show user about what is being opened/refreshed'),
  }),
  execute: async ({ action, message }) => {
    return {
      tool: 'open_template_in_playground',
      action,
      message: message || `Playground ${action} initiated`,
      timestamp: new Date().toISOString(),
    };
  },
});

// Tool 5: Capture Playground Screenshot
export const capturePlaygroundScreenshot = tool({
  description: 'Captures a screenshot of the WordPress Playground to show the current template preview. Use when user wants to see how the template looks, analyze the design, or asks "show me how it looks", "take a screenshot", "capture the preview".',
  parameters: z.object({
    reason: z.string().optional().describe('Why the screenshot is being taken (e.g., "to analyze layout", "to show current design")'),
  }),
  execute: async ({ reason }) => {
    return {
      tool: 'capture_playground_screenshot',
      reason: reason || 'User requested screenshot',
      timestamp: new Date().toISOString(),
    };
  },
});

// Tool 6: Convert HTML to Elementor JSON
export const convertHtmlToElementorJson = tool({
  description: 'Converts HTML/CSS/JavaScript code into Elementor JSON format. Use when user wants to: "convert HTML to Elementor", "generate Elementor from HTML", "import HTML design", "create template from HTML". Optionally accepts an image for visual reference. Validates all widgets against vector store for accurate properties.',
  parameters: z.object({
    html_code: z.string().describe('The HTML code to convert'),
    css_code: z.string().optional().describe('The CSS code (can be empty)'),
    js_code: z.string().optional().describe('The JavaScript code (can be empty)'),
    image_description: z.string().optional().describe('Optional visual description from uploaded image to guide the conversion'),
  }),
  execute: async ({ html_code, css_code, js_code, image_description }) => {
    // Will be implemented with lib/elementor/html-converter.js
    // For now, return placeholder
    return {
      tool: 'convert_html_to_elementor_json',
      html_code,
      css_code: css_code || '',
      js_code: js_code || '',
      image_description,
      elementorJson: {
        // Placeholder - will be generated by html-converter
        content: [],
        widgetType: 'custom_html_section',
      },
      timestamp: new Date().toISOString(),
    };
  },
});

// Tool 7: List Available Tools
export const listAvailableTools = tool({
  description: 'Lists all available tools and capabilities. Use when user asks "what can you do?", "help", "what tools do you have?", "show capabilities", or wants to know available features.',
  parameters: z.object({}),
  execute: async () => {
    return {
      tool: 'list_available_tools',
      tools: [
        {
          icon: '🔧',
          name: 'generate_json_patch',
          description: 'Make surgical edits to JSON with RFC 6902 patches',
          examples: ['Change button color to blue', 'Update heading text'],
        },
        {
          icon: '🔍',
          name: 'analyze_json_structure',
          description: 'Analyze your current template structure',
          examples: ['List all widgets', 'Find button widgets', 'Show heading properties'],
        },
        {
          icon: '📚',
          name: 'search_elementor_docs',
          description: 'Search Elementor widget documentation (48 files)',
          examples: ['Button widget properties', 'Heading widget settings'],
        },
        {
          icon: '🚀',
          name: 'open_template_in_playground',
          description: 'Preview template in WordPress Playground',
          examples: ['Show in playground', 'Open preview', 'Launch WordPress'],
        },
        {
          icon: '📸',
          name: 'capture_playground_screenshot',
          description: 'Capture screenshot of playground preview',
          examples: ['Take screenshot', 'Show how it looks'],
        },
        {
          icon: '🎨',
          name: 'convert_html_to_elementor_json',
          description: 'Convert HTML/CSS/JS to Elementor JSON',
          examples: ['Convert this HTML', 'Create from HTML'],
        },
        {
          icon: '📋',
          name: 'list_available_tools',
          description: 'Show this list of capabilities',
          examples: ['Help', 'What can you do?'],
        },
      ],
      timestamp: new Date().toISOString(),
    };
  },
});

// Export all tools as a collection
export const elementorTools = {
  generateJsonPatch,
  analyzeJsonStructure,
  searchElementorDocs,
  openTemplateInPlayground,
  capturePlaygroundScreenshot,
  convertHtmlToElementorJson,
  listAvailableTools,
};
