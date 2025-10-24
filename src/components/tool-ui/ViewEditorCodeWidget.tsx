/**
 * ViewEditorCodeWidget Component
 *
 * Displays code files from the editor with:
 * - Sleek black/white UI matching app design
 * - File list with checkboxes for selection
 * - Thin, minimal spinner during loading
 * - Syntax-highlighted code display
 * - Copy functionality for code blocks
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FileCode, Loader2, Copy, Check } from 'lucide-react';
import { useEditorContent } from '@/hooks/useEditorContent';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface FileInfo {
  name: string;
  type: 'html' | 'css' | 'js';
  selected: boolean;
}

interface ViewEditorCodeWidgetProps {
  data: {
    files: FileInfo[];
    status: string;
    timestamp: string;
  };
}

export function ViewEditorCodeWidget({ data }: ViewEditorCodeWidgetProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
    new Set(data.files.filter(f => f.selected).map(f => f.type))
  );
  const [loading, setLoading] = useState(false);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const { getContent } = useEditorContent();
  const { theme } = useTheme();

  const handleSelectFile = (fileType: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileType)) {
      newSelected.delete(fileType);
    } else {
      newSelected.add(fileType);
    }
    setSelectedFiles(newSelected);
  };

  const handleLoadFiles = async () => {
    setLoading(true);

    // Simulate brief loading for UX (even though getContent is instant)
    await new Promise(resolve => setTimeout(resolve, 300));

    const content = getContent();
    const newFileContents: Record<string, string> = {};

    selectedFiles.forEach(fileType => {
      if (content[fileType as 'html' | 'css' | 'js']) {
        newFileContents[fileType] = content[fileType as 'html' | 'css' | 'js'] || '';
      }
    });

    setFileContents(newFileContents);
    setLoading(false);
  };

  // Auto-load files that are pre-selected by the AI
  useEffect(() => {
    const preSelectedFiles = data.files.filter(f => f.selected);
    if (preSelectedFiles.length > 0) {
      // Auto-load the pre-selected files
      handleLoadFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleCopyCode = async (fileType: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedFile(fileType);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const getLanguage = (fileType: string): string => {
    const languageMap: Record<string, string> = {
      html: 'markup',
      css: 'css',
      js: 'javascript'
    };
    return languageMap[fileType] || 'plaintext';
  };

  const getFileSize = (content: string): string => {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCode className="h-4 w-4" />
          Code Files ({data.files.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File selection list */}
        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-muted/30">
          {data.files.map(file => (
            <div
              key={file.type}
              className="flex items-center gap-2 hover:bg-accent/50 rounded px-2 py-1.5 transition-colors"
            >
              <Checkbox
                id={`file-${file.type}`}
                checked={selectedFiles.has(file.type)}
                onCheckedChange={() => handleSelectFile(file.type)}
                className="h-4 w-4"
              />
              <label
                htmlFor={`file-${file.type}`}
                className="text-sm flex-1 cursor-pointer select-none"
              >
                {file.name}
              </label>
              {fileContents[file.type] && (
                <span className="text-xs text-muted-foreground">
                  {getFileSize(fileContents[file.type])}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Loading indicator - thin and minimal */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">Loading {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''}...</span>
          </div>
        )}

        {/* Code display */}
        {Object.entries(fileContents).length > 0 && !loading && (
          <div className="space-y-3">
            {Object.entries(fileContents).map(([fileType, content]) => {
              const isEmpty = !content || content.trim() === '';

              return (
                <div key={fileType} className="space-y-1.5">
                  {/* File header */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {data.files.find(f => f.type === fileType)?.name}
                    </span>
                    {!isEmpty && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(fileType, content)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedFile === fileType ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Code block */}
                  {isEmpty ? (
                    <div className="border rounded-md p-4 bg-muted/30 text-center">
                      <span className="text-xs text-muted-foreground italic">
                        No content in this file
                      </span>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-md border text-sm">
                      {/* Light mode */}
                      <div className="dark:hidden">
                        <SyntaxHighlighter
                          language={getLanguage(fileType)}
                          style={oneLight}
                          customStyle={{
                            margin: 0,
                            padding: '0.75rem',
                            fontSize: '0.813rem',
                            lineHeight: '1.5',
                            background: 'hsl(var(--background))',
                          }}
                          showLineNumbers={true}
                          lineNumberStyle={{
                            minWidth: '2.5em',
                            paddingRight: '1em',
                            color: 'hsl(var(--muted-foreground))',
                            fontSize: '0.75rem',
                          }}
                        >
                          {content}
                        </SyntaxHighlighter>
                      </div>

                      {/* Dark mode */}
                      <div className="hidden dark:block">
                        <SyntaxHighlighter
                          language={getLanguage(fileType)}
                          style={oneDark}
                          customStyle={{
                            margin: 0,
                            padding: '0.75rem',
                            fontSize: '0.813rem',
                            lineHeight: '1.5',
                            background: 'hsl(var(--card))',
                          }}
                          showLineNumbers={true}
                          lineNumberStyle={{
                            minWidth: '2.5em',
                            paddingRight: '1em',
                            color: 'hsl(var(--muted-foreground))',
                            fontSize: '0.75rem',
                          }}
                        >
                          {content}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Load button */}
        {Object.entries(fileContents).length === 0 && !loading && (
          <Button
            onClick={handleLoadFiles}
            disabled={selectedFiles.size === 0}
            className="w-full h-9 text-sm"
            variant="default"
          >
            {selectedFiles.size === 0 ? (
              'Select files to view'
            ) : (
              `Load ${selectedFiles.size} file${selectedFiles.size > 1 ? 's' : ''}`
            )}
          </Button>
        )}

        {/* Reload button (when files are already loaded) */}
        {Object.entries(fileContents).length > 0 && !loading && (
          <Button
            onClick={handleLoadFiles}
            disabled={selectedFiles.size === 0}
            variant="outline"
            className="w-full h-8 text-xs"
          >
            Refresh selected files
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
