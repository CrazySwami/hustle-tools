/**
 * Unified Project Generation - Streaming Utilities
 *
 * Centralized streaming logic for real-time code generation.
 * Handles fetch requests, stream parsing, and file updates.
 */

import type {
  ProjectType,
  GenerateProjectRequest,
  ParsedFiles,
  OnProjectUpdate,
  OnProjectMetadataUpdate,
  ProgressPhase
} from './types';
import { parseProjectCode, extractProjectMetadata, extractUsageMetadata } from './parser';

/**
 * Stream generation progress callback
 */
export type OnStreamProgress = (phase: ProgressPhase, message?: string, bytesReceived?: number) => void;

/**
 * Stream file update callback (called as files are parsed incrementally)
 */
export type OnStreamFileUpdate = (files: Partial<ParsedFiles>) => void;

/**
 * Stream complete callback
 */
export type OnStreamComplete = (result: {
  files: ParsedFiles;
  metadata: Record<string, any>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}) => void;

/**
 * Stream error callback
 */
export type OnStreamError = (error: string) => void;

/**
 * Streaming generation options
 */
export interface StreamGenerationOptions {
  projectType: ProjectType;
  projectName: string;
  description: string;
  subtype?: string;
  images?: Array<{ url: string; filename: string }>;
  model?: string;
  globalCSS?: string;

  onProgress?: OnStreamProgress;
  onFileUpdate?: OnStreamFileUpdate;
  onComplete?: OnStreamComplete;
  onError?: OnStreamError;

  // AbortController for cancellation
  signal?: AbortSignal;
}

/**
 * Start streaming generation
 *
 * This function handles:
 * 1. Making the API request
 * 2. Streaming the response
 * 3. Parsing code blocks as they arrive
 * 4. Calling callbacks for progress/updates
 * 5. Handling errors and completion
 *
 * @param options - Generation options
 * @returns Promise that resolves when streaming completes
 */
export async function streamProjectGeneration(
  options: StreamGenerationOptions
): Promise<void> {
  const {
    projectType,
    projectName,
    description,
    subtype,
    images = [],
    model = 'anthropic/claude-sonnet-4-5-20250929',
    globalCSS,
    onProgress,
    onFileUpdate,
    onComplete,
    onError,
    signal
  } = options;

  try {
    // Emit progress: starting
    onProgress?.('analyzing', 'Analyzing request...');

    // Build request body
    const requestBody: GenerateProjectRequest = {
      projectType,
      projectName,
      description,
      subtype,
      images: images.length > 0 ? images : undefined,
      model,
    };

    // Add globalCSS if provided (for HTML/HubSpot projects)
    if (globalCSS && (projectType === 'html' || projectType === 'hubspot')) {
      (requestBody as any).globalCSS = globalCSS;
    }

    // Add hubspotModuleType if HubSpot
    if (projectType === 'hubspot' && subtype) {
      (requestBody as any).hubspotModuleType = subtype;
    }

    // Emit progress: generating
    onProgress?.('generating', 'Generating code...');

    // Make API request
    const response = await fetch('/api/generate-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Generation failed');
    }

    // Stream the response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let fullCode = '';
    let bytesReceived = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode chunk
      const chunk = decoder.decode(value);
      fullCode += chunk;
      bytesReceived += value.length;

      // Update progress with bytes received
      onProgress?.('generating', `Receiving code... (${Math.round(bytesReceived / 1024)} KB)`, bytesReceived);

      // Parse incrementally and update files
      const parsedFiles = parseProjectCode(fullCode, projectType, subtype);
      onFileUpdate?.(parsedFiles);
    }

    // Emit progress: parsing
    onProgress?.('parsing', 'Parsing response...');

    // Extract usage metadata (if present)
    const { code: cleanCode, usage, model: usedModel } = extractUsageMetadata(fullCode);

    // Final parse
    const finalFiles = parseProjectCode(cleanCode, projectType, subtype);

    // Extract metadata
    const metadata = extractProjectMetadata(finalFiles, projectType, subtype);

    // Emit progress: complete
    onProgress?.('complete', 'Generation complete!');

    // Call completion callback
    onComplete?.({
      files: finalFiles,
      metadata,
      usage,
      model: usedModel
    });

  } catch (error: any) {
    console.error('Stream generation error:', error);

    if (error.name === 'AbortError') {
      onError?.('Generation cancelled');
    } else {
      onError?.(error.message || 'Generation failed');
    }

    throw error;
  }
}

/**
 * Legacy adapter: Stream generation with callback-based updates
 *
 * This adapter connects the new streaming system to the old callback pattern
 * used by GenerateProjectWidget and GenerateProjectModal.
 *
 * @param options - Generation options
 * @param projectId - Existing project ID
 * @param callbacks - Legacy callbacks
 */
export async function streamWithLegacyCallbacks(
  options: Omit<StreamGenerationOptions, 'onProgress' | 'onFileUpdate' | 'onComplete' | 'onError'>,
  projectId: string,
  callbacks: {
    onProjectUpdate?: OnProjectUpdate;
    onProjectMetadataUpdate?: OnProjectMetadataUpdate;
    onProjectStateUpdate?: (projectId: string, state: 'generating' | 'ready' | 'error', error?: string) => void;
    onSwitchCodeTab?: (tab: 'html' | 'css' | 'js' | 'php' | 'hubl') => void;
    setProgress?: (message: string) => void;
    setCurrentPhase?: (phase: 'html' | 'css' | 'js' | 'php' | 'hubl' | null) => void;
  }
): Promise<void> {
  const {
    onProjectUpdate,
    onProjectMetadataUpdate,
    onProjectStateUpdate,
    onSwitchCodeTab,
    setProgress,
    setCurrentPhase
  } = callbacks;

  // Track which files we've already updated to avoid redundant calls
  const updatedFiles = new Set<string>();

  await streamProjectGeneration({
    ...options,

    onProgress: (phase, message) => {
      if (setProgress) {
        setProgress(message || phase);
      }

      // Map progress phase to file type for tab switching
      if (phase === 'generating' && setCurrentPhase) {
        if (options.projectType === 'elementor') {
          setCurrentPhase('php');
        } else if (options.projectType === 'hubspot') {
          setCurrentPhase('html');
        } else {
          setCurrentPhase('html');
        }
      }
    },

    onFileUpdate: (files) => {
      // Update files incrementally as they're parsed
      if (!onProjectUpdate && !onProjectMetadataUpdate) return;

      if (options.projectType === 'elementor') {
        // Elementor: Update plugin files via metadata
        if (files.pluginMainFile && !updatedFiles.has('pluginMainFile') && onProjectMetadataUpdate) {
          onProjectMetadataUpdate(projectId, {
            isPlugin: true,
            pluginMainFile: files.pluginMainFile
          });
          updatedFiles.add('pluginMainFile');
        }

        if (files.php && onProjectMetadataUpdate) {
          // Extract widget metadata
          const classNameMatch = files.php.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends/);
          const className = classNameMatch ? classNameMatch[1] : 'Generated_Widget';
          const widgetSlug = className.toLowerCase().replace(/_/g, '-');
          const widgetName = className.replace(/_/g, ' ').replace(/\bWidget\b/, '').trim()
            || options.projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          const widgetId = `widget_${Date.now()}`;

          onProjectMetadataUpdate(projectId, {
            widgetFiles: {
              [widgetId]: {
                name: widgetName,
                slug: widgetSlug,
                content: files.php,
                className: className,
              }
            }
          });
          updatedFiles.add('widget');
        }
      } else if (options.projectType === 'hubspot') {
        // HubSpot: Update HTML and HubL
        if (files.html && !updatedFiles.has('html') && onProjectUpdate) {
          onProjectUpdate(projectId, 'html', files.html);
          updatedFiles.add('html');
        }
        if (files.hubl && !updatedFiles.has('hubl') && onProjectUpdate) {
          onProjectUpdate(projectId, 'hubl', files.hubl);
          updatedFiles.add('hubl');
        }
      } else {
        // HTML: Update HTML, CSS, JS
        if (files.html && !updatedFiles.has('html') && onProjectUpdate) {
          onProjectUpdate(projectId, 'html', files.html);
          updatedFiles.add('html');
        }
        if (files.css && !updatedFiles.has('css') && onProjectUpdate) {
          onProjectUpdate(projectId, 'css', files.css);
          updatedFiles.add('css');

          // Auto-switch to CSS tab
          if (setCurrentPhase) setCurrentPhase('css');
          onSwitchCodeTab?.('css');
        }
        if (files.js && !updatedFiles.has('js') && onProjectUpdate) {
          onProjectUpdate(projectId, 'js', files.js);
          updatedFiles.add('js');

          // Auto-switch to JS tab
          if (setCurrentPhase) setCurrentPhase('js');
          onSwitchCodeTab?.('js');
        }
      }
    },

    onComplete: (result) => {
      if (setProgress) {
        setProgress('✅ Generation complete!');
      }

      if (onProjectStateUpdate) {
        onProjectStateUpdate(projectId, 'ready');
      }

      console.log('✅ Generation complete:', {
        files: Object.keys(result.files),
        metadata: Object.keys(result.metadata),
        usage: result.usage
      });
    },

    onError: (error) => {
      if (setProgress) {
        setProgress(`❌ Error: ${error}`);
      }

      if (onProjectStateUpdate) {
        onProjectStateUpdate(projectId, 'error', error);
      }

      console.error('❌ Generation error:', error);
    }
  });
}

/**
 * Build user prompt for generation
 *
 * @param projectType - Type of project
 * @param projectName - Name of project
 * @param description - User description
 * @param globalCSS - Optional global CSS reference
 * @returns Formatted user prompt
 */
export function buildUserPrompt(
  projectType: ProjectType,
  projectName: string,
  description: string,
  globalCSS?: string
): string {
  const isElementor = projectType === 'elementor';
  const isHubSpot = projectType === 'hubspot';

  if (isElementor) {
    return `Create a complete Elementor widget for: ${description}

**Widget Name**: ${projectName}
**Class Name**: Elementor_${projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_')}_Widget
**Widget ID**: ${projectName}
**Title**: ${projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}

${globalCSS ? `**Global CSS Reference** (for consistent styling):\n\`\`\`css\n${globalCSS}\n\`\`\`\n\nUse these styles for colors, typography, and design consistency.\n\n` : ''}

Generate **TWO PHP FILES** for a complete WordPress plugin.

Be comprehensive - this widget should be production-ready and fully customizable through Elementor's interface.`;
  }

  if (isHubSpot) {
    return `Create a HubSpot module for: ${description}

**Project Name**: ${projectName}

${globalCSS ? `**Global CSS Reference** (for inspiration and consistency):\n\`\`\`css\n${globalCSS}\n\`\`\`\n` : ''}

Generate the code in TWO PARTS:
1. **HTML** - Module markup
2. **HubL** - Tokenization (or empty placeholder)`;
  }

  // HTML project
  return `Create a ${projectType} for: ${description}

**Project Name**: ${projectName}
**Type**: ${projectType}

${globalCSS ? `**Global CSS Reference** (for maintaining consistent styling):\n\`\`\`css\n${globalCSS}\n\`\`\`\n\nUse these styles as reference for colors, fonts, and design patterns.\n\n` : ''}

Generate the code in THREE PARTS (in order):
1. **HTML** - Complete markup
2. **CSS** - Complete styles
3. **JavaScript** - Complete functionality (if needed, otherwise return empty)

Start with HTML, then CSS, then JS. Be comprehensive and production-ready.`;
}

/**
 * Create AbortController for cancellation
 */
export function createCancellableStream(): {
  controller: AbortController;
  signal: AbortSignal;
  cancel: () => void;
} {
  const controller = new AbortController();

  return {
    controller,
    signal: controller.signal,
    cancel: () => controller.abort()
  };
}
