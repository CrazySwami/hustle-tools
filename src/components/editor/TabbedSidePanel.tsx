'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare, Wrench, ArrowLeft, FileText, Search, BookOpen, List, Replace, BookMarked, Copy as CopyIcon, ChevronRight, ChevronDown, BookText } from 'lucide-react'
import { cn } from '@/lib/utils'
import CommentsPanel, { CommentTabType } from './CommentsPanel'
import { Comment } from './CommentExtension'
import { Editor } from '@tiptap/react'
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

// TableOfContents types
interface HeadingNode {
  id: string;
  level: number;
  text: string;
  position: number;
  children: HeadingNode[];
}

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
  activeTab?: 'comments' | 'tools' | 'toc'
  onTabChange?: (tab: 'comments' | 'tools' | 'toc') => void

  // Tool state
  activeTool?: ActiveTool
  onToolChange?: (tool: ActiveTool) => void

  // Comment tab state
  activeCommentTab?: CommentTabType
  onCommentTabChange?: (tab: CommentTabType) => void

  // Library props
  onDocumentSelect?: (documentId: string, content: string) => void

  // Editor instance
  editor?: Editor | null
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
  activeTool: controlledTool,
  onToolChange,
  activeCommentTab,
  onCommentTabChange,
  onDocumentSelect,
  editor,
}: TabbedSidePanelProps) {
  const [internalTab, setInternalTab] = useState<'comments' | 'tools' | 'toc'>('comments')
  const [internalTool, setInternalTool] = useState<ActiveTool>(null)

  // TableOfContents state
  const [headings, setHeadings] = useState<HeadingNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Use controlled tool if provided, otherwise use internal state
  const activeTool = controlledTool !== undefined ? controlledTool : internalTool
  const setActiveTool = onToolChange || setInternalTool

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

  // Extract headings for TOC tab - always keep updated
  useEffect(() => {
    if (!editor) return;

    const extractHeadings = () => {
      const headingsList: Array<{ level: number; text: string; position: number; id: string }> = [];

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const level = node.attrs.level;
          const text = node.textContent;

          // Skip empty headings
          if (!text.trim()) return;

          // Generate stable ID from position and text
          const id = `heading-${pos}-${text.slice(0, 20).replace(/\s+/g, "-")}`;

          headingsList.push({ level, text, position: pos, id });

          // Add ID to the node if it doesn't have one
          if (!node.attrs.id) {
            editor.commands.setNodeSelection(pos);
            editor.commands.updateAttributes("heading", { id });
          }
        }
      });

      // Build hierarchical structure
      const buildHierarchy = (items: typeof headingsList): HeadingNode[] => {
        const root: HeadingNode[] = [];
        const stack: HeadingNode[] = [];

        items.forEach((item) => {
          const node: HeadingNode = { ...item, children: [] };

          // Find parent in stack
          while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
            stack.pop();
          }

          if (stack.length === 0) {
            root.push(node);
          } else {
            stack[stack.length - 1].children.push(node);
          }

          stack.push(node);
        });

        return root;
      };

      setHeadings(buildHierarchy(headingsList));

      // Auto-expand all nodes initially
      const allIds = new Set(headingsList.map(h => h.id));
      setExpandedIds(allIds);
    };

    extractHeadings();

    // Update on every transaction
    const updateListener = () => extractHeadings();
    editor.on("update", updateListener);

    return () => {
      editor.off("update", updateListener);
    };
  }, [editor]);

  // TOC: Scroll to heading when clicked
  const scrollToHeading = (position: number, id: string) => {
    if (!editor) return;

    editor.commands.focus();
    editor.commands.setTextSelection(position);

    const element = document.querySelector(`[id="${id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setActiveHeadingId(id);
    }
  };

  // TOC: Toggle expand/collapse
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // TOC: Count total headings
  const countTotalHeadings = (headingNodes: HeadingNode[]): number => {
    let count = 0;
    const countRecursive = (nodes: HeadingNode[]) => {
      nodes.forEach((node) => {
        count++;
        if (node.children.length > 0) {
          countRecursive(node.children);
        }
      });
    };
    countRecursive(headingNodes);
    return count;
  };

  // TOC: Render heading tree recursively
  const renderHeadingNode = (node: HeadingNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isActive = activeHeadingId === node.id;

    return (
      <div key={node.id} style={{ marginLeft: `${depth * 16}px` }}>
        <div
          className={cn(
            "group flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-muted transition-colors",
            isActive && "bg-primary/10 text-primary font-semibold"
          )}
          onClick={() => scrollToHeading(node.position, node.id)}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-1 hover:bg-muted-foreground/10 rounded flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Heading Text */}
          <span
            className="flex-1 truncate"
            style={{
              fontSize: node.level === 1 ? "16px" : node.level === 2 ? "15px" : "14px",
              fontWeight: node.level === 1 ? 700 : node.level === 2 ? 600 : 500,
              paddingLeft: hasChildren ? 0 : "24px",
            }}
          >
            {node.text || "(Empty heading)"}
          </span>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map((child) => renderHeadingNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "border-l border-border flex flex-col transition-all duration-300 ease-in-out overflow-hidden bg-[#EBEBEB] dark:bg-[#2C2C2C]",
        // Mobile: full screen overlay below toolbar (60px + 60px = 120px total offset from top)
        "fixed top-[120px] left-0 right-0 bottom-0 w-full rounded-none",
        // Desktop: absolute right side within parent container
        "md:absolute md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-80",
        // Slide animation from right
        isOpen
          ? "translate-x-0"
          : "translate-x-full"
      )}
      style={{
        zIndex: 100
      }}
    >
      {/* Header with Tab Buttons */}
      <div className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between p-2">
          {/* Tab Buttons */}
          <div className="flex items-center gap-1 flex-1">
            <button
              onClick={() => setActiveTab('comments')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === 'comments'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
              title="Comments"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Comments</span>
              {comments.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-xs bg-primary-foreground/20 rounded-full">
                  {comments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === 'tools'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
              title="Tools"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Tools</span>
            </button>
            <button
              onClick={() => setActiveTab('toc')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === 'toc'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
              title="Table of Contents"
            >
              <BookText className="h-3.5 w-3.5" />
              <span>TOC</span>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-muted transition-colors flex-shrink-0"
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
            activeTab={activeCommentTab}
            onTabChange={onCommentTabChange}
          />
        )}
        {activeTab === 'tools' && (
          <div className="h-full overflow-y-auto">
            {/* Tool List View */}
            {!activeTool && (
              <div className="p-4 space-y-2">
                {tools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool.id)}
                      className="w-full text-left p-3 rounded-lg border transition-all bg-background hover:bg-muted/50 border-border"
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
                      editor={editor || null}
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
        {activeTab === 'toc' && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* TOC Header */}
            <div className="p-4 border-b">
              <h3 className="text-sm font-semibold">Table of Contents</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {headings.length === 0 ? "No headings yet" : `${countTotalHeadings(headings)} headings`}
              </p>
            </div>

            {/* TOC List */}
            <div className="flex-1 overflow-y-auto p-3">
              {headings.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-12 px-4">
                  Add headings to your document to see the outline here.
                </div>
              ) : (
                <div className="space-y-1">
                  {headings.map((heading) => renderHeadingNode(heading))}
                </div>
              )}
            </div>

            {/* TOC Footer */}
            <div className="p-3 border-t text-xs text-muted-foreground text-center">
              Click any heading to jump to it
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
