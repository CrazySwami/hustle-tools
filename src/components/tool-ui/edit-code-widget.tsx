'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCodeIcon, Loader2Icon, CheckCircle2Icon, XCircleIcon, AlertCircleIcon } from 'lucide-react';
import { useEditorContent } from '@/hooks/useEditorContent';
import { validateCode } from '@/lib/code-validator';
import { applyUnifiedDiff, isDiffFormat, getDiffStats } from '@/lib/diff-parser';
import Editor, { DiffEditor } from '@monaco-editor/react';

interface EditCodeWidgetProps {
  data: {
    instruction: string;
    fileType: 'html' | 'css' | 'js' | 'php';
    context?: string;
    status: string;
    message: string;
  };
}

type WidgetState = 'idle' | 'loading' | 'reviewing' | 'applied' | 'error';

export function EditCodeWidget({ data }: EditCodeWidgetProps) {
  console.log('✏️  EditCodeWidget rendered with data:', data);

  const { getContent, updateContent } = useEditorContent();

  const [state, setState] = useState<WidgetState>('idle');
  const [originalCode, setOriginalCode] = useState<string>('');
  const [editedCode, setEditedCode] = useState<string>('');
  const [streamedCode, setStreamedCode] = useState<string>('');
  const [charCount, setCharCount] = useState<number>(0);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [allFilesContent, setAllFilesContent] = useState<{
    html: string;
    css: string;
    js: string;
    php?: string;
  }>({ html: '', css: '', js: '' });

  // Get ALL files for context on mount + AUTO-EXECUTE
  useEffect(() => {
    // Get all files for context
    const allContent = getContent(); // No filter = get all
    setAllFilesContent({
      html: allContent.html || '',
      css: allContent.css || '',
      js: allContent.js || '',
      php: allContent.php || ''
    });

    // Set the file being edited
    const currentCode = allContent[data.fileType] || '';
    setOriginalCode(currentCode);

    console.log(`📄 Loaded context for ${data.fileType} edit:`, {
      editing: data.fileType,
      htmlChars: allContent.html?.length || 0,
      cssChars: allContent.css?.length || 0,
      jsChars: allContent.js?.length || 0,
      phpChars: allContent.php?.length || 0,
    });

    // 🆕 AUTO-EXECUTE: Start generation immediately on mount
    console.log('🚀 Auto-executing edit generation...');
    handleGenerateEdit();
  }, [data.fileType, getContent]);

  const handleGenerateEdit = async () => {
    try {
      setState('loading');
      setStreamedCode('');
      setCharCount(0);
      setErrorMessage('');

      console.log(`🚀 Starting code edit for ${data.fileType}...`);

      const response = await fetch('/api/edit-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: data.instruction,
          fileType: data.fileType,
          currentCode: originalCode,
          context: data.context || '',
          allFiles: allFilesContent,  // ⭐ Send all files for context
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          accumulated += chunk;
          setStreamedCode(accumulated);
          setCharCount(accumulated.length);
        }
      }

      console.log(`✅ Editing complete:`, accumulated.length, 'characters');

      // Check if response is a diff or full file
      const isFullFile = !originalCode || !isDiffFormat(accumulated);
      let finalCode: string;

      if (isFullFile) {
        // Full file replacement (empty file or no diff markers)
        console.log('📄 Full file replacement detected');
        finalCode = accumulated;
      } else {
        // Apply unified diff patch
        console.log('🔧 Applying unified diff patch');
        const diffStats = getDiffStats(accumulated);
        console.log(`📊 Diff stats:`, diffStats);

        try {
          finalCode = applyUnifiedDiff(originalCode, accumulated);
          console.log(`✅ Diff applied successfully: ${finalCode.length} characters`);
        } catch (error) {
          console.error('❌ Failed to apply diff, falling back to full replacement:', error);
          finalCode = accumulated;
        }
      }

      // Validate the edited code
      const validation = validateCode(finalCode, data.fileType);
      setValidationResult(validation);

      if (validation.isValid) {
        setEditedCode(finalCode);
        setState('reviewing');

        // 🆕 Show diff in Monaco IMMEDIATELY when review is ready (before user clicks Accept)
        console.log('📡 Dispatching show-code-diff event (review ready):', {
          fileType: data.fileType,
          originalLength: originalCode.length,
          modifiedLength: finalCode.length,
        });

        window.dispatchEvent(new CustomEvent('show-code-diff', {
          detail: {
            fileType: data.fileType,
            original: originalCode,
            modified: finalCode,
          }
        }));
      } else {
        setState('error');
        setErrorMessage(`Validation failed: ${validation.errors.join(', ')}`);
      }

    } catch (error) {
      console.error('❌ Code editing failed:', error);
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const handleAcceptChanges = () => {
    console.log(`✅ Applying changes to ${data.fileType}`, {
      originalLength: originalCode.length,
      editedLength: editedCode.length,
      originalPreview: originalCode.substring(0, 100),
      editedPreview: editedCode.substring(0, 100),
    });

    // Apply changes to editor state
    updateContent(data.fileType, editedCode);

    // Close the diff view (user has accepted)
    window.dispatchEvent(new CustomEvent('close-code-diff'));

    setState('applied');
  };

  const handleRejectChanges = () => {
    console.log(`❌ Rejecting changes to ${data.fileType}`);
    // Don't clear the code - keep it so user can re-view later
    setState('declined');
    // Close the diff view
    window.dispatchEvent(new CustomEvent('close-code-diff'));
  };

  const handleTryAgain = () => {
    setState('idle');
    setErrorMessage('');
    setStreamedCode('');
    setValidationResult(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCodeIcon className="h-5 w-5" />
          Code Editor
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* IDLE STATE - Ready to start editing */}
        {state === 'idle' && (
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Instruction:</p>
              <p className="text-sm text-muted-foreground">{data.instruction}</p>
              {data.context && (
                <>
                  <p className="text-sm font-medium mt-2 mb-1">Context:</p>
                  <p className="text-sm text-muted-foreground">{data.context}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileCodeIcon size={16} />
              <span>Editing: <strong>{data.fileType.toUpperCase()}</strong></span>
              <span className="ml-auto">{originalCode.length} characters</span>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateEdit}
            >
              {originalCode ? 'Generate Edit' : 'Generate Code'}
            </Button>
            {!originalCode && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  💡 Empty File Detected
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  Will generate new {data.fileType.toUpperCase()} code using context from:
                </p>
                <ul className="mt-1 space-y-0.5 text-blue-600 dark:text-blue-400">
                  {allFilesContent.html && <li>✓ HTML ({allFilesContent.html.length} chars)</li>}
                  {allFilesContent.css && <li>✓ CSS ({allFilesContent.css.length} chars)</li>}
                  {allFilesContent.js && <li>✓ JavaScript ({allFilesContent.js.length} chars)</li>}
                  {allFilesContent.php && <li>✓ PHP Widget ({allFilesContent.php.length} chars)</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* LOADING STATE - Streaming code edits */}
        {state === 'loading' && (
          <div className="space-y-3">
            {/* Sleek three-dot loader */}
            <div className="flex items-center justify-center gap-1 py-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '800ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '800ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '800ms' }} />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Editing {data.fileType.toUpperCase()}...
              </p>
              <div className="text-xs text-muted-foreground mt-1 font-mono">
                {charCount} characters
              </div>
            </div>
          </div>
        )}

        {/* REVIEWING STATE - Compact view with accept/decline */}
        {state === 'reviewing' && (
          <div className="space-y-3">
            {/* Edit Summary */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircleIcon size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    {data.fileType.toUpperCase()} Edit Ready
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    {data.instruction}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-blue-600 dark:text-blue-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {editedCode.length} chars
                    </span>
                    {editedCode.length !== originalCode.length && (
                      <span className="text-blue-500">
                        {editedCode.length > originalCode.length ? '+' : ''}{editedCode.length - originalCode.length}
                      </span>
                    )}
                  </div>

                  {/* Validation Status */}
                  {validationResult?.isValid && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2Icon size={12} />
                      <span>Syntax valid</span>
                    </div>
                  )}

                  {validationResult && validationResult.warnings.length > 0 && (
                    <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                      ⚠️ {validationResult.warnings.length} warning(s)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAcceptChanges}
                  className="flex-1"
                >
                  <CheckCircle2Icon size={16} className="mr-1" />
                  Accept & Apply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectChanges}
                  className="flex-1"
                >
                  <XCircleIcon size={16} className="mr-1" />
                  Decline
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Dispatch event to show diff (it's already dispatched, but user might have closed it)
                  window.dispatchEvent(new CustomEvent('show-code-diff', {
                    detail: {
                      fileType: data.fileType,
                      original: originalCode,
                      modified: editedCode,
                    }
                  }));
                }}
                className="w-full text-xs"
              >
                👁️ View Changes in Monaco
              </Button>
            </div>
          </div>
        )}

        {/* APPLIED STATE - Changes accepted */}
        {state === 'applied' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2Icon size={16} />
              <p className="text-sm font-medium">Changes Applied!</p>
            </div>
            <div className="text-xs text-muted-foreground">
              <div>The {data.fileType.toUpperCase()} file has been updated in the editor.</div>
              <div className="mt-1">Original: {originalCode.length} chars → New: {editedCode.length} chars</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Re-show the diff view
                window.dispatchEvent(new CustomEvent('show-code-diff', {
                  detail: {
                    fileType: data.fileType,
                    original: originalCode,
                    modified: editedCode,
                  }
                }));
              }}
              className="w-full"
            >
              👁️ View Changes
            </Button>
          </div>
        )}

        {/* DECLINED STATE - Changes rejected but can be reviewed again */}
        {state === 'declined' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-600">
              <XCircleIcon size={16} />
              <p className="text-sm font-medium">Changes Declined</p>
            </div>
            <div className="text-xs text-muted-foreground">
              <div>You declined these changes. The editor was not modified.</div>
              <div className="mt-1">Original: {originalCode.length} chars → Proposed: {editedCode.length} chars</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Re-show the diff view for review
                  window.dispatchEvent(new CustomEvent('show-code-diff', {
                    detail: {
                      fileType: data.fileType,
                      original: originalCode,
                      modified: editedCode,
                    }
                  }));
                  // Go back to reviewing state
                  setState('reviewing');
                }}
                className="flex-1"
              >
                👁️ Review Again
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Clear and start over
                  setState('idle');
                  setEditedCode('');
                  setStreamedCode('');
                  setValidationResult(null);
                }}
                className="flex-1"
              >
                Make Another Edit
              </Button>
            </div>
          </div>
        )}

        {/* ERROR STATE - Something went wrong */}
        {state === 'error' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <XCircleIcon size={16} />
              <p className="text-sm font-medium">Error</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
            {validationResult && validationResult.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium">Validation Errors:</p>
                {validationResult.errors.map((error, i) => (
                  <p key={i} className="text-xs text-red-600">• {error}</p>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTryAgain}
                className="flex-1"
              >
                Try Again
              </Button>
              {streamedCode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditedCode(streamedCode);
                    setState('reviewing');
                    setValidationResult({ isValid: true, errors: [], warnings: ['Manual review - validation bypassed'] });
                  }}
                  className="flex-1"
                >
                  Review Anyway
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
