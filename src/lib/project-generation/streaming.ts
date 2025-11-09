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
  targetWidgetId?: string;

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

      // Decode chunk with stream: true to handle multi-byte characters across boundaries
      const chunk = decoder.decode(value, { stream: true });
      fullCode += chunk;
      bytesReceived += value.length;

      // Update progress with bytes received
      onProgress?.('generating', `Receiving code... (${Math.round(bytesReceived / 1024)} KB)`, bytesReceived);

      // Parse incrementally and update files
      const parsedFiles = parseProjectCode(fullCode, projectType, subtype);
      onFileUpdate?.(parsedFiles);
    }

    // Final decode to flush any remaining bytes
    const finalChunk = decoder.decode();
    if (finalChunk) {
      fullCode += finalChunk;
    }

    // Emit progress: parsing
    onProgress?.('parsing', 'Parsing response...');

    // Extract usage metadata (if present)
    const { code: cleanCode, usage, model: usedModel } = extractUsageMetadata(fullCode);

    // Debug: Log what we received
    console.log('📦 Received code length:', cleanCode.length);
    console.log('📦 First 500 chars:', cleanCode.substring(0, 500));
    console.log('📦 Last 500 chars:', cleanCode.substring(cleanCode.length - 500));
    console.log('📦 Has HTML block:', cleanCode.includes('```html'));
    console.log('📦 Has CSS block:', cleanCode.includes('```css'));
    console.log('📦 Has JS block:', cleanCode.includes('```js'));

    // Final parse
    const finalFiles = parseProjectCode(cleanCode, projectType, subtype);

    // Debug: Log what was parsed
    console.log('📦 Parsed HTML length:', finalFiles.html?.length || 0);
    console.log('📦 Parsed CSS length:', finalFiles.css?.length || 0);
    console.log('📦 Parsed JS length:', finalFiles.js?.length || 0);
    if (finalFiles.html) {
      console.log('📦 HTML preview:', finalFiles.html.substring(0, 200));
    }

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
    onSwitchCodeTab?: (tab: string) => void;
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

  // Track tab switches to avoid switching multiple times
  const switchedTabs = new Set<string>();
  // Keep a stable widget ID per generation so tabs don't reset mid-stream
  let generatedWidgetId: string | null = options.targetWidgetId || null;
  if (options.projectType === 'elementor' && generatedWidgetId) {
    console.log('[ElementorFlow] Streaming to existing widget slot:', generatedWidgetId);
  }

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
      // DO NOT deduplicate - we want real-time streaming updates!
      if (!onProjectUpdate && !onProjectMetadataUpdate) return;

      if (options.projectType === 'elementor') {
        if (files.php && onProjectMetadataUpdate) {
          // Extract widget metadata
          const classNameMatch = files.php.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends/);
          const className = classNameMatch ? classNameMatch[1] : 'Generated_Widget';
          const widgetSlug = className.toLowerCase().replace(/_/g, '-');
          const widgetName = className.replace(/_/g, ' ').replace(/\bWidget\b/, '').trim()
            || options.projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          if (!generatedWidgetId) {
            generatedWidgetId = options.targetWidgetId || `widget_${projectId}_pending`;
          }
          const widgetId = generatedWidgetId;
          if (options.targetWidgetId) {
            console.log('[ElementorFlow] Widget metadata uses target slot', { widgetId });
          }

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
        }

        if (files.php && onProjectUpdate) {
          if (!generatedWidgetId) {
            generatedWidgetId = options.targetWidgetId || `widget_${projectId}_pending`;
          }
          const widgetTabId = `widget:${generatedWidgetId}`;
          onProjectUpdate(projectId, widgetTabId, files.php);
          if (!switchedTabs.has(widgetTabId) && !options.targetWidgetId) {
            switchedTabs.add(widgetTabId);
            onSwitchCodeTab?.(widgetTabId);
          }
        }
      } else if (options.projectType === 'hubspot') {
        // HubSpot: Update HTML and HubL
        if (files.html && onProjectUpdate) {
          onProjectUpdate(projectId, 'html', files.html);
        }
        if (files.hubl && onProjectUpdate) {
          onProjectUpdate(projectId, 'hubl', files.hubl);
        }
      } else {
        // HTML: Update HTML, CSS, JS (allow incremental updates for streaming)
        if (files.html && onProjectUpdate) {
          onProjectUpdate(projectId, 'html', files.html);
        }

        if (files.css && onProjectUpdate) {
          // Always update file content (allows streaming)
          onProjectUpdate(projectId, 'css', files.css);

          // Only switch tab once
          if (!switchedTabs.has('css')) {
            switchedTabs.add('css');
            if (setCurrentPhase) setCurrentPhase('css');
            onSwitchCodeTab?.('css');
          }
        }

        if (files.js && onProjectUpdate) {
          // Always update file content (allows streaming)
          onProjectUpdate(projectId, 'js', files.js);

          // Only switch tab once
          if (!switchedTabs.has('js')) {
            switchedTabs.add('js');
            if (setCurrentPhase) setCurrentPhase('js');
            onSwitchCodeTab?.('js');
          }
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

/**
 * Sequential Streaming System
 *
 * Streams files sequentially with clear phase transitions:
 * HTML → CSS → JS (for HTML projects)
 * PHP → Widget Files → Docs (for Elementor projects)
 * HTML → HubL (for HubSpot projects)
 *
 * Benefits:
 * - Clear visual progression
 * - Auto-tab switching between phases
 * - Better user understanding
 * - Consistent with auto-run mode design
 */

export interface SequentialStreamOptions extends StreamGenerationOptions {
  /** Enable sequential streaming (default: false for backwards compatibility) */
  sequential?: boolean;

  /** Callback when phase changes (e.g., HTML → CSS) */
  onPhaseChange?: (fromPhase: string | null, toPhase: string) => void;
}

/**
 * Stream with sequential phase indicators
 *
 * This function enhances streamProjectGeneration with sequential streaming:
 * 1. Detects when each code block completes
 * 2. Calls onPhaseChange when transitioning between files
 * 3. Provides clearer progress indicators
 *
 * @param options - Sequential streaming options
 */
export async function streamSequential(
  options: SequentialStreamOptions
): Promise<void> {
  const {
    projectType,
    sequential = false,
    onProgress,
    onFileUpdate,
    onPhaseChange,
    ...restOptions
  } = options;

  // If sequential mode is disabled, fall back to normal streaming
  if (!sequential) {
    return streamProjectGeneration({ ...options, onProgress, onFileUpdate });
  }

  // Track current phase
  let currentPhase: string | null = null;
  let lastParsedFiles: Partial<ParsedFiles> = {};

  // Determine expected phases based on project type
  const getExpectedPhases = (): string[] => {
    if (projectType === 'elementor') {
      return ['pluginMainFile', 'php', 'docs'];
    } else if (projectType === 'hubspot') {
      return ['html', 'hubl'];
    } else {
      // HTML project
      return ['html', 'css', 'js'];
    }
  };

  const expectedPhases = getExpectedPhases();
  let currentPhaseIndex = 0;

  // Enhanced file update handler
  const sequentialFileUpdate = (files: Partial<ParsedFiles>) => {
    // Check which files have been newly completed
    const fileKeys = Object.keys(files) as (keyof ParsedFiles)[];

    for (const key of fileKeys) {
      const fileContent = files[key];
      const lastContent = lastParsedFiles[key];

      // If this file is new or has grown significantly, it might be a new phase
      if (fileContent && (!lastContent || fileContent.length > (lastContent as string).length + 100)) {
        const phaseMapping: Record<string, string> = {
          html: 'html',
          css: 'css',
          js: 'js',
          php: 'php',
          pluginMainFile: 'pluginMainFile',
          hubl: 'hubl',
          projectManifest: 'docs'
        };

        const newPhase = phaseMapping[key];

        if (newPhase && newPhase !== currentPhase) {
          // Phase transition detected
          const oldPhase = currentPhase;
          currentPhase = newPhase;

          // Notify phase change
          if (onPhaseChange) {
            onPhaseChange(oldPhase, newPhase);
          }

          // Update progress message
          const phaseLabels: Record<string, string> = {
            html: 'HTML',
            css: 'CSS',
            js: 'JavaScript',
            php: 'PHP Widget',
            pluginMainFile: 'Plugin Main File',
            hubl: 'HubL Module',
            docs: 'Documentation'
          };

          if (onProgress) {
            onProgress('generating', `Generating ${phaseLabels[newPhase]}...`);
          }

          currentPhaseIndex++;
        }
      }
    }

    // Update last parsed files
    lastParsedFiles = { ...lastParsedFiles, ...files };

    // Call original file update handler
    if (onFileUpdate) {
      onFileUpdate(files);
    }
  };

  // Start streaming with sequential handlers
  await streamProjectGeneration({
    ...restOptions,
    projectType,
    onProgress: (phase, message) => {
      // Initial phase
      if (phase === 'generating' && !currentPhase && expectedPhases.length > 0) {
        currentPhase = expectedPhases[0];
        if (onPhaseChange) {
          onPhaseChange(null, currentPhase);
        }
      }

      if (onProgress) {
        onProgress(phase, message);
      }
    },
    onFileUpdate: sequentialFileUpdate
  });
}

/**
 * Helper: Determine file phase from content
 *
 * Analyzes streamed content to determine which file is currently being generated.
 * This helps detect phase transitions early.
 *
 * @param content - Raw streamed content
 * @returns Detected phase or null
 */
export function detectPhaseFromContent(content: string): string | null {
  // Look for code block markers to identify phase
  const markers = [
    { regex: /```html\n/i, phase: 'html' },
    { regex: /```css\n/i, phase: 'css' },
    { regex: /```(?:javascript|js)\n/i, phase: 'js' },
    { regex: /```php\n.*?Plugin Name:/is, phase: 'pluginMainFile' },
    { regex: /```php\n.*?class.*?extends.*?Widget_Base/is, phase: 'php' },
    { regex: /```hubl\n/i, phase: 'hubl' },
    { regex: /```(?:markdown|md)\n/i, phase: 'docs' }
  ];

  for (const { regex, phase } of markers) {
    if (regex.test(content)) {
      return phase;
    }
  }

  return null;
}

/**
 * Helper: Get human-readable phase label
 */
export function getPhaseLabeledName(phase: string): string {
  const labels: Record<string, string> = {
    html: 'HTML',
    css: 'CSS',
    js: 'JavaScript',
    php: 'PHP Widget',
    pluginMainFile: 'Plugin Main File',
    hubl: 'HubL Module',
    docs: 'Documentation'
  };

  return labels[phase] || phase;
}
