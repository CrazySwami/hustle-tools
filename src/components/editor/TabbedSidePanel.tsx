'use client'

import { useState } from 'react'
import { X, MessageSquare, Wrench, ArrowLeft, FileText, Search, BookOpen, List, Replace, BookMarked, Copy as CopyIcon, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import CommentsPanel from './CommentsPanel'
import { Comment } from './CommentExtension'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { TextStatsWidget } from '@/components/tool-ui/text-stats-widget'
import { FindStringWidget } from '@/components/tool-ui/find-string-widget'
import { ReadabilityWidget } from '@/components/tool-ui/readability-widget'
import { HeadingsWidget } from '@/components/tool-ui/headings-widget'
import { FindReplaceWidget } from '@/components/tool-ui/find-replace-widget'
import { TOCWidget } from '@/components/tool-ui/toc-widget'
import { DuplicatesWidget } from '@/components/tool-ui/duplicates-widget'
import { DocumentLibrary } from './DocumentLibrary'

interface TabbedSidePanelProps {
  // Comments props
  comments: Comment[]
  activeCommentId: string | null
  onCommentClick: (commentId: string) => void
  onCommentResolve: (commentId: string) => void
  onCommentDelete: (commentId: string) => void
  onAddComment: () => void

  // Panel state
  isOpen: boolean
  onToggle: () => void
  activeTab?: 'comments' | 'tools' | 'library'
  onTabChange?: (tab: 'comments' | 'tools' | 'library') => void

  // Library props
  onDocumentSelect?: (documentId: string, content: string) => void
}

type ActiveTool = 'stats' | 'find' | 'readability' | 'headings' | 'replace' | 'toc' | 'duplicates' | null

export function TabbedSidePanel({
  comments,
  activeCommentId,
  onCommentClick,
  onCommentResolve,
  onCommentDelete,
  onAddComment,
  isOpen,
  onToggle,
  activeTab: controlledTab,
  onTabChange,
  onDocumentSelect,
}: TabbedSidePanelProps) {
  const [internalTab, setInternalTab] = useState<'comments' | 'tools' | 'library'>('comments')
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)

  // Find string state
  const [findTerm, setFindTerm] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)

  // Find & Replace state
  const [replaceTerm, setReplaceTerm] = useState('')
  const [replaceWith, setReplaceWith] = useState('')

  // Use controlled tab if provided, otherwise use internal state
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab
  const setActiveTab = onTabChange || setInternalTab

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
  ]

  const handleToolClick = (toolId: ActiveTool) => {
    setActiveTool(toolId)
  }

  const handleBackToTools = () => {
    setActiveTool(null)
  }

  return (
    <div
      className={cn(
        "absolute top-0 right-0 h-full bg-background border-l flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
      style={{ width: '20rem', zIndex: 10 }}
    >
      {/* Header with tabs */}
      <div className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between p-2">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('comments')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === 'comments'
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Comments</span>
              {comments.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  {comments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === 'tools'
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Wrench className="h-4 w-4" />
              <span>Tools</span>
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === 'library'
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <FolderOpen className="h-4 w-4" />
              <span>Library</span>
            </button>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            title="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'comments' && (
          <CommentsPanel
            comments={comments}
            activeCommentId={activeCommentId}
            onCommentClick={onCommentClick}
            onCommentResolve={onCommentResolve}
            onCommentDelete={onCommentDelete}
            onAddComment={onAddComment}
            isOpen={isOpen}
            onToggle={onToggle}
          />
        )}
        {activeTab === 'tools' && (
          <div className="h-full overflow-y-auto">
            {/* Tool List View */}
            {!activeTool && (
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">DOCUMENT TOOLS</h3>
                {tools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool.id)}
                      className="w-full text-left p-3 rounded-lg border transition-all bg-card hover:bg-muted/50 border-border"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 ${tool.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{tool.name}</div>
                          <div className="text-xs text-muted-foreground">{tool.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Individual Tool View (Full Panel) */}
            {activeTool && (
              <div className="h-full flex flex-col">
                {/* Tool Header with Back Button */}
                <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToTools}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-sm font-semibold">
                    {tools.find(t => t.id === activeTool)?.name}
                  </h3>
                </div>

                {/* Tool Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Tool-specific forms */}
                  {activeTool === 'find' && (
                    <div className="space-y-3 mb-4">
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
                    <div className="space-y-3 mb-4">
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

                  {/* Widget Display */}
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
        )}
        {activeTab === 'library' && (
          <DocumentLibrary
            onDocumentSelect={onDocumentSelect}
            onClose={onToggle}
          />
        )}
      </div>
    </div>
  )
}
