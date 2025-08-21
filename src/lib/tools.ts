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

// Export all tools
export const tools = {
  getWeather: weatherTool,
  calculate: calculatorTool,
  generateCode: codeGeneratorTool,
  manageTask: taskManagerTool,
  getDocumentContent: documentContentTool,
  scrapeUrl: scrapeUrlTool,
};
