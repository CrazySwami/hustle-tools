import { tool } from 'ai';
import { z } from 'zod';

// Google Search tool - search Google and get organic results with rankings
export const googleSearchTool = tool({
  description: 'Search Google for keywords and get organic search results with rankings, titles, URLs, and snippets. Useful for SEO research, keyword analysis, and understanding search rankings.',
  inputSchema: z.object({
    keyword: z.string().describe('The keyword or search query to look up on Google'),
    location: z.string().optional().describe('Geographic location for localized results (e.g., "Austin, Texas, United States")'),
    country: z.string().optional().default('us').describe('Country code for results (e.g., "us", "gb", "ca")'),
    language: z.string().optional().default('en').describe('Language code (e.g., "en", "es", "fr")'),
    device: z.enum(['desktop', 'tablet', 'mobile']).optional().default('desktop').describe('Device type for search results'),
    numResults: z.number().optional().default(10).describe('Number of results to return (max 100)'),
  }),
  execute: async ({ keyword, location, country = 'us', language = 'en', device = 'desktop', numResults = 10 }) => {
    // Return confirmation needed status - the widget will handle the actual search
    return {
      confirmationRequired: true,
      keyword,
      location,
      country,
      language,
      device,
      numResults,
      message: 'Please confirm search parameters before searching Google.',
    };
  },
});

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

// View editor code tool - displays code to user with syntax highlighting AND retrieves content for AI
export const viewEditorCodeTool = tool({
  description: 'Display code files (HTML, CSS, JavaScript) with syntax highlighting. IMPORTANT: Automatically pre-select files based on what the user asked for. Examples: "show HTML" → files: ["html"], "view CSS and JS" → files: ["css", "js"], "show all code" → files: ["html", "css", "js"]. After calling this tool, DO NOT send additional text explaining what will happen - the widget handles everything.',
  inputSchema: z.object({
    files: z.array(z.enum(['html', 'css', 'js'])).optional().describe('Pre-select specific files based on user request. Parse their request to determine which files they want to see.'),
  }),
  execute: async ({ files }) => {
    // Return file list structure for UI
    const availableFiles = [
      { name: 'index.html', type: 'html' as const, selected: files?.includes('html') ?? true },
      { name: 'styles.css', type: 'css' as const, selected: files?.includes('css') ?? true },
      { name: 'script.js', type: 'js' as const, selected: files?.includes('js') ?? false }
    ];

    return {
      files: availableFiles,
      timestamp: new Date().toISOString(),
      status: 'ready_to_view',
      message: 'Code viewer ready. Select files to view.'
    };
  },
});

// =====================
// TEST PING TOOL (Simple Diagnostic)
// =====================
export const testPingTool = tool({
  description: 'A simple test tool that responds with a ping message. Use this IMMEDIATELY when the user says "test ping" or "ping test" to verify the tool calling system is working.',
  inputSchema: z.object({
    message: z.string().optional().describe('Optional message to include in the ping response'),
  }),
  execute: async ({ message }) => {
    console.log('🏓 TEST PING TOOL EXECUTED!', { message });
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      message: message || 'Pong! Tool calling is working.',
      endpoint: 'chat-elementor',
    };
  },
});

// Tab switcher tool - switches between editor tabs
export const switchTabTool = tool({
  description: 'Switch to a different tab in the Elementor editor. Use this when the user wants to navigate to a specific section (Code Editor, Visual Editor, Section Library, WordPress Playground, Site Content, or Style Guide).',
  inputSchema: z.object({
    tab: z.enum(['json', 'visual', 'sections', 'playground', 'site-content', 'style-guide']).describe('The tab to switch to: json (Code Editor), visual (Visual Editor), sections (Section Library), playground (WordPress Playground), site-content (Site Content), or style-guide (Style Guide)'),
    reason: z.string().optional().describe('Optional reason for switching tabs'),
  }),
  execute: async ({ tab, reason }) => {
    // This tool will trigger the tab switch via frontend callback
    // The actual switching happens via the widget component
    const tabNames = {
      'json': 'Code Editor',
      'visual': 'Visual Editor',
      'sections': 'Section Library',
      'playground': 'WordPress Playground',
      'site-content': 'Site Content',
      'style-guide': 'Style Guide',
    };

    return {
      tab,
      tabName: tabNames[tab],
      reason,
      timestamp: new Date().toISOString(),
      status: 'ready_to_switch',
      message: `Tab switcher activated. Ready to navigate to ${tabNames[tab]}.`
    };
  },
});

// Step Planning tool - creates explicit numbered plans before execution
export const planStepsTool = tool({
  description: `🎯 PRIMARY PLANNING TOOL - Use this FIRST for ANY request involving multiple steps or the word "and".

This creates a beautiful visual step-by-step plan that requires user approval before execution.

✅ ALWAYS USE THIS TOOL if the request contains:
- The word "and" → "Plan X AND write Y" ✓ REQUIRES planSteps
- Multiple verbs → "Research, plan, create" ✓ REQUIRES planSteps
- A sequence → "First A, then B" ✓ REQUIRES planSteps
- 2+ separate actions ✓ REQUIRES planSteps

EXAMPLES REQUIRING THIS TOOL:
✓ "Plan 8 blog posts for January and write the first one"
✓ "Research WordPress trends and create a content calendar"
✓ "Plan posts for February then write two of them"
✓ "Create blog calendar and generate the first 3 posts"

EXAMPLES NOT REQUIRING THIS (single action only):
✗ "Plan 8 blog posts for January" → Just use planBlogTopics directly
✗ "Write a blog post about AI" → Just use writeBlogPost directly

MANDATORY WORKFLOW:
1. Detect if request has multiple steps (look for "and", multiple verbs, sequences)
2. If YES → Call planSteps FIRST before doing ANYTHING else
3. Create numbered steps with specific tool names
4. STOP and ask: "Does this plan look good? Should I proceed?"
5. WAIT for user approval ("yes", "proceed", "ok", "go ahead")
6. After approval → Execute step 1 → Call updateStepProgress(1, completed) → Execute step 2 → etc.

CRITICAL: Users explicitly requested this workflow. They want to see and approve the plan BEFORE execution!`,

  inputSchema: z.object({
    goal: z.string().describe('The overall goal or task the user requested'),
    steps: z.array(z.object({
      number: z.number().describe('Step number (1, 2, 3...)'),
      description: z.string().describe('What this step will do'),
      toolToUse: z.string().describe('Which tool will be used (e.g., "webSearch", "planBlogTopics", "writeBlogPost")'),
      expectedOutput: z.string().describe('What result this step should produce'),
    })).describe('Array of steps to complete the goal'),
  }),

  execute: async ({ goal, steps }) => {
    return {
      goal,
      steps,
      totalSteps: steps.length,
      status: 'awaiting_approval',
      requiresApproval: true,
      currentStep: 0,
      completedSteps: [],
      timestamp: new Date().toISOString(),
      message: `I've created a ${steps.length}-step plan. Review the steps above and let me know if you'd like me to proceed!`
    };
  },
});

// Update Step Progress tool - marks steps as completed
export const updateStepProgressTool = tool({
  description: `Update the progress of the current execution plan by marking steps as completed.

Use this AFTER completing each step in the plan to update the visual progress tracker.

Call this tool:
- After successfully completing a step
- Before moving to the next step
- To keep the user informed of progress`,

  inputSchema: z.object({
    stepNumber: z.number().describe('The step number that was just completed (1, 2, 3...)'),
    status: z.enum(['completed', 'failed', 'skipped']).describe('The status of this step'),
    note: z.string().optional().describe('Optional note about this step (e.g., what was accomplished)'),
  }),

  execute: async ({ stepNumber, status, note }) => {
    return {
      stepNumber,
      status,
      note,
      timestamp: new Date().toISOString(),
      message: `Step ${stepNumber} marked as ${status}${note ? `: ${note}` : ''}`
    };
  },
});

// Blog Planner tool - generates monthly blog content calendars
export const planBlogTopicsTool = tool({
  description: `Opens an interactive blog planner widget where the user can configure and generate a monthly content calendar.

IMPORTANT: This tool ONLY opens the widget - it does NOT generate blog topics yet. The user must click "Generate Blog Plan" in the widget to actually create the topics.

After calling this tool:
- DO NOT list or describe any blog topics (they haven't been generated yet)
- DO NOT say topics were created or generated
- ONLY say: "I've opened the blog planner. Click 'Generate Blog Plan' when you're ready."

Use this when user requests blog planning, content calendar, topic ideas, or wants to plan blog posts for a specific month.`,
  inputSchema: z.object({
    month: z.string().describe('Month and year (e.g., "January 2025", "Feb 2025")'),
    postsPerMonth: z.number().describe('Number of blog posts to plan for the month'),
    niche: z.string().describe('Blog niche/topic area (e.g., "WordPress development", "Digital marketing", "E-commerce")'),
    targetAudience: z.string().describe('Target audience description (e.g., "Small business owners", "Web developers", "Marketing managers")'),
    brandVoice: z.string().optional().describe('Brand voice/tone (e.g., "professional", "casual", "technical", "friendly")'),
    existingTopics: z.array(z.string()).optional().describe('Topics already covered to avoid duplicates'),
  }),
  execute: async ({ month, postsPerMonth, niche, targetAudience, brandVoice, existingTopics = [] }) => {
    return {
      month,
      postsPerMonth,
      niche,
      targetAudience,
      brandVoice: brandVoice || 'professional',
      existingTopics,
      status: 'widget_opened',
      timestamp: new Date().toISOString(),
      message: `Widget opened. User must click "Generate Blog Plan" to create ${postsPerMonth} topics for ${month}.`
    };
  },
});

// Blog Writer tool - writes complete blog posts with optional research
export const writeBlogPostTool = tool({
  description: 'Write a complete blog post from a topic. Optionally conduct research using web search for up-to-date information. Use this when user wants to write a blog post, create content, or expand on a blog topic.',
  inputSchema: z.object({
    title: z.string().describe('Blog post title'),
    focusKeyword: z.string().describe('Primary SEO keyword to target'),
    metaDescription: z.string().optional().describe('Meta description for SEO'),
    contentType: z.enum(['how-to', 'listicle', 'guide', 'tutorial', 'comparison']).describe('Type of content to write'),
    estimatedWordCount: z.number().describe('Target word count for the post'),
    enableResearch: z.boolean().describe('Whether to research the topic before writing (uses web search)'),
    brandVoice: z.string().optional().describe('Brand voice/tone to use'),
    additionalInstructions: z.string().optional().describe('Any specific instructions or requirements'),
    internalLinkPage: z.string().optional().describe('Internal page to link to'),
    callToAction: z.string().optional().describe('Call to action to include'),
  }),
  execute: async ({ title, focusKeyword, metaDescription, contentType, estimatedWordCount, enableResearch, brandVoice, additionalInstructions, internalLinkPage, callToAction }) => {
    return {
      title,
      focusKeyword,
      metaDescription,
      contentType,
      estimatedWordCount,
      enableResearch,
      brandVoice: brandVoice || 'professional',
      additionalInstructions,
      internalLinkPage: internalLinkPage || '/blog',
      callToAction: callToAction || 'Download our free guide',
      status: 'ready_to_write',
      timestamp: new Date().toISOString(),
      message: enableResearch
        ? `Blog writer activated. Will research and write "${title}".`
        : `Blog writer activated. Ready to write "${title}".`
    };
  },
});

export const tools = {
  googleSearch: googleSearchTool,
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
  viewEditorCode: viewEditorCodeTool,
  // editCode: editCodeTool, // REMOVED: Was too complex, use updateSection tools instead
  testPing: testPingTool,
  switchTab: switchTabTool,
  planSteps: planStepsTool,                 // ⭐ Multi-step planning tool
  updateStepProgress: updateStepProgressTool, // ⭐ Step progress tracking
  planBlogTopics: planBlogTopicsTool,
  writeBlogPost: writeBlogPostTool,
};
