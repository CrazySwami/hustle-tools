'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CopyIcon, XIcon } from 'lucide-react';
import { PieChartIcon } from '@/components/ui/PieChartIcon';
import { cn } from '@/lib/utils';

export interface SystemPromptViewerProps {
  /** Currently typed input text */
  input: string;
  /** Generated system prompt to display */
  systemPrompt: string;
  /** Selected model name */
  selectedModel: string;
  /** Model context limit */
  contextLimit: number;
  /** System prompt token count */
  systemTokens: number;
  /** Input token count */
  inputTokens: number;
  /** Conversation token count */
  conversationTokens: number;
  /** Total token count */
  totalTokens: number;
  /** Trigger element (button to open modal) */
  trigger: React.ReactNode;
  /** Optional: Document/Project metadata to display */
  metadata?: {
    documentTitle?: string;
    projectName?: string;
    wordCount?: number;
    fileStats?: {
      html?: number;
      css?: number;
      js?: number;
      php?: number;
      hubl?: number;
      globalCss?: number;
    };
  };
  /** Optional: Context toggles state */
  contextToggles?: {
    includeContext?: boolean;
    includeCss?: boolean;
    webSearch?: boolean;
  };
  /** Optional: Full file contents to display */
  fileContents?: {
    html?: string;
    css?: string;
    js?: string;
    php?: string;
    hubl?: string;
    documentContent?: string;
  };
}

/**
 * Reusable System Prompt Viewer Modal
 *
 * Used by both DocumentChat and ElementorChat to display:
 * - System prompt
 * - Token breakdown
 * - File contents
 * - Context toggles state
 *
 * Features:
 * - Two tabs: System Prompt and Token Breakdown
 * - Copy to clipboard
 * - Real-time token calculations
 * - Responsive design
 */
export function SystemPromptViewer({
  input,
  systemPrompt,
  selectedModel,
  contextLimit,
  systemTokens,
  inputTokens,
  conversationTokens,
  totalTokens,
  trigger,
  metadata,
  contextToggles,
  fileContents,
}: SystemPromptViewerProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'system-prompt' | 'token-breakdown'>('system-prompt');

  const percentUsed = (totalTokens / contextLimit) * 100;

  return (
    <>
      {/* Trigger element (button with token counter) */}
      <div onClick={() => setShowModal(true)}>
        {trigger}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl max-h-[80vh] overflow-hidden w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Tabs */}
            <div className="border-b border-border">
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-lg font-semibold">Token & Prompt Viewer</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-muted rounded-md transition-colors"
                >
                  <XIcon size={16} />
                </button>
              </div>
              {/* Tab Navigation */}
              <div className="flex gap-1 px-6">
                <button
                  onClick={() => setModalTab('system-prompt')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    modalTab === 'system-prompt'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  }`}
                >
                  System Prompt
                </button>
                <button
                  onClick={() => setModalTab('token-breakdown')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    modalTab === 'token-breakdown'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  }`}
                >
                  Token Breakdown
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[calc(80vh-140px)]">
              {modalTab === 'system-prompt' ? (
                <>
                  {/* System Prompt Tab Content */}
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Model:</span> {selectedModel}
                    </div>
                    {metadata?.documentTitle && (
                      <>
                        <div className="text-sm">
                          <span className="font-medium">Document:</span> {metadata.documentTitle}
                        </div>
                        {metadata.projectName && (
                          <div className="text-sm">
                            <span className="font-medium">Project:</span> {metadata.projectName}
                          </div>
                        )}
                        {metadata.wordCount !== undefined && (
                          <div className="text-sm">
                            <span className="font-medium">Word Count:</span> {metadata.wordCount.toLocaleString()}
                          </div>
                        )}
                      </>
                    )}
                    <div className="text-sm">
                      <span className="font-medium">Total Tokens:</span> {totalTokens.toLocaleString()}
                      <span className="text-muted-foreground text-xs ml-2">
                        (System: {systemTokens.toLocaleString()} +
                        Conversation: {conversationTokens.toLocaleString()} +
                        Input: {inputTokens.toLocaleString()})
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Total Characters:</span> {systemPrompt.length.toLocaleString()}
                    </div>
                    {contextToggles && (
                      <div className="text-sm">
                        <span className="font-medium">Context:</span>{' '}
                        <span className={contextToggles.includeContext ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {contextToggles.includeContext ? '✓ Enabled' : '✗ Disabled'}
                        </span>
                        {contextToggles.includeCss !== undefined && (
                          <>
                            {' | CSS Context: '}
                            <span className={contextToggles.includeCss ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {contextToggles.includeCss ? '✓ Enabled' : '✗ Disabled'}
                            </span>
                          </>
                        )}
                        {contextToggles.webSearch !== undefined && (
                          <>
                            {' | Web Search: '}
                            <span className={contextToggles.webSearch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {contextToggles.webSearch ? '✓ Enabled' : '✗ Disabled'}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    {metadata?.fileStats && (
                      <div className="text-sm pt-2 border-t">
                        <span className="font-medium">File Sizes:</span>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                          {metadata.fileStats.html !== undefined && metadata.fileStats.html > 0 && (
                            <div>HTML: {metadata.fileStats.html.toLocaleString()} chars</div>
                          )}
                          {metadata.fileStats.css !== undefined && metadata.fileStats.css > 0 && (
                            <div>CSS: {metadata.fileStats.css.toLocaleString()} chars</div>
                          )}
                          {metadata.fileStats.js !== undefined && metadata.fileStats.js > 0 && (
                            <div>JS: {metadata.fileStats.js.toLocaleString()} chars</div>
                          )}
                          {metadata.fileStats.php !== undefined && metadata.fileStats.php > 0 && (
                            <div>PHP: {metadata.fileStats.php.toLocaleString()} chars</div>
                          )}
                          {metadata.fileStats.hubl !== undefined && metadata.fileStats.hubl > 0 && (
                            <div>HubL: {metadata.fileStats.hubl.toLocaleString()} chars</div>
                          )}
                          {metadata.fileStats.globalCss !== undefined && metadata.fileStats.globalCss > 0 && (
                            <div className="col-span-2">
                              Global CSS: {metadata.fileStats.globalCss.toLocaleString()} chars
                            </div>
                          )}
                          {(metadata.fileStats as any).images !== undefined && (metadata.fileStats as any).images > 0 && (
                            <div className="col-span-2">
                              Images: {(metadata.fileStats as any).images} image{(metadata.fileStats as any).images !== 1 ? 's' : ''} (≈{((metadata.fileStats as any).images * 765).toLocaleString()} vision tokens)
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current Prompt Input */}
                  {input && (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Current Prompt ({input.length.toLocaleString()} chars):</h3>
                      <pre className="bg-background p-4 rounded-lg text-xs border border-border overflow-auto max-h-40 whitespace-pre-wrap">
                        {input}
                      </pre>
                    </div>
                  )}

                  {/* System Prompt */}
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">System Prompt ({systemPrompt.length.toLocaleString()} chars):</h3>
                    <pre className="bg-background p-4 rounded-lg text-xs border border-border overflow-auto max-h-60 whitespace-pre-wrap">
                      {systemPrompt}
                    </pre>
                  </div>

                  {/* File Contents */}
                  {fileContents?.documentContent && (
                    <div>
                      <h3 className="font-medium mb-2">Document Content ({fileContents.documentContent.length.toLocaleString()} chars):</h3>
                      <pre className="bg-background p-4 rounded-lg text-xs border border-border overflow-auto max-h-60 whitespace-pre-wrap">
                        {fileContents.documentContent}
                      </pre>
                    </div>
                  )}
                  {fileContents?.html && (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">HTML File ({fileContents.html.length.toLocaleString()} chars):</h3>
                      <pre className="bg-background p-4 rounded-lg text-xs border border-border overflow-auto max-h-60 whitespace-pre-wrap font-mono">
                        {fileContents.html}
                      </pre>
                    </div>
                  )}
                  {fileContents?.css && (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">CSS File ({fileContents.css.length.toLocaleString()} chars):</h3>
                      <pre className="bg-background p-4 rounded-lg text-xs border border-border overflow-auto max-h-60 whitespace-pre-wrap font-mono">
                        {fileContents.css}
                      </pre>
                    </div>
                  )}
                  {fileContents?.js && (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">JS File ({fileContents.js.length.toLocaleString()} chars):</h3>
                      <pre className="bg-background p-4 rounded-lg text-xs border border-border overflow-auto max-h-60 whitespace-pre-wrap font-mono">
                        {fileContents.js}
                      </pre>
                    </div>
                  )}
                  {fileContents?.php && (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">PHP File ({fileContents.php.length.toLocaleString()} chars):</h3>
                      <pre className="bg-background p-4 rounded-lg text-xs border border-border overflow-auto max-h-60 whitespace-pre-wrap font-mono">
                        {fileContents.php}
                      </pre>
                    </div>
                  )}
                  {fileContents?.hubl && (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">HubL File ({fileContents.hubl.length.toLocaleString()} chars):</h3>
                      <pre className="bg-background p-4 rounded-lg text-xs border border-border overflow-auto max-h-60 whitespace-pre-wrap font-mono">
                        {fileContents.hubl}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Token Breakdown Tab Content */}
                  <div className="space-y-6">
                    {/* Overall Stats */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-semibold mb-3">Overall Token Usage</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Tokens:</span>
                          <span className="font-mono font-semibold">{totalTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Context Limit:</span>
                          <span className="font-mono">{contextLimit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Usage:</span>
                          <span className={cn(
                            'font-mono font-semibold',
                            percentUsed >= 90 ? 'text-red-600 dark:text-red-400' :
                            percentUsed >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-green-600 dark:text-green-400'
                          )}>
                            {percentUsed.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all duration-300',
                              percentUsed >= 90 ? 'bg-red-500' :
                              percentUsed >= 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                            )}
                            style={{ width: `${Math.min(100, percentUsed)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Breakdown by Component */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-semibold mb-3">Token Breakdown</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">System Prompt:</span>
                          <span className="font-mono">{systemTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Conversation History:</span>
                          <span className="font-mono">{conversationTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current Input:</span>
                          <span className="font-mono">{inputTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="font-semibold">Total:</span>
                          <span className="font-mono font-semibold">{totalTokens.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className={cn(
                      'p-4 rounded-lg border',
                      percentUsed >= 90 ? 'bg-red-500/10 border-red-500/30' :
                      percentUsed >= 70 ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-green-500/10 border-green-500/30'
                    )}>
                      <h3 className="font-semibold mb-2">
                        {percentUsed >= 90 ? '⚠️ Critical: Token limit approaching' :
                         percentUsed >= 70 ? '⚠️ Warning: High token usage' :
                         '✅ Healthy: Token usage is safe'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {percentUsed >= 90 ? 'Consider starting a new conversation or reducing context.' :
                         percentUsed >= 70 ? 'Monitor token usage to avoid hitting limits.' :
                         'You have plenty of tokens available.'}
                      </p>
                    </div>

                    {/* Model Info */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-semibold mb-3">Model Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Model:</span>
                          <span className="font-mono">{selectedModel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Context Window:</span>
                          <span className="font-mono">{contextLimit.toLocaleString()} tokens</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(systemPrompt);
                }}
              >
                <CopyIcon size={16} className="mr-2" />
                Copy System Prompt
              </Button>
              <Button onClick={() => setShowModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
