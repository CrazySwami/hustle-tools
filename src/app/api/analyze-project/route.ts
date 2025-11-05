/**
 * Project Analysis API Route
 *
 * Uses Gemini 2.5 Flash via Vercel AI SDK to analyze all files in a project
 * and generate a comprehensive Markdown manifest explaining what each file does.
 *
 * POST /api/analyze-project
 * Body: { projectId, projectType, files: { html?, css?, js?, php?, hubl?, widgetFiles? } }
 * Returns: { manifest: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';

interface AnalyzeProjectRequest {
  projectId: string;
  projectName: string;
  projectType: 'html' | 'php' | 'hubspot';
  isPlugin?: boolean;
  files: {
    html?: string;
    css?: string;
    js?: string;
    php?: string;
    hubl?: string;
    pluginMainFile?: string;
    widgetFiles?: {
      [widgetId: string]: {
        name: string;
        slug: string;
        content: string;
        className: string;
      }
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeProjectRequest = await request.json();
    const { projectName, projectType, isPlugin, files } = body;

    if (!process.env.AI_GATEWAY_API_KEY) {
      return NextResponse.json(
        { error: 'AI_GATEWAY_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 Analyzing project:', {
      projectName,
      projectType,
      isPlugin,
      fileCount: Object.keys(files).length,
      hasWidgetFiles: !!files.widgetFiles,
      widgetCount: files.widgetFiles ? Object.keys(files.widgetFiles).length : 0
    });

    // Build the analysis prompt
    const prompt = buildAnalysisPrompt(projectName, projectType, isPlugin || false, files);

    console.log('🔍 Starting streaming analysis for project:', projectName);

    // Call Gemini Flash via Vercel AI SDK with streaming
    // AI Gateway is configured automatically at environment level
    const result = await streamText({
      model: 'google/gemini-2.5-flash',
      prompt: prompt,
    });

    // Return streaming response
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('❌ Project analysis failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze project' },
      { status: 500 }
    );
  }
}

/**
 * Build the Gemini prompt for project analysis
 */
function buildAnalysisPrompt(
  projectName: string,
  projectType: 'html' | 'php' | 'hubspot',
  isPlugin: boolean,
  files: AnalyzeProjectRequest['files']
): string {
  const fileList: string[] = [];

  // Add files to the list with content
  if (files.html) {
    fileList.push(`### index.html\n\`\`\`html\n${files.html}\n\`\`\``);
  }
  if (files.css) {
    fileList.push(`### styles.css\n\`\`\`css\n${files.css}\n\`\`\``);
  }
  if (files.js) {
    fileList.push(`### script.js\n\`\`\`javascript\n${files.js}\n\`\`\``);
  }
  if (files.hubl) {
    fileList.push(`### template.hubl\n\`\`\`jinja\n${files.hubl}\n\`\`\``);
  }
  if (files.php) {
    fileList.push(`### widget.php\n\`\`\`php\n${files.php}\n\`\`\``);
  }
  if (files.pluginMainFile) {
    fileList.push(`### main-plugin.php\n\`\`\`php\n${files.pluginMainFile}\n\`\`\``);
  }
  if (files.widgetFiles) {
    Object.entries(files.widgetFiles).forEach(([widgetId, widget]) => {
      fileList.push(`### ${widget.slug}.php (${widget.name})\n\`\`\`php\n${widget.content}\n\`\`\``);
    });
  }

  const projectTypeDescription = isPlugin
    ? 'WordPress Elementor plugin with multiple widgets'
    : projectType === 'html'
    ? 'HTML project with HTML, CSS, and JavaScript'
    : projectType === 'hubspot'
    ? 'HubSpot CMS template with HTML, CSS, JavaScript, and HubL'
    : 'WordPress Elementor widget with HTML, CSS, JavaScript, and PHP';

  return `You are a technical documentation expert. Analyze the following project files and generate a comprehensive Markdown manifest.

**Project Name:** ${projectName}
**Project Type:** ${projectTypeDescription}

**Requirements:**
1. Create a professional Markdown document with clear structure
2. Include an "Overview" section summarizing what this project does
3. Include a "File Structure" section with subsections for each file
4. For each file, explain:
   - What the file does
   - Key features or functionality it implements
   - How it interacts with other files (if applicable)
   - Any important technical details (classes, functions, patterns used)
5. ${isPlugin ? 'Explain how the plugin auto-registration system works' : 'Explain how the files work together'}
6. Include a "Usage" section explaining how to use this project
7. End with a footer note that includes today's date and mentions that this documentation can be manually edited or regenerated

**Files to Analyze:**

${fileList.join('\n\n')}

**Output Format:**
Generate ONLY the Markdown content. Do NOT include any preamble, explanations, or meta-commentary. Start directly with "# Project Documentation".

Keep the documentation concise but comprehensive - aim for 200-400 words per file, focusing on what the code actually does rather than generic descriptions.`;
}
