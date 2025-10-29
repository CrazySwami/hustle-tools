'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileIcon, Loader2Icon, CheckCircle2Icon } from 'lucide-react';
import { useEditorContent } from '@/hooks/useEditorContent';

interface SingleFileGeneratorWidgetProps {
  data: {
    fileType: 'html' | 'css' | 'js' | 'php';
    description: string;
    images: Array<{ url: string; filename: string }>;
    status: string;
    message: string;
  };
  model?: string;
}

type GeneratorState = 'idle' | 'generating' | 'completed' | 'error';

export function SingleFileGeneratorWidget({ data, model = 'anthropic/claude-sonnet-4-5-20250929' }: SingleFileGeneratorWidgetProps) {
  console.log('🎨 SingleFileGeneratorWidget rendered:', data);

  const { getContent, updateContent } = useEditorContent();

  const [state, setState] = useState<GeneratorState>('idle');
  const [generatedCode, setGeneratedCode] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGenerate = async () => {
    try {
      setState('generating');
      setGeneratedCode('');
      setCharCount(0);
      setErrorMessage('');

      console.log(`🚀 Starting single file generation for ${data.fileType}...`);

      // Get all files for context
      const allContent = getContent();

      // Call edit-code-stream in generation mode (empty currentCode)
      const response = await fetch('/api/edit-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: data.description,
          fileType: data.fileType,
          currentCode: '', // Empty = generation mode
          allFiles: {
            html: allContent.html || '',
            css: allContent.css || '',
            js: allContent.js || '',
            php: allContent.php || '',
          },
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
          setGeneratedCode(accumulated);
          setCharCount(accumulated.length);
        }
      }

      console.log(`✅ Generation complete:`, accumulated.length, 'characters');

      // Auto-apply to editor
      updateContent(data.fileType, accumulated);
      setState('completed');

    } catch (error) {
      console.error('❌ Single file generation failed:', error);
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const fileTypeColors = {
    html: 'bg-orange-500/10 text-orange-600 border-orange-200',
    css: 'bg-blue-500/10 text-blue-600 border-blue-200',
    js: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    php: 'bg-purple-500/10 text-purple-600 border-purple-200',
  };

  const fileTypeIcons = {
    html: '📄',
    css: '🎨',
    js: '⚡',
    php: '🐘',
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileIcon className="h-5 w-5" />
          Generate Single File
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* IDLE STATE - Ready to generate */}
        {state === 'idle' && (
          <div className="space-y-3">
            <div className={`p-3 rounded-md border ${fileTypeColors[data.fileType]}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{fileTypeIcons[data.fileType]}</span>
                <div>
                  <p className="font-medium text-sm">
                    Generating: {data.fileType.toUpperCase()}
                  </p>
                  <p className="text-xs opacity-75">
                    Other files will be preserved
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Description:</p>
              <p className="text-sm text-muted-foreground">{data.description}</p>
            </div>

            {data.images && data.images.length > 0 && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Reference Images ({data.images.length}):</p>
                <div className="flex gap-2">
                  {data.images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded border overflow-hidden">
                      <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleGenerate}
              className="w-full"
            >
              Generate {data.fileType.toUpperCase()} Only
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              ℹ️ This will only generate {data.fileType.toUpperCase()} and preserve your HTML, CSS, JS, and PHP files.
            </p>
          </div>
        )}

        {/* GENERATING STATE - Streaming code */}
        {state === 'generating' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2Icon size={16} className="animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">
                Generating {data.fileType.toUpperCase()}...
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              <div className="font-mono">
                Characters generated: {charCount}
              </div>
            </div>
            {generatedCode && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Preview (streaming):</p>
                <div className="p-3 bg-muted rounded font-mono text-xs overflow-auto max-h-40">
                  {generatedCode.substring(0, 200)}...
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPLETED STATE - Success */}
        {state === 'completed' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2Icon size={16} />
              <p className="text-sm font-medium">Generation Complete!</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                ✓ {data.fileType.toUpperCase()} file generated ({generatedCode.length} characters)
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                The {data.fileType.toUpperCase()} file has been updated in the editor. All other files remain unchanged.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState('idle')}
              className="w-full"
            >
              Generate Another File
            </Button>
          </div>
        )}

        {/* ERROR STATE - Something went wrong */}
        {state === 'error' && (
          <div className="space-y-2">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm font-medium text-red-600 mb-1">Error</p>
              <p className="text-xs text-red-600">{errorMessage}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState('idle')}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
