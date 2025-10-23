import { tool } from 'ai';
import { z } from 'zod';

// Weather tool - simulates fetching weather data
export const weatherTool = tool({
  description: 'Get current weather information for a specific location',
  inputSchema: z.object({
    location: z.string().describe('The city or location to get weather for'),
    unit: z.enum(['celsius', 'fahrenheit']).optional().describe('Temperature unit preference'),
  }),
  execute: async ({ location, unit = 'celsius' }) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate weather data
    const weatherConditions = ['sunny', 'cloudy', 'rainy', 'partly cloudy', 'stormy'];
    const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const baseTemp = unit === 'celsius' ? 20 : 68;
    const temperature = baseTemp + Math.floor(Math.random() * 21) - 10;
    
    return {
      location,
      temperature,
      unit,
      condition,
      humidity: Math.floor(Math.random() * 40) + 30,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      timestamp: new Date().toISOString(),
    };
  },
});

// Calculator tool - performs mathematical calculations
export const calculatorTool = tool({
  description: 'Perform mathematical calculations and return the result',
  inputSchema: z.object({
    expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "sin(30)")'),
  }),
  execute: async ({ expression }) => {
    try {
      // Simple expression evaluation (in production, use a proper math parser)
      // This is a simplified version - you'd want to use a library like mathjs
      const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
      const result = eval(sanitized);
      
      return {
        expression,
        result,
        isValid: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        expression,
        result: null,
        isValid: false,
        error: 'Invalid mathematical expression',
        timestamp: new Date().toISOString(),
      };
    }
  },
});

// Code generation tool - generates code snippets
export const codeGeneratorTool = tool({
  description: 'Generate code snippets in various programming languages',
  inputSchema: z.object({
    language: z.string().describe('Programming language (e.g., javascript, python, typescript)'),
    description: z.string().describe('Description of what the code should do'),
    complexity: z.enum(['simple', 'intermediate', 'advanced']).optional().describe('Code complexity level'),
  }),
  execute: async ({ language, description, complexity = 'simple' }) => {
    // Simulate code generation delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // This would typically call an AI service or use templates
    const codeSnippet = `// ${description}\n// Language: ${language}\n// Complexity: ${complexity}\n\n// Generated code would go here\nconsole.log("Generated code for: ${description}");`;
    
    return {
      language,
      description,
      complexity,
      code: codeSnippet,
      timestamp: new Date().toISOString(),
    };
  },
});

// Task management tool - creates and manages tasks
export const taskManagerTool = tool({
  description: 'Create, update, or manage tasks and to-do items',
  inputSchema: z.object({
    action: z.enum(['create', 'update', 'complete', 'delete']).describe('Action to perform on the task'),
    title: z.string().describe('Task title or description'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority level'),
    dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format'),
  }),
  execute: async ({ action, title, priority = 'medium', dueDate }) => {
    // Simulate task management
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const taskId = Math.random().toString(36).substr(2, 9);
    
    return {
      taskId,
      action,
      title,
      priority,
      dueDate,
      status: action === 'complete' ? 'completed' : 'active',
      createdAt: new Date().toISOString(),
    };
  },
});

// Document content tool - gets the current content of the document editor
export const documentContentTool = tool({
  description: 'Get the current content of the document editor for analysis, editing suggestions, or context',
  inputSchema: z.object({
    requestType: z.enum(['full', 'summary', 'analysis']).optional().describe('Type of content request - full content, summary, or analysis'),
  }),
  execute: async ({ requestType = 'full' }) => {
    // This will be populated by the frontend when the tool is called
    // The actual content will be passed from the DocumentChatView component
    return {
      requestType,
      content: '', // Will be populated by the frontend
      wordCount: 0,
      characterCount: 0,
      timestamp: new Date().toISOString(),
      message: 'Document content will be provided by the frontend'
    };
  },
});

// Scrape URL tool - scrapes the content of a given URL
export const scrapeUrlTool = tool({
  description: 'Scrape a URL and return the content.',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to scrape'),
  }),
  execute: async ({ url }) => {
    try {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) {
        throw new Error('FIRECRAWL_API_KEY is not set.');
      }

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`FireCrawl API request failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      return result.data; // The actual scraped data is in the 'data' property
    } catch (error) {
      console.error('Error scraping URL:', error);
      // Return a structured error object that the UI can handle
      return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },
});

// HTML Generator tool - generates HTML/CSS/JS with optional image analysis
export const htmlGeneratorTool = tool({
  description: 'REQUIRED TOOL: Use this tool whenever a user asks to generate, create, build, or make HTML, CSS, JavaScript, or any web component (hero section, pricing table, contact form, navbar, footer, etc.). This tool opens an interactive UI for the user to provide details and upload optional images. DO NOT generate code yourself - always use this tool.',
  inputSchema: z.object({
    description: z.string().describe('Detailed description of what to build (layout, features, styling, functionality)'),
    images: z.array(z.object({
      url: z.string().describe('Base64 data URL or uploaded image URL'),
      filename: z.string().describe('Original filename'),
    })).max(3).optional().describe('Up to 3 reference images (mockups, designs, screenshots)'),
  }),
  execute: async ({ description, images = [] }) => {
    // This tool will trigger generative UI on the frontend
    // The actual generation happens via a separate API call
    return {
      description,
      imageCount: images.length,
      images,
      timestamp: new Date().toISOString(),
      status: 'ready_to_generate',
      message: 'HTML generation tool activated. Opening generator interface...'
    };
  },
});

// Section editing tools for HTML/CSS/JS sections
export const updateSectionHtmlTool = tool({
  description: 'Update the HTML content of the current section. Use this when the user asks to modify, change, or update the HTML markup of the section they are viewing.',
  inputSchema: z.object({
    html: z.string().describe('The new HTML content for the section (NO DOCTYPE, html, head, or body tags - section-level content only)'),
    reasoning: z.string().optional().describe('Brief explanation of what was changed and why'),
  }),
  execute: async ({ html, reasoning }) => {
    return {
      type: 'update_html',
      html,
      reasoning,
      timestamp: new Date().toISOString(),
      message: 'HTML updated successfully',
    };
  },
});

export const updateSectionCssTool = tool({
  description: 'Update the CSS styles of the current section. Use this when the user asks to modify, change, or update the styling, colors, layout, or appearance of the section.',
  inputSchema: z.object({
    css: z.string().describe('The new CSS content for the section (NO <style> tags - pure CSS only)'),
    reasoning: z.string().optional().describe('Brief explanation of what styles were changed and why'),
  }),
  execute: async ({ css, reasoning }) => {
    return {
      type: 'update_css',
      css,
      reasoning,
      timestamp: new Date().toISOString(),
      message: 'CSS updated successfully',
    };
  },
});

export const updateSectionJsTool = tool({
  description: 'Update the JavaScript code of the current section. Use this when the user asks to modify, change, or update the interactivity, animations, or functionality of the section.',
  inputSchema: z.object({
    js: z.string().describe('The new JavaScript content for the section (NO <script> tags - pure JavaScript only)'),
    reasoning: z.string().optional().describe('Brief explanation of what functionality was changed and why'),
  }),
  execute: async ({ js, reasoning }) => {
    return {
      type: 'update_js',
      js,
      reasoning,
      timestamp: new Date().toISOString(),
      message: 'JavaScript updated successfully',
    };
  },
});

// Get editor content tool - retrieves current HTML/CSS/JS from Monaco editor
export const getEditorContentTool = tool({
  description: 'Get the current HTML, CSS, and/or JavaScript content from the Monaco code editor. Use this tool whenever you need to see what code the user is working on, analyze it, suggest improvements, or make targeted edits to specific sections.',
  inputSchema: z.object({
    files: z.array(z.enum(['html', 'css', 'js'])).optional().describe('Specific files to retrieve (html, css, js). If not specified, returns all three.'),
  }),
  execute: async ({ files }) => {
    // This will be populated by the frontend using the global state
    // The actual content is retrieved from useEditorContent hook
    return {
      files: files || ['html', 'css', 'js'],
      content: {}, // Will be populated by frontend
      timestamp: new Date().toISOString(),
      message: 'Editor content will be provided by the frontend using global state'
    };
  },
});

// Edit code with diff tool - generates diff for specific code changes
export const editCodeWithDiffTool = tool({
  description: 'Make targeted edits to HTML, CSS, or JavaScript code and generate a diff preview for user approval. Use this tool when the user asks to modify specific parts of their code (e.g., "change the button color to red", "fix the alignment", "add a hover effect").',
  inputSchema: z.object({
    file: z.enum(['html', 'css', 'js']).describe('Which file to edit (html, css, or js)'),
    instruction: z.string().describe('Clear description of what changes to make to the code'),
    targetSection: z.string().optional().describe('Specific section or selector to target (e.g., ".hero-section", "button", "#header")'),
  }),
  execute: async ({ file, instruction, targetSection }) => {
    // This tool will trigger the diff generation flow
    // The actual diff is generated via /api/edit-code endpoint
    return {
      file,
      instruction,
      targetSection,
      timestamp: new Date().toISOString(),
      status: 'pending_diff_generation',
      message: 'Code edit tool activated. Generating diff preview...'
    };
  },
});

// Export all tools
export const tools = {
  getWeather: weatherTool,
  calculate: calculatorTool,
  generateCode: codeGeneratorTool,
  manageTask: taskManagerTool,
  getDocumentContent: documentContentTool,
  scrapeUrl: scrapeUrlTool,
  generateHTML: htmlGeneratorTool,
  updateSectionHtml: updateSectionHtmlTool,
  updateSectionCss: updateSectionCssTool,
  updateSectionJs: updateSectionJsTool,
  getEditorContent: getEditorContentTool,
  editCodeWithDiff: editCodeWithDiffTool,
};
