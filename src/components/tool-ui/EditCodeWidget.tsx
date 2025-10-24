/**
 * EditCodeWidget Component
 *
 * Displays AI-powered code editing with diff preview:
 * - Fetches current code from editor
 * - Generates modified code using AI
 * - Shows Monaco DiffEditor with before/after
 * - Accept/Reject/Edit workflow
 * - Follows research best practices (full-file generation + diff visualization)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, RefreshCw } from 'lucide-react';
import { useEditorContent } from '@/hooks/useEditorContent';
import { DiffEditor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';

interface EditCodeWidgetProps {
  data: {
    fileType: 'html' | 'css' | 'js';
    instructions: string;
    reasoning?: string;
    status: string;
    timestamp: string;
  };
  onStreamUpdate?: (type: 'html' | 'css' | 'js', content: string) => void;
  model?: string;
}

export function EditCodeWidget({ data, onStreamUpdate, model }: EditCodeWidgetProps) {
  const [status, setStatus] = useState<'loading' | 'preview' | 'accepted' | 'rejected' | 'error'>('loading');
  const [originalCode, setOriginalCode] = useState<string>('');
  const [modifiedCode, setModifiedCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { getContent } = useEditorContent();
  const { theme } = useTheme();

  // Automatically fetch content and generate modified code on mount
  // Use a ref to prevent double execution in React StrictMode
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    if (hasGeneratedRef.current) {
      console.log('[EditCodeWidget] Skipping duplicate generation (React StrictMode)');
      return;
    }

    hasGeneratedRef.current = true;
    console.log('[EditCodeWidget] Component mounted, generating edit for:', data.fileType);
    generateEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateEdit = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      // Step 1: Get current code from editor
      const content = getContent();
      const currentCode = content[data.fileType] || '';
      setOriginalCode(currentCode);

      if (!currentCode || currentCode.trim() === '') {
        throw new Error(`No ${data.fileType.toUpperCase()} code found in the editor`);
      }

      // Step 2: Call API to generate modified code using AI
      const response = await fetch('/api/edit-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: data.fileType,
          originalCode: currentCode,
          instructions: data.instructions,
          model: model, // Pass selected model, API will use Haiku 4.5 as default if not provided
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate modified code');
      }

      const result = await response.json();
      console.log('[EditCodeWidget] AI generated modified code:', {
        originalLength: currentCode.length,
        modifiedLength: result.modifiedCode.length,
        hasChanges: currentCode !== result.modifiedCode
      });
      setModifiedCode(result.modifiedCode);
      setStatus('preview');
    } catch (error) {
      console.error('Error generating edit:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      setStatus('error');
    }
  };

  const handleAccept = () => {
    console.log('[EditCodeWidget] Accepting changes:', {
      fileType: data.fileType,
      hasCallback: !!onStreamUpdate,
      modifiedCodeLength: modifiedCode.length
    });

    if (onStreamUpdate) {
      onStreamUpdate(data.fileType, modifiedCode);
      console.log('[EditCodeWidget] Code applied to editor successfully');
    } else {
      console.error('[EditCodeWidget] No onStreamUpdate callback provided!');
    }

    setStatus('accepted');
  };

  const handleReject = () => {
    setStatus('rejected');
  };

  const getLanguage = (fileType: string): string => {
    const languageMap: Record<string, string> = {
      html: 'html',
      css: 'css',
      js: 'javascript',
    };
    return languageMap[fileType] || 'plaintext';
  };

  const getFileLabel = (fileType: string): string => {
    const labelMap: Record<string, string> = {
      html: 'index.html',
      css: 'styles.css',
      js: 'script.js',
    };
    return labelMap[fileType] || 'file';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === 'preview' && <Check className="h-4 w-4 text-blue-600" />}
          {status === 'accepted' && <Check className="h-4 w-4 text-green-600" />}
          {status === 'rejected' && <X className="h-4 w-4 text-red-600" />}
          {status === 'error' && <X className="h-4 w-4 text-destructive" />}
          Edit {data.fileType.toUpperCase()} Code
        </CardTitle>
        {data.reasoning && (
          <CardDescription className="text-xs mt-1">{data.reasoning}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <span className="font-medium text-muted-foreground">Instructions: </span>
          {data.instructions}
        </div>

        {/* Loading state */}
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating modified code...</span>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="space-y-3">
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <span className="font-medium">Error: </span>
              {errorMessage}
            </div>
            <Button onClick={generateEdit} variant="outline" size="sm" className="w-full">
              <RefreshCw className="h-3 w-3 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Diff preview */}
        {status === 'preview' && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground flex items-center justify-between px-1">
              <span>Review the proposed changes:</span>
              <span className="font-mono">{getFileLabel(data.fileType)}</span>
            </div>
            <div className="border rounded-md overflow-hidden bg-white dark:bg-gray-900" style={{ height: '500px' }}>
              <DiffEditor
                height="500px"
                language={getLanguage(data.fileType)}
                original={originalCode}
                modified={modifiedCode}
                theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                options={{
                  readOnly: true,
                  renderSideBySide: true, // Side-by-side is clearer for code reviews
                  enableSplitViewResizing: true,
                  renderOverviewRuler: true,
                  renderIndicators: true,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  lineHeight: 20,
                  lineNumbers: 'on',
                  glyphMargin: false,
                  folding: false,
                  diffWordWrap: 'on',
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAccept} className="flex-1 h-9" size="sm">
                <Check className="h-3 w-3 mr-2" />
                Accept Changes
              </Button>
              <Button onClick={handleReject} variant="outline" className="flex-1 h-9" size="sm">
                <X className="h-3 w-3 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Accepted state */}
        {status === 'accepted' && (
          <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-3 text-sm text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900">
            <span className="font-medium">✓ Changes applied successfully!</span>
            <p className="text-xs mt-1 opacity-80">
              The {data.fileType.toUpperCase()} file has been updated in the editor.
            </p>
          </div>
        )}

        {/* Rejected state */}
        {status === 'rejected' && (
          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground border">
            <span className="font-medium">Changes rejected</span>
            <p className="text-xs mt-1 opacity-80">The original code remains unchanged.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
