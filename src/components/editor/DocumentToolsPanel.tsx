'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  BookOpen,
  List,
  Replace,
  BookMarked,
  Copy as CopyIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextStatsWidget } from '@/components/tool-ui/text-stats-widget';
import { FindStringWidget } from '@/components/tool-ui/find-string-widget';
import { ReadabilityWidget } from '@/components/tool-ui/readability-widget';
import { HeadingsWidget } from '@/components/tool-ui/headings-widget';
import { FindReplaceWidget } from '@/components/tool-ui/find-replace-widget';
import { TOCWidget } from '@/components/tool-ui/toc-widget';
import { DuplicatesWidget } from '@/components/tool-ui/duplicates-widget';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type ActiveTool = 'stats' | 'find' | 'readability' | 'headings' | 'replace' | 'toc' | 'duplicates' | null;

export function DocumentToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  // Find string state
  const [findTerm, setFindTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  // Find & Replace state
  const [replaceTerm, setReplaceTerm] = useState('');
  const [replaceWith, setReplaceWith] = useState('');

  const tools = [
    {
      id: 'stats' as const,
      name: 'Text Statistics',
      icon: FileText,
      description: 'Word count, reading time',
      color: 'text-blue-600'
    },
    {
      id: 'find' as const,
      name: 'Find Text',
      icon: Search,
      description: 'Search for occurrences',
      color: 'text-green-600'
    },
    {
      id: 'readability' as const,
      name: 'Readability',
      icon: BookOpen,
      description: 'Flesch scores & grade level',
      color: 'text-purple-600'
    },
    {
      id: 'headings' as const,
      name: 'Document Outline',
      icon: List,
      description: 'Extract heading structure',
      color: 'text-indigo-600'
    },
    {
      id: 'replace' as const,
      name: 'Find & Replace',
      icon: Replace,
      description: 'Bulk text replacement',
      color: 'text-orange-600'
    },
    {
      id: 'toc' as const,
      name: 'Table of Contents',
      icon: BookMarked,
      description: 'Generate TOC',
      color: 'text-teal-600'
    },
    {
      id: 'duplicates' as const,
      name: 'Find Duplicates',
      icon: CopyIcon,
      description: 'Detect redundant content',
      color: 'text-red-600'
    },
  ];

  const handleToolClick = (toolId: ActiveTool) => {
    if (activeTool === toolId) {
      setActiveTool(null);
    } else {
      setActiveTool(toolId);
    }
  };

  return (
    <>
      {/* Toggle Button (Always Visible) */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="sm"
          variant="outline"
          className="shadow-lg"
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="ml-2">{isOpen ? 'Hide' : 'Tools'}</span>
        </Button>
      </div>

      {/* Slide-in Panel */}
      <div
        className={`absolute top-0 left-0 h-full bg-background border-r border-border shadow-lg transition-all duration-300 ease-in-out z-20 ${
          isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'
        }`}
        style={{ overflow: isOpen ? 'visible' : 'hidden' }}
      >
        {isOpen && (
          <div className="flex flex-col h-full p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <h2 className="text-lg font-semibold">Document Tools</h2>
              <Button
                onClick={() => setIsOpen(false)}
                size="sm"
                variant="ghost"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Tool Buttons */}
            <div className="space-y-2 mb-4">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;

                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : 'bg-card hover:bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : tool.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{tool.name}</div>
                        <div className="text-xs text-muted-foreground">{tool.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tool-specific Forms */}
            {activeTool === 'find' && (
              <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                <h3 className="font-semibold text-sm mb-2">Find Text</h3>
                <div className="space-y-2">
                  <Label htmlFor="find-term" className="text-xs">Search Term</Label>
                  <Input
                    id="find-term"
                    value={findTerm}
                    onChange={(e) => setFindTerm(e.target.value)}
                    placeholder="Enter text to find..."
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="case-sensitive"
                      checked={caseSensitive}
                      onCheckedChange={(checked) => setCaseSensitive(checked as boolean)}
                    />
                    <Label htmlFor="case-sensitive" className="text-xs cursor-pointer">
                      Case sensitive
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="whole-word"
                      checked={wholeWord}
                      onCheckedChange={(checked) => setWholeWord(checked as boolean)}
                    />
                    <Label htmlFor="whole-word" className="text-xs cursor-pointer">
                      Whole word
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'replace' && (
              <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                <h3 className="font-semibold text-sm mb-2">Find & Replace</h3>
                <div className="space-y-2">
                  <Label htmlFor="replace-find" className="text-xs">Find</Label>
                  <Input
                    id="replace-find"
                    value={replaceTerm}
                    onChange={(e) => setReplaceTerm(e.target.value)}
                    placeholder="Text to find..."
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replace-with" className="text-xs">Replace with</Label>
                  <Input
                    id="replace-with"
                    value={replaceWith}
                    onChange={(e) => setReplaceWith(e.target.value)}
                    placeholder="Replacement text..."
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Widget Display Area */}
            <div className="mt-4 space-y-4">
              {activeTool === 'stats' && (
                <TextStatsWidget data={{ includeSpaces: true }} />
              )}

              {activeTool === 'find' && findTerm && (
                <FindStringWidget
                  data={{
                    searchTerm: findTerm,
                    caseSensitive,
                    wholeWord,
                  }}
                />
              )}

              {activeTool === 'readability' && (
                <ReadabilityWidget data={{ detailed: true }} />
              )}

              {activeTool === 'headings' && (
                <HeadingsWidget data={{ maxLevel: 6 }} />
              )}

              {activeTool === 'replace' && replaceTerm && replaceWith && (
                <FindReplaceWidget
                  data={{
                    find: replaceTerm,
                    replace: replaceWith,
                    caseSensitive: false,
                    wholeWord: false,
                  }}
                />
              )}

              {activeTool === 'toc' && (
                <TOCWidget
                  data={{
                    numbered: true,
                    maxLevel: 3,
                    style: 'markdown',
                  }}
                />
              )}

              {activeTool === 'duplicates' && (
                <DuplicatesWidget
                  data={{
                    sensitivity: 'high',
                    minLength: 10,
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
