/**
 * Unified Project Generation - Type Definitions
 *
 * Centralized TypeScript interfaces for all project generation types.
 * This ensures type safety across HTML, Elementor, and HubSpot generation.
 */

/**
 * Supported project types
 */
export type ProjectType = 'html' | 'elementor' | 'hubspot';

/**
 * Generation states for loading UI
 */
export type GenerationState = 'idle' | 'generating' | 'ready' | 'error';

/**
 * Progress phases during generation
 */
export type ProgressPhase =
  | 'analyzing'      // Analyzing user request
  | 'planning'       // Planning code structure
  | 'generating'     // Generating code
  | 'parsing'        // Parsing response
  | 'complete';      // Generation complete

/**
 * Parsed files from AI response
 */
export interface ParsedFiles {
  html?: string;
  css?: string;
  js?: string;
  php?: string;
  pluginMainFile?: string;
  widgetFiles?: Record<string, {
    name: string;
    slug: string;
    content: string;
    className: string;
  }>;
  hubl?: string;
  json?: string;
  files?: Record<string, string | undefined>;
}

/**
 * Project subtype configuration (e.g., HubSpot email vs page)
 */
export interface SubtypeConfig {
  name: string;
  label: string;
  systemPromptAddition: string;
  icon?: string;
}

/**
 * Model configuration
 */
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  pricing?: {
    input: number;   // per 1M tokens
    output: number;  // per 1M tokens
  };
}

/**
 * Core project configuration
 * Single source of truth for each project type
 */
export interface ProjectFileDescriptor {
  id: string;
  label?: string;
  type?: 'html' | 'css' | 'js' | 'php' | 'hubl' | 'docs' | string;
  language?: string;
  extension?: string;
  order?: number;
  initialContent?: string;
}

export interface ProjectConfig {
  name: string;
  label: string;
  icon: string;
  fileTypes: Array<string | ProjectFileDescriptor>;
  defaultModel: string;

  /**
   * System prompt template
   * Use {{DESCRIPTION}} placeholder for user input
   * Use {{SUBTYPE_CONTEXT}} for subtype-specific additions
   */
  systemPrompt: string;

  /**
   * Optional subtypes (e.g., HubSpot email vs page)
   */
  subtypes?: SubtypeConfig[];

  /**
   * Parse AI response into structured files
   */
  parseResponse: (code: string) => ParsedFiles;

  /**
   * Extract metadata from parsed files (e.g., widget class name)
   */
  extractMetadata?: (files: ParsedFiles) => Record<string, any>;

  /**
   * Optional preview configuration
   */
  preview?: {
    enabled: boolean;
    url?: string;
    openInNewTab?: boolean;
  };

  /**
   * Optional deployment configuration
   */
  deployment?: {
    enabled: boolean;
    targets: Array<'wordpress' | 'hubspot' | 'custom'>;
  };
}

/**
 * Parameters for project generation
 */
export interface GenerateParams {
  projectType: ProjectType;
  projectName: string;
  description: string;
  subtype?: string;
  images?: string[];  // Base64 image data URLs
  model?: string;     // Optional model override
  onProgress?: (phase: ProgressPhase, message?: string) => void;
  onFilesParsed?: (files: ParsedFiles) => void;
  onComplete?: (projectId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Streaming options
 */
export interface StreamingOptions {
  method: 'POST';
  headers: {
    'Content-Type': 'application/json';
  };
  body: string;
}

/**
 * Generation state hook return type
 */
export interface UseProjectGenerationReturn {
  generate: (params: Omit<GenerateParams, 'onProgress' | 'onFilesParsed' | 'onComplete' | 'onError'>) => Promise<void>;
  isGenerating: boolean;
  progress: {
    phase: ProgressPhase;
    message?: string;
  };
  error: string | null;
  parsedFiles: ParsedFiles | null;
  projectId: string | null;
  cancel: () => void;
}

/**
 * API request body
 */
export interface GenerateProjectRequest {
  projectType: ProjectType;
  projectName: string;
  description: string;
  subtype?: string;
  images?: string[];
  model?: string;
}

/**
 * API response events (streamed)
 */
export type GenerateProjectEvent =
  | { type: 'progress'; phase: ProgressPhase; message?: string }
  | { type: 'code'; content: string }
  | { type: 'complete'; files: ParsedFiles; metadata?: Record<string, any> }
  | { type: 'error'; error: string };

/**
 * File update callback signature
 */
export type OnProjectUpdate = (
  projectId: string,
  fileType: string,
  content: string
) => void;

/**
 * Metadata update callback signature
 */
export type OnProjectMetadataUpdate = (
  projectId: string,
  metadata: Record<string, any>
) => void;

/**
 * Project state update callback signature
 */
export type OnProjectStateUpdate = (
  projectId: string,
  state: GenerationState,
  error?: string
) => void;

/**
 * Project creation callback signature
 */
export type OnProjectCreate = (
  name: string,
  type: 'html' | 'php' | 'hubspot',
  generationState?: GenerationState
) => string; // Returns project ID
