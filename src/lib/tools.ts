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

// REMOVED: htmlGeneratorTool - Replaced by editCodeWithMorphTool which works on BOTH empty AND existing files
// Morph is the single unified tool for all code writing/editing
// See: editCodeWithMorphTool below

// Section editing tools for HTML/CSS/JS sections
// REMOVED: updateSectionHtmlTool - Replaced by editCodeWithMorphTool (handles everything!)
// editCodeWithMorph works on empty AND existing files, no need for separate update tools

// REMOVED: updateSectionCssTool - Replaced by editCodeWithMorphTool (handles everything!)
// editCodeWithMorph works on empty AND existing files, no need for separate update tools

// REMOVED: updateSectionJsTool - Replaced by editCodeWithMorphTool (handles everything!)
// editCodeWithMorph works on empty AND existing files, no need for separate update tools

// REMOVED: getEditorContentTool - no longer needed
// Morph Fast Apply automatically accesses editor content when making edits
// The current section code is passed via system prompt in chat-elementor API route

// REMOVED: editCodeWithDiffTool - replaced by Morph Fast Apply (editCodeWithMorphTool)
// Morph is 10x faster, 98% accurate, and doesn't require diff approval workflow

// REMOVED: updateSectionPhpTool - Replaced by editCodeWithMorphTool (handles everything!)
// editCodeWithMorph supports PHP files via file='php' parameter

// Edit Code with Morph Fast Apply - PREFERRED method for code editing
export const editCodeWithMorphTool = tool({
  description: 'Edit code using Morph Fast Apply (98% accuracy, 10x faster than diffs). This is the PREFERRED way to edit existing code. Use lazy edits with "// ... existing code ..." to indicate unchanged sections. Works with ANY model (even Haiku!) because you only write the changes, not complex diff format. Supports HTML, CSS, JavaScript, and PHP files.',
  inputSchema: z.object({
    file: z.enum(['html', 'css', 'js', 'php']).describe('Which file to edit (html, css, js, or php)'),
    instruction: z.string().describe('Clear first-person instruction: "I am changing the button color to red" or "I am adding error handling to the auth function"'),
    lazyEdit: z.string().describe('The code changes using "// ... existing code ..." for unchanged parts. Example:\n// ... existing code ...\n.button {\n  background: red;\n}\n// ... existing code ...'),
  }),
  execute: async ({ file, instruction, lazyEdit }) => {
    return {
      file,
      instruction,
      lazyEdit,
      timestamp: new Date().toISOString(),
      status: 'pending_morph_merge',
      message: 'Morph Fast Apply activated. Merging changes...',
    };
  },
});

// REMOVED: viewEditorCodeTool - No longer needed
// The current section code is automatically included in the system prompt
// Model can see all files (HTML/CSS/JS/PHP) without needing a separate "view" tool
// See: System prompt in /src/app/api/chat-elementor/route.ts lines 117-147

// Edit Document with Morph Fast Apply - For document/prose editing
export const editDocumentWithMorphTool = tool({
  description: 'Edit document content using Morph Fast Apply (98% accuracy, 10x faster than diffs). This is the PREFERRED way to edit prose, articles, blog posts, and documents. Use lazy edits with "... existing text ..." to indicate unchanged sections. Works with ANY model (even Haiku!) because you only write the changes, not complex diff format.',
  inputSchema: z.object({
    instruction: z.string().describe('Clear first-person instruction: "I am fixing the grammar in paragraph 3" or "I am adding a conclusion section"'),
    lazyEdit: z.string().describe('The document changes using "... existing text ..." for unchanged parts. Example:\n... existing text ...\n\n## New Section\n\nThis is the new content I\'m adding.\n\n... existing text ...'),
  }),
  execute: async ({ instruction, lazyEdit }) => {
    return {
      instruction,
      lazyEdit,
      timestamp: new Date().toISOString(),
      status: 'pending_morph_merge',
      message: 'Document Morph Fast Apply activated. Merging changes...',
    };
  },
});

// =====================
// DOCUMENT ANALYSIS TOOLS
// =====================

// Text Statistics Tool - Get detailed statistics about the document
export const getTextStatsTool = tool({
  description: 'Get detailed statistics about the document: word count, character count, sentence count, paragraph count, average sentence length, reading time. Use this when user asks "how many words", "count the words", "document stats", or "reading time".',
  inputSchema: z.object({
    includeSpaces: z.boolean().optional().default(true).describe('Include spaces in character count'),
  }),
  execute: async ({ includeSpaces }) => {
    return {
      includeSpaces,
      timestamp: new Date().toISOString(),
      status: 'ready_to_count',
      message: 'Text statistics tool activated. Ready to analyze document...',
    };
  },
});

// Find String Tool - Find all occurrences of a string
export const findStringTool = tool({
  description: 'Find all occurrences of a specific word or phrase in the document. Returns count and locations. Use when user asks "how many times does X appear", "find all instances of", or "search for". CRITICAL: This tool can COUNT accurately - you cannot count reliably without it!',
  inputSchema: z.object({
    searchTerm: z.string().describe('The word or phrase to search for'),
    caseSensitive: z.boolean().optional().default(false).describe('Whether to match case exactly'),
    wholeWord: z.boolean().optional().default(false).describe('Whether to match whole words only'),
  }),
  execute: async ({ searchTerm, caseSensitive, wholeWord }) => {
    return {
      searchTerm,
      caseSensitive,
      wholeWord,
      timestamp: new Date().toISOString(),
      status: 'ready_to_search',
      message: `Find tool activated. Ready to search for "${searchTerm}"...`,
    };
  },
});

// Readability Analysis Tool - Analyze document readability
export const analyzeReadabilityTool = tool({
  description: 'Analyze document readability using Flesch Reading Ease score, Flesch-Kincaid Grade Level, and other metrics. Use when user asks "how readable is this", "what grade level", or "readability score".',
  inputSchema: z.object({
    detailed: z.boolean().optional().default(false).describe('Include detailed breakdown of complex words, long sentences, etc.'),
  }),
  execute: async ({ detailed }) => {
    return {
      detailed,
      timestamp: new Date().toISOString(),
      status: 'ready_to_analyze',
      message: 'Readability analysis tool activated. Ready to analyze...',
    };
  },
});

// Extract Headings Tool - Get document structure/outline
export const extractHeadingsTool = tool({
  description: 'Extract all headings from the document to create an outline or table of contents. Shows heading hierarchy (H1, H2, H3). Use when user asks "show me the outline", "what are the sections", or "table of contents".',
  inputSchema: z.object({
    maxLevel: z.number().optional().default(6).describe('Maximum heading level to include (1-6)'),
  }),
  execute: async ({ maxLevel }) => {
    return {
      maxLevel,
      timestamp: new Date().toISOString(),
      status: 'ready_to_extract',
      message: 'Heading extraction tool activated. Ready to extract structure...',
    };
  },
});

// Find and Replace Tool - Replace all occurrences of a string
export const findAndReplaceTool = tool({
  description: 'Find and replace all occurrences of a word or phrase in the document. More precise than editing manually. Use when user asks "replace all X with Y" or "change every instance of".',
  inputSchema: z.object({
    find: z.string().describe('The text to find'),
    replace: z.string().describe('The text to replace it with'),
    caseSensitive: z.boolean().optional().default(false).describe('Whether to match case exactly'),
    wholeWord: z.boolean().optional().default(false).describe('Whether to match whole words only'),
  }),
  execute: async ({ find, replace, caseSensitive, wholeWord }) => {
    return {
      find,
      replace,
      caseSensitive,
      wholeWord,
      timestamp: new Date().toISOString(),
      status: 'ready_to_replace',
      message: `Find and replace tool activated. Ready to replace "${find}" with "${replace}"...`,
    };
  },
});

// Generate Table of Contents Tool - Auto-generate TOC from headings
export const generateTOCTool = tool({
  description: 'Automatically generate a formatted table of contents from document headings. Includes section numbers and page links. Use when user asks "create a table of contents" or "add a TOC".',
  inputSchema: z.object({
    numbered: z.boolean().optional().default(true).describe('Include section numbers (1.1, 1.2, etc.)'),
    maxLevel: z.number().optional().default(3).describe('Maximum heading level to include (1-6)'),
    style: z.enum(['markdown', 'html', 'plain']).optional().default('markdown').describe('Output format for TOC'),
  }),
  execute: async ({ numbered, maxLevel, style }) => {
    return {
      numbered,
      maxLevel,
      style,
      timestamp: new Date().toISOString(),
      status: 'ready_to_generate',
      message: 'TOC generator activated. Ready to create table of contents...',
    };
  },
});

// Duplicate Detection Tool - Find repeated sentences or paragraphs
export const findDuplicatesTool = tool({
  description: 'Find duplicate or near-duplicate sentences and paragraphs in the document. Helps identify redundant content. Use when user asks "find duplicates", "any repeated content", or "check for redundancy".',
  inputSchema: z.object({
    sensitivity: z.enum(['exact', 'high', 'medium', 'low']).optional().default('high').describe('How similar text must be to count as duplicate'),
    minLength: z.number().optional().default(10).describe('Minimum word count to check for duplicates'),
  }),
  execute: async ({ sensitivity, minLength }) => {
    return {
      sensitivity,
      minLength,
      timestamp: new Date().toISOString(),
      status: 'ready_to_scan',
      message: 'Duplicate detection tool activated. Ready to scan for redundancy...',
    };
  },
});

// =====================
// TEST PING TOOL (Simple Diagnostic)
// =====================
// REMOVED: testPingTool - Diagnostic tool no longer needed
// Tool calling system is stable and working correctly

// REMOVED: switchTabTool - Tab switching is handled directly by UI now
// Users can click tabs directly, no need for AI to call a tool for navigation
// This simplifies the tool ecosystem and reduces unnecessary tool calls

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

// Image Generation tool - OpenAI (DALL-E 3, GPT Image 1) or Google Gemini Imagen 3
export const generateImageTool = tool({
  description: 'Generate images using OpenAI (DALL-E 3 or GPT Image 1) or Google Gemini Imagen 3 via AI Gateway. Creates high-quality AI-generated images from text descriptions. GPT Image 1 is newest (~$0.02-0.19/img), DALL-E 3 is classic (~$0.04-0.08/img).',
  inputSchema: z.object({
    prompt: z.string().describe('The description of the image to generate'),
    provider: z.enum(['openai', 'gemini']).default('openai').describe('Image generation provider: openai (DALL-E 3 or GPT Image 1) or gemini (Imagen 3 via AI Gateway)'),
    openaiModel: z.enum(['dall-e-3', 'gpt-image-1']).optional().default('gpt-image-1').describe('OpenAI model: gpt-image-1 (newest, cheapest) or dall-e-3 (classic)'),
    geminiModel: z.enum(['imagen-3.0-generate-001', 'imagen-3.0-fast-generate-001']).optional().default('imagen-3.0-fast-generate-001').describe('Gemini model: fast or standard Imagen 3'),
    size: z.enum(['1024x1024', '1536x1536', '1792x1024', '1024x1792']).optional().default('1024x1024').describe('Image size (1536x1536 only for gpt-image-1)'),
    quality: z.enum(['low', 'standard', 'hd']).optional().default('standard').describe('Image quality: low/medium/high for gpt-image-1, standard/hd for dall-e-3'),
    style: z.enum(['vivid', 'natural']).optional().default('vivid').describe('Image style (only for DALL-E 3, ignored for gpt-image-1)'),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional().default('1:1').describe('Aspect ratio for Gemini (ignored for OpenAI)'),
  }),
  execute: async ({ prompt, provider, openaiModel, geminiModel, size, quality, style, aspectRatio }) => {
    const modelName = provider === 'openai'
      ? (openaiModel === 'gpt-image-1' ? 'GPT Image 1' : 'DALL-E 3')
      : `Gemini ${geminiModel?.includes('fast') ? 'Imagen 3 Fast' : 'Imagen 3'}`;

    return {
      prompt,
      provider,
      openaiModel,
      geminiModel,
      size,
      quality,
      style,
      aspectRatio,
      status: 'ready_to_generate',
      message: `Ready to generate image with ${modelName}. Check the Images tab or widget below.`,
    };
  },
});

// Image Editing tool - Google Gemini Flash for AI-powered image editing
export const editImageTool = tool({
  description: 'Edit existing images using Google Gemini Flash (Imagen 3). Apply AI-powered modifications, add elements, change styles, or transform images based on text instructions.',
  inputSchema: z.object({
    prompt: z.string().describe('Instructions for how to edit the image'),
    referenceImageUrl: z.string().describe('URL or base64 data URL of the image to edit'),
    editType: z.enum(['general', 'inpaint', 'outpaint', 'style']).optional().default('general').describe('Type of edit: general modifications, inpainting (add/remove objects), outpainting (extend image), or style transfer'),
  }),
  execute: async ({ prompt, referenceImageUrl, editType }) => {
    return {
      prompt,
      referenceImageUrl,
      editType,
      status: 'ready_to_edit',
      message: 'Ready to edit image with Gemini Flash. Check the Images tab or widget below.',
    };
  },
});

// Background Removal tool - Remove background from images
export const removeBackgroundTool = tool({
  description: 'Remove the background from an image to create transparent PNGs. Useful for product photos, portraits, logos, and creating assets for web design.',
  inputSchema: z.object({
    imageUrl: z.string().describe('URL or base64 data URL of the image to process'),
  }),
  execute: async ({ imageUrl }) => {
    return {
      imageUrl,
      status: 'ready_to_remove_bg',
      message: 'Ready to remove background. Check the Images tab or widget below.',
    };
  },
});

// Reverse Image Search tool - Find similar images or identify objects
export const reverseImageSearchTool = tool({
  description: 'Perform reverse image search to find similar images, identify objects, or discover the source of an image. Uses Google Vision API, SerpAPI, or TinEye.',
  inputSchema: z.object({
    imageUrl: z.string().describe('URL or base64 data URL of the image to search'),
  }),
  execute: async ({ imageUrl }) => {
    return {
      imageUrl,
      status: 'ready_to_search',
      message: 'Ready to search for similar images. Check the Images tab or widget below.',
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
  // REMOVED: generateHTML - Replaced by editCodeWithMorph (works on empty files too!)
  // REMOVED: viewEditorCode - Code is automatically in system prompt
  // REMOVED: editCode - Was too complex, replaced by editCodeWithMorph
  // REMOVED: updateSectionHtml - Replaced by editCodeWithMorph
  // REMOVED: updateSectionCss - Replaced by editCodeWithMorph
  // REMOVED: updateSectionJs - Replaced by editCodeWithMorph
  // REMOVED: updateSectionPhp - Replaced by editCodeWithMorph (file='php')
  // REMOVED: testPing - Diagnostic tool no longer needed
  editCodeWithMorph: editCodeWithMorphTool,  // ⭐ THE ONLY CODE TOOL - handles everything!
  editDocumentWithMorph: editDocumentWithMorphTool, // ⭐ THE ONLY DOCUMENT TOOL - handles everything!
  // Document Analysis Tools
  getTextStats: getTextStatsTool,            // ⭐ Word count, reading time, statistics
  findString: findStringTool,                // ⭐ Find occurrences of text
  analyzeReadability: analyzeReadabilityTool, // ⭐ Flesch score, grade level
  extractHeadings: extractHeadingsTool,      // ⭐ Document outline/structure
  // Document Utility Tools
  findAndReplace: findAndReplaceTool,        // ⭐ Replace all occurrences
  generateTOC: generateTOCTool,              // ⭐ Auto-generate table of contents
  findDuplicates: findDuplicatesTool,        // ⭐ Detect redundant content
  // REMOVED: switchTab - Tab navigation handled by UI, not tools
  planSteps: planStepsTool,                 // ⭐ Multi-step planning tool
  updateStepProgress: updateStepProgressTool, // ⭐ Step progress tracking
  planBlogTopics: planBlogTopicsTool,
  writeBlogPost: writeBlogPostTool,
  generateImage: generateImageTool,          // ⭐ AI image generation
  editImage: editImageTool,                  // ⭐ AI image editing
  removeBackground: removeBackgroundTool,    // ⭐ Background removal
  reverseImageSearch: reverseImageSearchTool, // ⭐ Reverse image search
};
