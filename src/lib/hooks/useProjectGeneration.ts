/**
 * Unified Project Generation - React Hook
 *
 * Reusable hook for all project generation (HTML, Elementor, HubSpot).
 * Handles state management, streaming, and callbacks.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  ProjectType,
  GenerateParams,
  UseProjectGenerationReturn,
  ProgressPhase,
  ParsedFiles
} from '../project-generation/types';
import {
  streamProjectGeneration,
  createCancellableStream,
  type StreamGenerationOptions
} from '../project-generation/streaming';

/**
 * Hook options
 */
export interface UseProjectGenerationOptions {
  /**
   * Default model to use
   */
  defaultModel?: string;

  /**
   * Auto-reset state after completion
   */
  autoReset?: boolean;

  /**
   * Auto-reset delay in milliseconds (default: 3000)
   */
  autoResetDelay?: number;
}

/**
 * Unified project generation hook
 *
 * @example
 * ```tsx
 * const { generate, isGenerating, progress, parsedFiles, error } = useProjectGeneration({
 *   defaultModel: 'anthropic/claude-sonnet-4-5-20250929'
 * });
 *
 * // Start generation
 * await generate({
 *   projectType: 'html',
 *   projectName: 'my-project',
 *   description: 'Create a hero section with CTA button'
 * });
 * ```
 */
export function useProjectGeneration(
  options: UseProjectGenerationOptions = {}
): UseProjectGenerationReturn {
  const {
    defaultModel = 'anthropic/claude-sonnet-4-5-20250929',
    autoReset = false,
    autoResetDelay = 3000
  } = options;

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ phase: ProgressPhase; message?: string }>({
    phase: 'analyzing'
  });
  const [error, setError] = useState<string | null>(null);
  const [parsedFiles, setParsedFiles] = useState<ParsedFiles | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [bytesReceived, setBytesReceived] = useState(0);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Cancel ongoing generation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setError('Generation cancelled');
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress({ phase: 'analyzing' });
    setError(null);
    setParsedFiles(null);
    setProjectId(null);
    setBytesReceived(0);

    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
      autoResetTimeoutRef.current = null;
    }
  }, []);

  /**
   * Start generation
   */
  const generate = useCallback(async (params: Omit<GenerateParams, 'onProgress' | 'onFilesParsed' | 'onComplete' | 'onError'>) => {
    // Reset state
    reset();
    setIsGenerating(true);
    setError(null);
    setParsedFiles(null);
    setBytesReceived(0);

    // Create abort controller
    const { controller, signal } = createCancellableStream();
    abortControllerRef.current = controller;

    try {
      const streamOptions: StreamGenerationOptions = {
        projectType: params.projectType,
        projectName: params.projectName,
        description: params.description,
        subtype: params.subtype,
        images: params.images,
        model: params.model || defaultModel,
        signal,

        onProgress: (phase, message, bytes) => {
          setProgress({ phase, message });
          if (bytes !== undefined) {
            setBytesReceived(bytes);
          }
        },

        onFileUpdate: (files) => {
          setParsedFiles(prev => ({ ...prev, ...files }));
        },

        onComplete: (result) => {
          setParsedFiles(result.files);
          setProgress({ phase: 'complete', message: 'Generation complete!' });
          setIsGenerating(false);

          // Log usage info
          if (result.usage) {
            console.log('📊 Generation usage:', {
              promptTokens: result.usage.promptTokens,
              completionTokens: result.usage.completionTokens,
              totalTokens: result.usage.totalTokens,
              model: result.model
            });
          }

          // Auto-reset if enabled
          if (autoReset) {
            autoResetTimeoutRef.current = setTimeout(reset, autoResetDelay);
          }
        },

        onError: (errorMessage) => {
          setError(errorMessage);
          setIsGenerating(false);
          setProgress({ phase: 'analyzing', message: undefined });
        }
      };

      await streamProjectGeneration(streamOptions);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Generation failed');
        setIsGenerating(false);
        console.error('Generation error:', err);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [defaultModel, autoReset, autoResetDelay, reset]);

  return {
    generate,
    isGenerating,
    progress,
    error,
    parsedFiles,
    projectId,
    cancel
  };
}

/**
 * Hook for monitoring generation progress
 *
 * Returns formatted progress information for display
 */
export function useGenerationProgress(progress: { phase: ProgressPhase; message?: string }, bytesReceived?: number) {
  // Format phase as human-readable string
  const getPhaseLabel = (phase: ProgressPhase): string => {
    switch (phase) {
      case 'analyzing': return 'Analyzing request...';
      case 'planning': return 'Planning structure...';
      case 'generating': return 'Generating code...';
      case 'parsing': return 'Parsing response...';
      case 'complete': return 'Complete!';
      default: return 'Processing...';
    }
  };

  // Calculate progress percentage (rough estimate)
  const getProgressPercentage = (phase: ProgressPhase): number => {
    switch (phase) {
      case 'analyzing': return 10;
      case 'planning': return 20;
      case 'generating': return 60;
      case 'parsing': return 90;
      case 'complete': return 100;
      default: return 0;
    }
  };

  // Format bytes received
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return {
    label: progress.message || getPhaseLabel(progress.phase),
    percentage: getProgressPercentage(progress.phase),
    phase: progress.phase,
    bytesReceived: bytesReceived ? formatBytes(bytesReceived) : undefined
  };
}

/**
 * Hook for file preview
 *
 * Returns formatted file information for display
 */
export function useFilePreview(files: ParsedFiles | null) {
  if (!files) {
    return { hasFiles: false, fileList: [], totalSize: 0 };
  }

  const fileList = Object.entries(files)
    .filter(([_, content]) => content !== undefined && content !== '')
    .map(([type, content]) => ({
      type: type as keyof ParsedFiles,
      size: content!.length,
      lines: content!.split('\n').length,
      preview: content!.substring(0, 100) + (content!.length > 100 ? '...' : '')
    }));

  const totalSize = fileList.reduce((sum, file) => sum + file.size, 0);

  return {
    hasFiles: fileList.length > 0,
    fileList,
    totalSize
  };
}
