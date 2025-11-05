'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Strike from '@tiptap/extension-strike'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Typography from '@tiptap/extension-typography'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import HardBreak from '@tiptap/extension-hard-break'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TiptapHeading from '@tiptap/extension-heading'
import TiptapParagraph from '@tiptap/extension-paragraph'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AppSidebar } from '@/components/app-sidebar'
import { marked } from 'marked'
import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Code,
  Quote,
  Undo,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Highlighter,
  Palette,
  Type,
  SeparatorHorizontal,
  SeparatorVertical,
  CheckSquare,
  TextSelect,
  MessageSquare,
  Sparkles,
  Send,
  Wand2,
  Plus,
  Minimize2,
  RotateCw,
  ArrowRight,
  Smile,
  Search,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  Wrench,
  AlignJustify,
  Eraser,
  FileText,
  Code2,
  PanelLeft,
  X,
  BookMarked,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import CommentExtension, { Comment } from './CommentExtension'
import CommentsPanel, { AddCommentForm } from './CommentsPanel'
import { AIBubbleMenuContent } from './AIBubbleMenu'
import { BubbleMenuV0, AIAction } from './BubbleMenuV0'
import { StreamingExtension, updateStreamingState } from './StreamingExtension'
import { TabbedSidePanel } from './TabbedSidePanel'
import { useDocumentContent } from '@/hooks/useDocumentContent'
import { LineHeight } from './LineHeightExtension'
import TurndownService from 'turndown'
import '@/styles/comments.css'
import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { TableOfContents } from './TableOfContents'
import { MultiPageRenderer } from './MultiPageRenderer'
import { ExportModal } from './ExportModal'

// Constants extracted outside component for performance
const TEXT_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
] as const

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Orange', value: '#fed7aa' },
  { name: 'Red', value: '#fecaca' },
  { name: 'None', value: 'transparent' },
] as const

const FONT_FAMILIES = [
  { name: 'Default', value: 'inherit' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
] as const

const FONT_SIZES = [
  '8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'
] as const

const LINE_HEIGHTS = [
  '1', '1.15', '1.2', '1.3', '1.4', '1.5', '1.6', '1.75', '2', '2.5', '3'
] as const

const SPACING_OPTIONS = [
  { name: 'None', value: '0' },
  { name: 'Small', value: '0.5rem' },
  { name: 'Medium', value: '1rem' },
  { name: 'Large', value: '1.5rem' },
  { name: 'Extra Large', value: '2rem' },
] as const

// FontSize extension - extends TextStyle to support fontSize attribute
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})

// Custom placeholder extension to avoid version conflicts
const CustomPlaceholder = Extension.create({
  name: 'placeholder',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: ({ doc, selection }, view) => {
            const decorations: any[] = []
            const isEmpty = doc.textContent.length === 0
            const isFocused = view?.hasFocus?.() ?? false

            // Only show placeholder if document is empty AND editor is not focused
            if (isEmpty && !isFocused) {
              doc.descendants((node, pos) => {
                if (node.type.name === 'paragraph' && pos === 0) {
                  const decoration = Decoration.node(pos, pos + node.nodeSize, {
                    class: 'is-editor-empty',
                    'data-placeholder': 'Start typing here...',
                  })
                  decorations.push(decoration)
                  return false
                }
              })
            }

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})

// Custom Heading extension with margin support
const Heading = TiptapHeading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      marginTop: {
        default: null,
        parseHTML: element => element.style.marginTop || null,
        renderHTML: attributes => {
          return {}
        },
      },
      marginBottom: {
        default: null,
        parseHTML: element => element.style.marginBottom || null,
        renderHTML: attributes => {
          return {}
        },
      },
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    const styles = []
    // Use !important to override prose class defaults
    if (HTMLAttributes.marginTop) {
      styles.push(`margin-top: ${HTMLAttributes.marginTop} !important`)
    }
    if (HTMLAttributes.marginBottom) {
      styles.push(`margin-bottom: ${HTMLAttributes.marginBottom} !important`)
    }
    // Include lineHeight from LineHeight extension
    if (node.attrs.lineHeight) {
      styles.push(`line-height: ${node.attrs.lineHeight}`)
    }

    const hasStyle = styles.length > 0
    return [
      `h${node.attrs.level}`,
      {
        ...HTMLAttributes,
        style: hasStyle ? styles.join('; ') : undefined,
      },
      0,
    ]
  },
})

// Custom Paragraph extension with margin support
const Paragraph = TiptapParagraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      marginTop: {
        default: null,
        parseHTML: element => element.style.marginTop || null,
        renderHTML: attributes => {
          return {}
        },
      },
      marginBottom: {
        default: null,
        parseHTML: element => element.style.marginBottom || null,
        renderHTML: attributes => {
          return {}
        },
      },
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    const styles = []
    // Use !important to override prose class defaults
    if (HTMLAttributes.marginTop) {
      styles.push(`margin-top: ${HTMLAttributes.marginTop} !important`)
    }
    if (HTMLAttributes.marginBottom) {
      styles.push(`margin-bottom: ${HTMLAttributes.marginBottom} !important`)
    }
    // Include lineHeight from LineHeight extension
    if (node.attrs.lineHeight) {
      styles.push(`line-height: ${node.attrs.lineHeight}`)
    }

    const hasStyle = styles.length > 0
    return [
      'p',
      {
        ...HTMLAttributes,
        style: hasStyle ? styles.join('; ') : undefined,
      },
      0,
    ]
  },
})

const MenuButton = React.forwardRef<HTMLButtonElement, {
  onClick: (e?: React.MouseEvent) => void,
  isActive?: boolean,
  disabled?: boolean,
  children: React.ReactNode,
  title?: string
}>(({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title = ''
}, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{ pointerEvents: 'auto' }}
      className={cn(
        "p-2 rounded-md transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted text-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  )
})

MenuButton.displayName = 'MenuButton'

const ColorSelector = React.memo(({
  editor
}: {
  editor: any
}) => {
  const [customColor, setCustomColor] = useState('#000000')

  return (
    <div className="p-3 bg-background border rounded-md shadow-lg w-80">
      <div className="mb-2 text-sm font-medium">Text Color</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {TEXT_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => editor.chain().focus().setColor(color.value).run()}
            className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>
      <div className="border-t pt-3">
        <label className="text-xs text-muted-foreground mb-1 block">Custom Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-12 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="flex-1 px-2 py-1 border rounded text-sm"
            placeholder="#000000"
          />
          <button
            onClick={() => editor.chain().focus().setColor(customColor).run()}
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </div>
      <button
        onClick={() => editor.chain().focus().unsetColor().run()}
        className="w-full mt-2 px-2 py-1 border rounded text-sm hover:bg-muted"
      >
        Remove Color
      </button>
    </div>
  )
})

const HighlightColorSelector = React.memo(({
  editor
}: {
  editor: any
}) => {
  const [customColor, setCustomColor] = useState('#ffff00')

  return (
    <div className="p-3 bg-background border rounded-md shadow-lg w-80">
      <div className="mb-2 text-sm font-medium">Highlight Color</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}
            className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>
      <div className="border-t pt-3">
        <label className="text-xs text-muted-foreground mb-1 block">Custom Highlight</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-12 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="flex-1 px-2 py-1 border rounded text-sm"
            placeholder="#ffff00"
          />
          <button
            onClick={() => editor.chain().focus().toggleHighlight({ color: customColor }).run()}
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </div>
      <button
        onClick={() => editor.chain().focus().unsetHighlight().run()}
        className="w-full mt-2 px-2 py-1 border rounded text-sm hover:bg-muted"
      >
        Remove Highlight
      </button>
    </div>
  )
})

const FontSelector = React.memo(({
  editor,
  onClose
}: {
  editor: any
  onClose?: () => void
}) => {
  const [fonts, setFonts] = useState<Array<{ family: string; category: string }>>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const currentFont = editor?.getAttributes('textStyle')?.fontFamily || 'system-ui'

  // Load Google Fonts
  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY || ''
        console.log('🔑 TiptapEditor - Google Fonts API Key available:', !!API_KEY)
        if (!API_KEY) {
          console.error('❌ TiptapEditor - Google Fonts API key not configured in environment variables')
          throw new Error('Google Fonts API key not configured')
        }
        const response = await fetch(
          `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=popularity`
        )
        const data = await response.json()
        console.log('📡 TiptapEditor - Google Fonts API response:', { hasItems: !!data?.items, itemCount: data?.items?.length })

        if (data && data.items && Array.isArray(data.items)) {
          const allFonts = data.items.map((font: any) => ({
            family: font.family,
            category: font.category,
          }))
          setFonts(allFonts)
        } else {
          throw new Error('Invalid API response')
        }
        setLoading(false)
      } catch (error) {
        console.error('Failed to load Google Fonts:', error)
        // Fallback to common fonts
        setFonts([
          { family: 'Roboto', category: 'sans-serif' },
          { family: 'Open Sans', category: 'sans-serif' },
          { family: 'Lato', category: 'sans-serif' },
          { family: 'Montserrat', category: 'sans-serif' },
          { family: 'Poppins', category: 'sans-serif' },
          { family: 'Playfair Display', category: 'serif' },
          { family: 'Merriweather', category: 'serif' },
          { family: 'Inter', category: 'sans-serif' },
        ])
        setLoading(false)
      }
    }
    fetchFonts()
  }, [])

  // Filter fonts based on search
  const filteredFonts = useMemo(() => {
    if (!searchQuery) return fonts.slice(0, 100) // Show first 100 by default
    const query = searchQuery.toLowerCase()
    return fonts.filter((font) =>
      font.family.toLowerCase().includes(query)
    ).slice(0, 100)
  }, [fonts, searchQuery])

  // Load font dynamically
  const loadFont = useCallback((fontFamily: string) => {
    const link = document.createElement('link')
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
      / /g,
      '+'
    )}:wght@400;700&display=swap`
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }, [])

  // Handle font selection
  const handleSelectFont = (fontFamily: string) => {
    loadFont(fontFamily)
    editor?.chain().focus().setFontFamily(fontFamily).run()
    onClose?.()
  }

  // Focus search input on mount
  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }, [])

  return (
    <div className="bg-background border rounded-md shadow-lg w-80 max-h-[400px] flex flex-col" onClick={(e) => e.stopPropagation()}>
      {/* Search Input */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fonts..."
            className="w-full pl-9 pr-8 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted-foreground/10 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Font List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading fonts...
          </div>
        ) : filteredFonts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No fonts found
          </div>
        ) : (
          <div className="py-1">
            {/* System UI font first */}
            <button
              onClick={() => handleSelectFont('system-ui')}
              className={`w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm ${
                currentFont === 'system-ui' ? 'bg-muted' : ''
              }`}
              style={{ fontFamily: 'system-ui' }}
            >
              System UI (Default)
            </button>

            {/* Google Fonts */}
            {filteredFonts.map((font) => {
              // Load font on demand
              loadFont(font.family)

              return (
                <button
                  key={font.family}
                  onClick={() => handleSelectFont(font.family)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-0 ${
                    currentFont === font.family ? 'bg-muted' : ''
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">{font.family}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {font.category}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && filteredFonts.length > 0 && (
        <div className="p-2 border-t border-border bg-muted/50 text-xs text-muted-foreground text-center">
          {searchQuery ? `${filteredFonts.length} fonts found` : `${fonts.length} fonts available`} • Powered by Google Fonts
        </div>
      )}
    </div>
  )
})

const HeadingSelector = React.memo(({
  editor
}: {
  editor: any
}) => {
  const headings = React.useMemo(() => [
    { name: 'Paragraph', level: 0, command: () => editor.chain().focus().setParagraph().run() },
    { name: 'Heading 1', level: 1, command: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { name: 'Heading 2', level: 2, command: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { name: 'Heading 3', level: 3, command: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { name: 'Heading 4', level: 4, command: () => editor.chain().focus().toggleHeading({ level: 4 }).run() },
    { name: 'Heading 5', level: 5, command: () => editor.chain().focus().toggleHeading({ level: 5 }).run() },
    { name: 'Heading 6', level: 6, command: () => editor.chain().focus().toggleHeading({ level: 6 }).run() },
  ], [editor])

  return (
    <div className="p-2 bg-background border rounded-md shadow-lg w-44">
      <div className="mb-1 text-xs font-medium text-muted-foreground px-2">Text Style</div>
      {headings.map((heading) => (
        <button
          key={heading.level}
          onClick={heading.command}
          className={cn(
            "w-full px-3 py-2 text-left hover:bg-muted rounded text-sm",
            (heading.level === 0 && editor.isActive('paragraph')) || editor.isActive('heading', { level: heading.level }) ? 'bg-muted' : ''
          )}
        >
          {heading.name}
        </button>
      ))}
    </div>
  )
})

const FontSizeSelector = React.memo(({
  editor
}: {
  editor: any
}) => {
  const applyFontSize = React.useCallback((size: string) => {
    // Apply font size with pt unit (matching Google Docs)
    editor.chain().focus().setMark('textStyle', { fontSize: `${size}pt` }).run()
  }, [editor])

  return (
    <div className="p-2 bg-background border rounded-md shadow-lg w-40 max-h-80 overflow-y-auto">
      {FONT_SIZES.map((size) => (
        <button
          key={size}
          onClick={() => applyFontSize(size)}
          className="w-full px-3 py-1.5 text-left hover:bg-muted rounded text-sm"
        >
          {size}
        </button>
      ))}
    </div>
  )
})

const LineHeightSelector = React.memo(({
  editor
}: {
  editor: any
}) => {
  return (
    <div className="p-2 bg-background border rounded-md shadow-lg w-32">
      {LINE_HEIGHTS.map((height) => (
        <button
          key={height}
          onClick={() => editor.chain().focus().setLineHeight(height).run()}
          className="w-full px-3 py-1.5 text-left hover:bg-muted rounded text-sm"
        >
          {height}
        </button>
      ))}
    </div>
  )
})

const SpacingSelector = React.memo(({
  editor
}: {
  editor: any
}) => {
  const spacingPresets = React.useMemo(() => [
    { label: 'No space', top: '0', bottom: '0' },
    { label: 'Compact', top: '0.25em', bottom: '0.25em' },
    { label: 'Normal', top: '0.5em', bottom: '0.5em' },
    { label: 'Relaxed', top: '0.75em', bottom: '0.75em' },
    { label: 'Loose', top: '1em', bottom: '1em' },
  ], [])

  const applySpacing = React.useCallback((top: string, bottom: string) => {
    // Get current selection or cursor position
    const { from, to } = editor.state.selection

    // Check if we're in a heading
    let isHeading = false
    for (let level = 1; level <= 6; level++) {
      if (editor.isActive('heading', { level })) {
        editor.commands.updateAttributes('heading', {
          marginTop: top,
          marginBottom: bottom
        })
        isHeading = true
        break
      }
    }

    // If not in a heading, apply to paragraph
    if (!isHeading && editor.isActive('paragraph')) {
      editor.commands.updateAttributes('paragraph', {
        marginTop: top,
        marginBottom: bottom
      })
    }
  }, [editor])

  return (
    <div className="p-3 bg-background border rounded-md shadow-lg w-56">
      <div className="mb-2 text-sm font-medium">Paragraph Spacing</div>
      <div className="space-y-1">
        {spacingPresets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => applySpacing(preset.top, preset.bottom)}
            className="w-full px-3 py-2 text-left hover:bg-muted rounded text-sm border"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
})

interface TiptapEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onCommentsChange?: (comments: Comment[]) => void;
  toolbarActions?: React.ReactNode;
  onAIEdit?: (selectedText: string, instruction: string, enableWebSearch?: boolean) => void;
  selectedModel?: string;
  onToggleSidebar?: () => void;
  isSidebarVisible?: boolean;
  selectedDocumentId?: string;
  onDocumentSelect?: (documentId: string) => void;
  onToggleCommentsPanel?: () => void;
  onSetPanelTab?: (tab: 'comments' | 'tools') => void;
}

const savedContent = typeof window !== 'undefined' ? localStorage.getItem('tiptap-document') : null;
const initialComments = typeof window !== 'undefined' ? localStorage.getItem('tiptap-comments') : null;

export default function TiptapEditor({ initialContent, onContentChange, onCommentsChange, toolbarActions, onAIEdit, selectedModel, onToggleSidebar, isSidebarVisible, selectedDocumentId, onDocumentSelect, onToggleCommentsPanel, onSetPanelTab }: TiptapEditorProps = {}) {
  const { theme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)
  // Consolidated dropdown state for performance
  const [dropdownStates, setDropdownStates] = useState({
    showColorSelector: false,
    showHighlightSelector: false,
    showFontSelector: false,
    showHeadingSelector: false,
    showFontSizeSelector: false,
    showLineHeightSelector: false,
    showSpacingSelector: false,
    showViewModeSelector: false,
  })

  // Consolidated dropdown positions for performance
  const [dropdownPositions, setDropdownPositions] = useState<{
    color: { top: number; left: number } | null
    highlight: { top: number; left: number } | null
    font: { top: number; left: number } | null
    fontSize: { top: number; left: number } | null
    lineHeight: { top: number; left: number } | null
    spacing: { top: number; left: number } | null
    heading: { top: number; left: number } | null
    viewMode: { top: number; left: number } | null
  }>({
    color: null,
    highlight: null,
    font: null,
    fontSize: null,
    lineHeight: null,
    spacing: null,
    heading: null,
    viewMode: null,
  })

  const [viewMode, setViewMode] = useState<'editor' | 'html' | 'markdown'>('editor')
  const [rawText, setRawText] = useState('') // Stores raw HTML or Markdown
  const [comments, setComments] = useState<Comment[]>(initialComments ? JSON.parse(initialComments) : [])

  const isInternalUpdate = useRef(false) // Flag to prevent circular updates
  const hasUserInteracted = useRef(false) // Track if user has clicked/edited the document
  const colorButtonRef = useRef<HTMLButtonElement>(null)
  const highlightButtonRef = useRef<HTMLButtonElement>(null)
  const fontButtonRef = useRef<HTMLButtonElement>(null)
  const fontSizeButtonRef = useRef<HTMLButtonElement>(null)
  const lineHeightButtonRef = useRef<HTMLButtonElement>(null)
  const headingButtonRef = useRef<HTMLButtonElement>(null)
  const spacingButtonRef = useRef<HTMLButtonElement>(null)
  const viewModeButtonRef = useRef<HTMLButtonElement>(null)

  // Memoized helper function to close all dropdowns
  const closeAllDropdowns = useCallback(() => {
    setDropdownStates({
      showColorSelector: false,
      showHighlightSelector: false,
      showFontSelector: false,
      showHeadingSelector: false,
      showFontSizeSelector: false,
      showLineHeightSelector: false,
      showSpacingSelector: false,
      showViewModeSelector: false,
    })
  }, [])

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Check if click is on a dropdown or dropdown button
      const isDropdownClick = target.closest('[data-dropdown]') || target.closest('[data-dropdown-menu]')

      if (!isDropdownClick) {
        closeAllDropdowns()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)

  useEffect(() => {
    if (onCommentsChange) {
      onCommentsChange(comments);
    }
    localStorage.setItem('tiptap-comments', JSON.stringify(comments));
  }, [comments, onCommentsChange]);
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<'comments' | 'tools'>('comments')
  const [activeTool, setActiveTool] = useState<'stats' | 'find' | 'readability' | 'headings' | 'replace' | 'toc' | 'duplicates' | null>(null)
  const [activeCommentTab, setActiveCommentTab] = useState<'active' | 'resolved'>('active')
  const [showAddCommentForm, setShowAddCommentForm] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [aiInstruction, setAiInstruction] = useState('')
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [isInlineProcessing, setIsInlineProcessing] = useState(false)
  const [isDocumentsPanelOpen, setIsDocumentsPanelOpen] = useState(false)
  const [isTocOpen, setIsTocOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Get document content store for animations
  const { setEditor: registerEditor } = useDocumentContent()

  // Debounce timers for performance optimization
  const selectionDebounceTimer = useRef<NodeJS.Timeout | null>(null)
  const contentDebounceTimer = useRef<NodeJS.Timeout | null>(null)
  const localStorageDebounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Memoized callbacks for editor events to prevent re-initialization
  const handleEditorUpdate = useCallback(({ editor }: { editor: any }) => {
    const json = editor.getJSON();

    // Debounce localStorage writes (300ms delay)
    if (localStorageDebounceTimer.current) {
      clearTimeout(localStorageDebounceTimer.current);
    }
    localStorageDebounceTimer.current = setTimeout(() => {
      localStorage.setItem('tiptap-document', JSON.stringify(json));
    }, 300);

    // Debounce expensive HTML conversion and parent callback (150ms delay)
    if (onContentChange && !isInternalUpdate.current) {
      if (contentDebounceTimer.current) {
        clearTimeout(contentDebounceTimer.current);
      }
      contentDebounceTimer.current = setTimeout(() => {
        const html = editor.getHTML();
        onContentChange(html);
      }, 150);
    }
  }, [onContentChange]);

  const handleSelectionUpdate = useCallback(({ editor }: { editor: any }) => {
    // Debounce selection updates to prevent state changes on every keystroke (100ms delay)
    if (selectionDebounceTimer.current) {
      clearTimeout(selectionDebounceTimer.current);
    }
    selectionDebounceTimer.current = setTimeout(() => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      setSelectedText(text);
    }, 100);
  }, []);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (selectionDebounceTimer.current) clearTimeout(selectionDebounceTimer.current);
      if (contentDebounceTimer.current) clearTimeout(contentDebounceTimer.current);
      if (localStorageDebounceTimer.current) clearTimeout(localStorageDebounceTimer.current);
    };
  }, []);

  // Initialize the editor
  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        // Disable these extensions in StarterKit since we're adding them separately below
        strike: false,
        horizontalRule: false,
        hardBreak: false,
        heading: false,
        paragraph: false,
      }),
      // Add custom Heading and Paragraph with margin support
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      Paragraph,
      Link.configure({
        openOnClick: false,
      }),
      Strike,
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      LineHeight,
      Typography,
      HorizontalRule,
      HardBreak,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CommentExtension.configure({
        onCommentActivated: (commentId) => {
          if (commentId) {
            setIsCommentsPanelOpen(true);
            setActiveCommentId(commentId);
          }
        },
      }),
      CustomPlaceholder,
      StreamingExtension,
    ],
    content: initialContent || (savedContent ? JSON.parse(savedContent) : `<h1>Welcome to Document Editor</h1><p>Start typing or use the AI chat to generate content. Try these features:</p><ul><li><strong>AI Chat</strong> - Ask the AI to write, edit, or research content</li><li><strong>Markdown Support</strong> - Toggle between rich text and raw markdown</li><li><strong>Comments</strong> - Add comments to any text selection</li><li><strong>Formatting</strong> - Use the toolbar or bubble menu for formatting</li></ul><p>Select any text to see AI editing options, or start a conversation in the chat panel on the left.</p>`),
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none w-full !max-w-none min-h-[calc(100vh-16rem)] [&_h1]:text-2xl [&_h1]:sm:text-3xl [&_h1]:lg:text-4xl [&_p]:!my-0 [&_h1]:!my-0 [&_h2]:!my-0 [&_h3]:!my-0 [&_h4]:!my-0 [&_h5]:!my-0 [&_h6]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0',
        style: 'font-size: 11pt; line-height: 1.15;',
      },
    },
    onUpdate: handleEditorUpdate,
    onSelectionUpdate: handleSelectionUpdate,
  });

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Register editor instance for streaming animations
  useEffect(() => {
    if (editor) {
      registerEditor(editor)
    }
    return () => {
      registerEditor(null)
    }
  }, [editor, registerEditor])


  // Update editor content when initialContent prop changes (ONLY from external sources like Morph)
  // DO NOT update on every keystroke - this would reset the cursor!
  useEffect(() => {
    if (!editor || !initialContent) return;

    const currentHTML = editor.getHTML();

    // Only update if content is ACTUALLY different (not just a re-render)
    // This prevents cursor jumping during normal typing
    if (initialContent !== currentHTML) {
      console.log('🔄 [EDITOR] initialContent changed externally, updating editor');
      console.log('  initialContent length:', initialContent.length);
      console.log('  currentHTML length:', currentHTML.length);

      // Reset interaction flag when switching documents
      const emptyContent = '<p></p>'
      if (initialContent === emptyContent || !initialContent) {
        hasUserInteracted.current = false
      } else {
        hasUserInteracted.current = true
      }

      // Use isInternalUpdate flag to prevent triggering onUpdate
      isInternalUpdate.current = true;
      editor.commands.setContent(initialContent);

      // Reset flag after a short delay to allow the update to complete
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 10);
    }
  }, [editor, initialContent]);

  // Expose comments panel toggle for external control (from navigation menu)
  useEffect(() => {
    // Handle the new doc-set-panel event with mutual exclusivity
    const handleSetPanel = (event: CustomEvent) => {
      const { tab, open } = event.detail;

      if (tab === 'comments') {
        // If already on comments and panel is open, toggle it off
        if (panelTab === 'comments' && isCommentsPanelOpen && !open) {
          setIsCommentsPanelOpen(false);
        } else {
          // Otherwise open comments panel (replacing tools if needed)
          setIsCommentsPanelOpen(true);
          setPanelTab('comments');
        }
      } else if (tab === 'tools') {
        // If already on tools and panel is open, toggle it off
        if (panelTab === 'tools' && isCommentsPanelOpen && !open) {
          setIsCommentsPanelOpen(false);
        } else {
          // Otherwise open tools panel (replacing comments if needed)
          setIsCommentsPanelOpen(true);
          setPanelTab('tools');
        }
      }
    };

    // Handle filter changes for comments
    const handleCommentsFilter = (event: CustomEvent) => {
      const filter = event.detail; // 'all', 'active', or 'resolved'
      console.log('Filter comments:', filter);

      // Ensure comments panel is open
      setIsCommentsPanelOpen(true);
      setPanelTab('comments');

      // Set the appropriate tab
      if (filter === 'all') {
        setActiveCommentTab('active'); // Default to active when showing all
      } else if (filter === 'active') {
        setActiveCommentTab('active');
      } else if (filter === 'resolved') {
        setActiveCommentTab('resolved');
      }
    };

    // Handle individual tool opening
    const handleOpenTool = (event: CustomEvent) => {
      const toolId = event.detail;
      console.log('Open tool:', toolId);
      // Open tools panel and select specific tool
      setIsCommentsPanelOpen(true);
      setPanelTab('tools');
      setActiveTool(toolId);
    };

    // Handler for toggling documents panel from navigation
    const handleToggleDocumentsPanel = () => {
      console.log('📂 [TIPTAP] Toggling documents panel from:', isDocumentsPanelOpen, 'to:', !isDocumentsPanelOpen);
      setIsDocumentsPanelOpen(!isDocumentsPanelOpen);
      onToggleSidebar?.();
    };

    window.addEventListener('doc-set-panel', handleSetPanel as EventListener);
    window.addEventListener('doc-comments-filter', handleCommentsFilter as EventListener);
    window.addEventListener('doc-open-tool', handleOpenTool as EventListener);
    window.addEventListener('toggle-documents-panel', handleToggleDocumentsPanel);

    return () => {
      window.removeEventListener('doc-set-panel', handleSetPanel as EventListener);
      window.removeEventListener('doc-comments-filter', handleCommentsFilter as EventListener);
      window.removeEventListener('doc-open-tool', handleOpenTool as EventListener);
      window.removeEventListener('toggle-documents-panel', handleToggleDocumentsPanel);
    };
  }, [isCommentsPanelOpen, panelTab, isDocumentsPanelOpen]);

  // Notify parent component about panel state changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('doc-panel-state', {
      detail: { open: isCommentsPanelOpen, tab: panelTab }
    }));
  }, [isCommentsPanelOpen, panelTab]);

  // Add a new comment
  const handleAddComment = () => {
    if (!editor || !selectedText) return

    setShowAddCommentForm(true)
  }

  // Handle AI edit of selected text (for custom instruction)
  const handleAIEdit = () => {
    if (!editor || !selectedText || !aiInstruction.trim()) return

    // Call the onAIEdit callback if provided
    if (onAIEdit) {
      onAIEdit(selectedText, aiInstruction);
    }

    // Clear the instruction input
    setAiInstruction('');
    setShowAIMenu(false);
  }

  // Simple HTML prettifier
  const prettifyHTML = (html: string): string => {
    let formatted = '';
    let indent = 0;
    const tab = '  '; // 2 spaces

    // Remove extra whitespace and split by tags
    html = html.replace(/>\s+</g, '><').trim();

    // Self-closing and inline tags that shouldn't add newlines
    const inlineTags = ['br', 'img', 'input', 'hr', 'meta', 'link', 'strong', 'em', 'span', 'a', 'b', 'i', 'u', 'code'];
    const selfClosing = ['br', 'img', 'input', 'hr', 'meta', 'link'];

    const parts = html.split(/(<[^>]+>)/g).filter(Boolean);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part.startsWith('<')) {
        const tagMatch = part.match(/<\/?(\w+)/);
        const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
        const isInline = inlineTags.includes(tagName);
        const isSelfClosing = selfClosing.includes(tagName);
        const isClosing = part.startsWith('</');
        const isOpening = !isClosing && !isSelfClosing;

        if (isClosing) {
          indent = Math.max(0, indent - 1);
          if (!isInline) {
            formatted += '\n' + tab.repeat(indent);
          }
          formatted += part;
        } else {
          if (!isInline && formatted.length > 0) {
            formatted += '\n' + tab.repeat(indent);
          }
          formatted += part;
          if (isOpening && !isInline) {
            indent++;
          }
        }
      } else if (part.trim()) {
        // Text content
        formatted += part.trim();
      }
    }

    return formatted;
  };

  // Handle view mode toggle
  const handleViewModeChange = async (newMode: 'editor' | 'html' | 'markdown') => {
    if (!editor) return;

    // When leaving editor mode, save the content
    if (viewMode === 'editor' && newMode !== 'editor') {
      const html = editor.getHTML();
      if (newMode === 'markdown') {
        // Convert HTML to Markdown using ATX-style headings (# syntax)
        const turndownService = new TurndownService({
          headingStyle: 'atx',  // Use # for headings instead of underlines
          codeBlockStyle: 'fenced',  // Use ``` for code blocks
        });
        const markdown = turndownService.turndown(html);
        setRawText(markdown);
      } else {
        // HTML mode - prettify the HTML
        const prettyHtml = prettifyHTML(html);
        setRawText(prettyHtml);
      }
    }

    // When switching back to editor mode, restore the content
    if (viewMode !== 'editor' && newMode === 'editor') {
      let htmlToRestore = rawText;

      // If coming from markdown, convert to HTML first
      if (viewMode === 'markdown') {
        htmlToRestore = await marked(rawText) as string;
      }

      isInternalUpdate.current = true;
      editor.commands.setContent(htmlToRestore);
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 10);
    }

    // Convert between HTML and Markdown when both are code views
    if (newMode === 'markdown' && viewMode === 'html') {
      const turndownService = new TurndownService({
        headingStyle: 'atx',  // Use # for headings instead of underlines
        codeBlockStyle: 'fenced',  // Use ``` for code blocks
      });
      const markdown = turndownService.turndown(rawText);
      setRawText(markdown);
    } else if (newMode === 'html' && viewMode === 'markdown') {
      const html = await marked(rawText) as string;
      const prettyHtml = prettifyHTML(html);
      setRawText(prettyHtml);
    }

    setViewMode(newMode);
  };

  // Handle inline AI actions (replace text directly in editor)
  const handleInlineAction = async (action: string) => {
    if (!editor || !selectedText) return

    setIsInlineProcessing(true);
    setShowAIMenu(false);

    const { from, to } = editor.state.selection;

    try {
      // Get instruction based on action
      const instructions: Record<string, string> = {
        improve: 'Polish and enhance this text, making it more professional and clear',
        expand: 'Add more detail and elaboration to this text',
        simplify: 'Make this text clearer and easier to understand',
        rewrite: 'Rewrite this text in a different way while keeping the same meaning',
        continue: 'Continue writing from where this text ends',
        'change-tone-formal': 'Rewrite this text in a more formal and professional tone',
        'change-tone-casual': 'Rewrite this text in a more casual and relaxed tone',
        'change-tone-professional': 'Rewrite this text in a professional business tone',
        'change-tone-friendly': 'Rewrite this text in a warm and friendly tone',
      };

      const instruction = instructions[action] || 'Improve this text';

      // Delete the selected text first
      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .run();

      // Initialize streaming state
      updateStreamingState(editor.view, {
        isStreaming: true,
        from,
        to: from,
        streamedText: '',
        cursorPos: 0,
      });

      // Call the inline edit API with streaming
      const response = await fetch('/api/inline-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          instruction,
          model: selectedModel || 'anthropic/claude-haiku-4-5-20251001'
        })
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      // Stream the response character by character
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;

        // Insert the new characters
        editor.chain()
          .focus()
          .insertContentAt(from + fullText.length - chunk.length, chunk)
          .run();

        // Update streaming cursor position
        updateStreamingState(editor.view, {
          cursorPos: fullText.length,
          streamedText: fullText,
          to: from + fullText.length,
        });

        // Small delay for typewriter effect (30ms per chunk)
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      // Clean up streaming state after a brief delay
      setTimeout(() => {
        updateStreamingState(editor.view, {
          isStreaming: false,
          from: 0,
          to: 0,
          streamedText: '',
          cursorPos: 0,
        });
      }, 500);

    } catch (error) {
      console.error('Inline edit failed:', error);
      // Reset streaming state on error
      updateStreamingState(editor.view, {
        isStreaming: false,
        from: 0,
        to: 0,
        streamedText: '',
        cursorPos: 0,
      });
    } finally {
      setIsInlineProcessing(false);
    }
  }

  // Handle chat actions (send to chat)
  const handleChatAction = (action: string, additionalContext?: string, enableWebSearch?: boolean) => {
    if (!editor || !selectedText || !onAIEdit) return

    // Create instruction with action type marker so chat-doc can format appropriately
    let instruction = '';

    if (action === 'research') {
      instruction = `[ACTION:RESEARCH]${additionalContext || ''}\n\n${selectedText}`;
    } else if (action === 'ask-ai-edit') {
      instruction = `[ACTION:EDIT]${additionalContext || ''}\n\n${selectedText}`;
    } else if (action === 'ask-ai-question') {
      instruction = `[ACTION:QUESTION]${additionalContext || ''}\n\n${selectedText}`;
    } else {
      instruction = additionalContext || selectedText;
    }

    onAIEdit(selectedText, instruction, enableWebSearch);
    setShowAIMenu(false);
  }
  
  // Submit a new comment
  const handleCommentSubmit = (text: string) => {
    if (!editor || !selectedText) return
    
    const newCommentId = uuidv4()
    const newComment: Comment = {
      id: newCommentId,
      text,
      from: editor.state.selection.from,
      to: editor.state.selection.to,
      createdAt: new Date(),
      author: 'You', // In a real app, get this from user context
      resolved: false
    }
    
    // Add comment to state
    setComments(prev => [...prev, newComment])
    
    // Apply comment decoration to selected text
    editor.commands.setComment(newCommentId)
    
    // Reset UI state
    setShowAddCommentForm(false)
    setActiveCommentId(newCommentId)
    setIsCommentsPanelOpen(true)
  }
  
  // Handle comment click
  const handleCommentClick = (commentId: string) => {
    setActiveCommentId(commentId)
    
    // Find the comment and scroll to its position
    const comment = comments.find(c => c.id === commentId)
    if (comment && editor) {
      editor.commands.setTextSelection({ from: comment.from, to: comment.to })
    }
  }
  
  // Resolve a comment
  const handleCommentResolve = (commentId: string) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, resolved: !comment.resolved } 
          : comment
      )
    )
  }
  
  // Delete a comment
  const handleCommentDelete = (commentId: string) => {
    // Remove comment from state
    setComments(prev => prev.filter(comment => comment.id !== commentId))
    
    // Remove comment decoration
    if (editor) {
      editor.commands.unsetComment(commentId)
    }
    
    // Reset active comment if needed
    if (activeCommentId === commentId) {
      setActiveCommentId(null)
    }
  }

  // Memoize active heading level to avoid multiple isActive() calls
  const activeHeading = React.useMemo(() => {
    if (!editor) return null
    for (let level = 1; level <= 6; level++) {
      if (editor.isActive('heading', { level })) {
        return level
      }
    }
    return 0 // Paragraph
  }, [editor, editor?.state?.selection]) // Re-compute when selection changes

  if (!isMounted) {
    return null
  }

  if (!editor) {
    return <div>Loading editor...</div>
  }

  return (
    <>
      <div className="h-full flex flex-col w-full overflow-x-hidden overflow-y-hidden" style={{ position: 'relative', isolation: 'isolate' }}>
          {/* Toolbar - Google Docs style order */}
          <div className="flex items-center gap-1 p-2 pl-3 bg-[#EBEBEB] dark:bg-[#2C2C2C] border-b overflow-x-auto overflow-y-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1000 }}>

            {/* 1. Undo/Redo - FIRST */}
            <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
              <MenuButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => setIsExportModalOpen(true)}
                title="Export Document"
              >
                <Download className="h-4 w-4" />
              </MenuButton>
            </div>

            {/* 2. Heading selector (Normal text) */}
            <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
              <div className="relative" data-dropdown="heading">
                <MenuButton
                  ref={headingButtonRef}
                  onClick={(e) => {
                    e?.stopPropagation()
                    const wasOpen = dropdownStates.showHeadingSelector
                    closeAllDropdowns()
                    const btn = headingButtonRef.current
                    if (btn) {
                      const rect = btn.getBoundingClientRect()
                      setDropdownPositions(prev => ({ ...prev, heading: { top: rect.bottom + 4, left: rect.left } }))
                    }
                    setDropdownStates(prev => ({ ...prev, showHeadingSelector: !wasOpen }))
                  }}
                  title="Text Style"
                >
                  <div className="flex items-center gap-1">
                    {activeHeading === 1 ? (
                      <Heading1 className="h-4 w-4" />
                    ) : activeHeading === 2 ? (
                      <Heading2 className="h-4 w-4" />
                    ) : activeHeading === 3 ? (
                      <Heading3 className="h-4 w-4" />
                    ) : activeHeading === 4 ? (
                      <span className="text-xs font-semibold">H4</span>
                    ) : activeHeading === 5 ? (
                      <span className="text-xs font-semibold">H5</span>
                    ) : activeHeading === 6 ? (
                      <span className="text-xs font-semibold">H6</span>
                    ) : (
                      <span className="text-xs font-semibold">P</span>
                    )}
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </MenuButton>
              </div>
            </div>

            {/* 3. Font family */}
            <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
              <div className="relative" data-dropdown="font">
                <MenuButton
                  ref={fontButtonRef}
                  onClick={(e) => {
                    e?.stopPropagation()
                    const wasOpen = dropdownStates.showFontSelector
                    closeAllDropdowns()
                    const btn = fontButtonRef.current
                    if (btn) {
                      const rect = btn.getBoundingClientRect()
                      setDropdownPositions(prev => ({ ...prev, font: { top: rect.bottom + 4, left: rect.left } }))
                    }
                    setDropdownStates(prev => ({ ...prev, showFontSelector: !wasOpen }))
                  }}
                  title="Font Family"
                >
                  <div className="flex items-center gap-1">
                    {(() => {
                      try {
                        const fontFamily = editor?.getAttributes('textStyle')?.fontFamily
                        const currentFont = fontFamily || 'Default'
                        // Truncate long font names
                        const displayName = currentFont.length > 12
                          ? currentFont.substring(0, 12) + '...'
                          : currentFont
                        return <span className="text-xs font-medium min-w-[60px] text-left">{displayName}</span>
                      } catch (error) {
                        return <span className="text-xs font-medium min-w-[60px] text-left">Default</span>
                      }
                    })()}
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </MenuButton>
              </div>
            </div>

            {/* 4. Font size */}
            <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
              <div className="relative" data-dropdown="fontsize">
                <MenuButton
                  ref={fontSizeButtonRef}
                  onClick={(e) => {
                    e?.stopPropagation()
                    const wasOpen = dropdownStates.showFontSizeSelector
                    closeAllDropdowns()
                    const btn = fontSizeButtonRef.current
                    if (btn) {
                      const rect = btn.getBoundingClientRect()
                      setDropdownPositions(prev => ({ ...prev, fontSize: { top: rect.bottom + 4, left: rect.left } }))
                    }
                    setDropdownStates(prev => ({ ...prev, showFontSizeSelector: !wasOpen }))
                  }}
                  title="Font Size"
                >
                  <div className="flex items-center gap-1">
                    {(() => {
                      const fontSize = editor.getAttributes('textStyle').fontSize
                      return fontSize ? (
                        <span className="text-xs font-medium">{fontSize}</span>
                      ) : (
                        <span className="text-xs font-medium">11</span>
                      )
                    })()}
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </MenuButton>
              </div>
            </div>

            {/* 5. Bold, Italic, Underline */}
            <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
              <MenuButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                title="Underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                isActive={editor.isActive('subscript')}
                title="Subscript"
              >
                <SubscriptIcon className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                isActive={editor.isActive('superscript')}
                title="Superscript"
              >
                <SuperscriptIcon className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                title="Clear Formatting"
              >
                <Eraser className="h-4 w-4" />
              </MenuButton>
            </div>

            {/* 6. Text color */}
            <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
              <div className="relative" data-dropdown="color">
                <MenuButton
                  ref={colorButtonRef}
                  onClick={(e) => {
                    e?.stopPropagation()
                    const wasOpen = dropdownStates.showColorSelector
                    closeAllDropdowns()
                    const btn = colorButtonRef.current
                    if (btn) {
                      const rect = btn.getBoundingClientRect()
                      setDropdownPositions(prev => ({ ...prev, color: { top: rect.bottom + 4, left: rect.left } }))
                    }
                    setDropdownStates(prev => ({ ...prev, showColorSelector: !wasOpen }))
                  }}
                  isActive={editor.isActive('textStyle')}
                  title="Text Color"
                >
                  <Palette className="h-4 w-4" />
                </MenuButton>
              </div>
            </div>

            {/* 7. Highlight */}
            <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
              <div className="relative" data-dropdown="highlight">
                <MenuButton
                  ref={highlightButtonRef}
                  onClick={(e) => {
                    e?.stopPropagation()
                    const wasOpen = dropdownStates.showHighlightSelector
                    closeAllDropdowns()
                    const btn = highlightButtonRef.current
                    if (btn) {
                      const rect = btn.getBoundingClientRect()
                      setDropdownPositions(prev => ({ ...prev, highlight: { top: rect.bottom + 4, left: rect.left } }))
                    }
                    setDropdownStates(prev => ({ ...prev, showHighlightSelector: !wasOpen }))
                  }}
                  isActive={editor.isActive('highlight')}
                  title="Highlight Color"
                >
                  <Highlighter className="h-4 w-4" />
                </MenuButton>
              </div>
            </div>

            {/* 8. Link */}
            <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
              <MenuButton
                onClick={() => {
                  const url = window.prompt('URL')
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run()
                  }
                }}
                isActive={editor.isActive('link')}
                title="Insert Link"
              >
                <LinkIcon className="h-4 w-4" />
              </MenuButton>
            </div>

            {/* 9. Line spacing + Lists */}
            <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
              <div className="relative" data-dropdown="lineheight">
                <MenuButton
                  ref={lineHeightButtonRef}
                  onClick={(e) => {
                    e?.stopPropagation()
                    const wasOpen = dropdownStates.showLineHeightSelector
                    closeAllDropdowns()
                    const btn = lineHeightButtonRef.current
                    if (btn) {
                      const rect = btn.getBoundingClientRect()
                      setDropdownPositions(prev => ({ ...prev, lineHeight: { top: rect.bottom + 4, left: rect.left } }))
                    }
                    setDropdownStates(prev => ({ ...prev, showLineHeightSelector: !wasOpen }))
                  }}
                  title="Line Height"
                >
                  <div className="flex items-center gap-1">
                    {(() => {
                      const lineHeight = editor.getAttributes('paragraph').lineHeight || editor.getAttributes('heading').lineHeight
                      return lineHeight ? (
                        <span className="text-xs font-medium">{lineHeight}</span>
                      ) : (
                        <span className="text-xs font-medium">1.15</span>
                      )
                    })()}
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </MenuButton>
              </div>

              <MenuButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Ordered List"
              >
                <ListOrdered className="h-4 w-4" />
              </MenuButton>
            </div>

            {/* 10. Documents/Comments/Tools - LAST */}
            <div className="flex gap-1 flex-shrink-0">
              <MenuButton
                onClick={() => {
                  setIsDocumentsPanelOpen(!isDocumentsPanelOpen);
                  onToggleSidebar?.();
                }}
                isActive={isDocumentsPanelOpen}
                title="Documents"
                data-sidebar-toggle=""
              >
                <PanelLeft className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => {
                  if (isCommentsPanelOpen && panelTab !== 'comments') {
                    setPanelTab('comments')
                  } else {
                    setIsCommentsPanelOpen(!isCommentsPanelOpen)
                    if (!isCommentsPanelOpen) {
                      setPanelTab('comments')
                    }
                  }
                }}
                isActive={isCommentsPanelOpen && panelTab === 'comments'}
                title="Comments"
              >
                <MessageSquare className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => {
                  if (isCommentsPanelOpen && panelTab !== 'tools') {
                    setPanelTab('tools')
                  } else {
                    setIsCommentsPanelOpen(!isCommentsPanelOpen)
                    if (!isCommentsPanelOpen) {
                      setPanelTab('tools')
                    }
                  }
                }}
                isActive={isCommentsPanelOpen && panelTab === 'tools'}
                title="Tools"
              >
                <Wrench className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => setIsTocOpen(!isTocOpen)}
                isActive={isTocOpen}
                title="Table of Contents"
              >
                <BookMarked className="h-4 w-4" />
              </MenuButton>


              {/* View Mode Toggle */}
              <div className="relative ml-2 pl-2 border-l" data-dropdown="viewmode">
                <MenuButton
                  ref={viewModeButtonRef}
                  onClick={(e) => {
                    e?.stopPropagation()
                    const wasOpen = dropdownStates.showViewModeSelector
                    closeAllDropdowns()
                    const btn = viewModeButtonRef.current
                    if (btn) {
                      const rect = btn.getBoundingClientRect()
                      setDropdownPositions(prev => ({ ...prev, viewMode: { top: rect.bottom + 4, left: rect.left } }))
                    }
                    setDropdownStates(prev => ({ ...prev, showViewModeSelector: !wasOpen }))
                  }}
                  title={`View Mode: ${viewMode === 'editor' ? 'Editor' : viewMode === 'html' ? 'HTML' : 'Markdown'}`}
                >
                  <div className="flex items-center gap-1">
                    <Code2 className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {viewMode === 'editor' ? 'Editor' : viewMode === 'html' ? 'HTML' : 'MD'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </MenuButton>
              </div>
            </div>

            {toolbarActions && (
              <div className="flex items-center gap-1 ml-2 border-l pl-2 flex-shrink-0">
                {toolbarActions}
              </div>
            )}
          </div>
        
        {/* Main content area with LEFT documents panel, editor, and RIGHT comments panel */}
        <div className="flex-1 relative overflow-hidden bg-background" style={{ zIndex: 1 }}>
          {/* LEFT Documents Panel */}
          {isDocumentsPanelOpen && (
            <div
              className={cn(
                "absolute z-50 transition-transform duration-300 ease-in-out bg-background border border-border shadow-sm overflow-y-auto scrollbar-hide",
                // Desktop: left margin, fixed width, rounded corners
                "md:left-2 md:top-2 md:bottom-2 md:w-64 md:rounded-lg",
                // Mobile: full width, no margins, square corners
                "left-0 top-0 bottom-0 right-0 w-full rounded-none"
              )}
              style={{
                transform: isDocumentsPanelOpen ? 'translateX(0)' : 'translateX(-100%)',
              }}
            >
              <AppSidebar
                onDocumentSelect={onDocumentSelect}
                selectedDocumentId={selectedDocumentId}
              />
            </div>
          )}

          {/* Editor Content */}
          <div className={cn(
            "h-full transition-all duration-300 ease-in-out",
            isDocumentsPanelOpen && "md:pl-[17.5rem]",
            isCommentsPanelOpen && "md:pr-[21.5rem]",
            viewMode !== 'editor' && "p-4 overflow-y-auto scrollbar-hide bg-background"
          )}>
            {viewMode === 'editor' ? (
              <MultiPageRenderer editor={editor} />
            ) : (
              <div className="w-full h-full border rounded-md overflow-hidden">
                <Editor
                  height="100%"
                  language={viewMode === 'markdown' ? 'markdown' : 'html'}
                  value={rawText}
                  onChange={(value) => setRawText(value || '')}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    fontSize: 13,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </div>
            )}
          </div>

          {/* RIGHT Tabbed Side Panel (Comments + Tools) */}
          <TabbedSidePanel
            comments={comments}
            activeCommentId={activeCommentId}
            onCommentClick={handleCommentClick}
            onCommentResolve={handleCommentResolve}
            onCommentDelete={handleCommentDelete}
            onAddComment={handleAddComment}
            isOpen={isCommentsPanelOpen}
            onToggle={() => setIsCommentsPanelOpen(!isCommentsPanelOpen)}
            activeTab={panelTab}
            onTabChange={setPanelTab}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            activeCommentTab={activeCommentTab}
            onCommentTabChange={setActiveCommentTab}
            editor={editor}
          />
        </div>
        
        {/* Bubble Menu - v0 Version */}
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{
              duration: 100,
              zIndex: 40, // Lower z-index to appear behind modal overlays (modals are typically z-50)
              placement: 'bottom-start', // Default to bottom instead of top
              appendTo: () => document.body,
              popperOptions: {
                modifiers: [
                  {
                    name: 'flip',
                    options: {
                      fallbackPlacements: ['top-start', 'bottom-start', 'top', 'bottom'],
                    },
                  },
                  {
                    name: 'preventOverflow',
                    options: {
                      boundary: 'viewport',
                      padding: 8,
                    },
                  },
                ],
              },
            }}
          >
            <BubbleMenuV0
              selectedText={selectedText}
              onFormat={(format) => {
                switch (format) {
                  case 'bold':
                    editor.chain().focus().toggleBold().run()
                    break
                  case 'italic':
                    editor.chain().focus().toggleItalic().run()
                    break
                  case 'strikethrough':
                    editor.chain().focus().toggleStrike().run()
                    break
                  case 'underline':
                    editor.chain().focus().toggleUnderline().run()
                    break
                  case 'link':
                    const url = window.prompt('URL')
                    if (url) {
                      editor.chain().focus().setLink({ href: url }).run()
                    }
                    break
                  case 'comment':
                    handleAddComment()
                    break
                }
              }}
              onAIAction={(action: AIAction, text: string, additionalContext?: string, enableWebSearch?: boolean) => {
                // Map v0 actions to our existing handlers
                if (action === 'research' || action === 'ask-ai-edit' || action === 'ask-ai-question') {
                  handleChatAction(action, additionalContext, enableWebSearch)
                } else {
                  // All other actions are inline actions
                  handleInlineAction(action)
                }
              }}
            />
          </BubbleMenu>
        )}
      </div>
      
      {/* Portaled Dropdowns - Render outside overflow context */}
      {isMounted && dropdownStates.showColorSelector && dropdownPositions.color && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="color"
          style={{
            top: `${dropdownPositions.color.top}px`,
            left: `${dropdownPositions.color.left}px`
          }}
        >
          <ColorSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && dropdownStates.showHighlightSelector && dropdownPositions.highlight && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="highlight"
          style={{
            top: `${dropdownPositions.highlight.top}px`,
            left: `${dropdownPositions.highlight.left}px`
          }}
        >
          <HighlightColorSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && dropdownStates.showFontSelector && dropdownPositions.font && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="font"
          style={{
            top: `${dropdownPositions.font.top}px`,
            left: `${dropdownPositions.font.left}px`
          }}
        >
          <FontSelector editor={editor} onClose={closeAllDropdowns} />
        </div>,
        document.body
      )}

      {isMounted && dropdownStates.showFontSizeSelector && dropdownPositions.fontSize && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="fontsize"
          style={{
            top: `${dropdownPositions.fontSize.top}px`,
            left: `${dropdownPositions.fontSize.left}px`
          }}
        >
          <FontSizeSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && dropdownStates.showLineHeightSelector && dropdownPositions.lineHeight && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="lineheight"
          style={{
            top: `${dropdownPositions.lineHeight.top}px`,
            left: `${dropdownPositions.lineHeight.left}px`
          }}
        >
          <LineHeightSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && dropdownStates.showSpacingSelector && dropdownPositions.spacing && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="spacing"
          style={{
            top: `${dropdownPositions.spacing.top}px`,
            left: `${dropdownPositions.spacing.left}px`
          }}
        >
          <SpacingSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && dropdownStates.showHeadingSelector && dropdownPositions.heading && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="heading"
          style={{
            top: `${dropdownPositions.heading.top}px`,
            left: `${dropdownPositions.heading.left}px`
          }}
        >
          <HeadingSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && dropdownStates.showViewModeSelector && dropdownPositions.viewMode && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="viewmode"
          style={{
            top: `${dropdownPositions.viewMode.top}px`,
            left: `${dropdownPositions.viewMode.left}px`
          }}
        >
          <div className="bg-background border rounded-md shadow-lg p-1 min-w-[120px]">
            <button
              onClick={() => {
                handleViewModeChange('editor')
                closeAllDropdowns()
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors",
                viewMode === 'editor' && "bg-muted font-medium"
              )}
            >
              Editor
            </button>
            <button
              onClick={() => {
                handleViewModeChange('html')
                closeAllDropdowns()
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors",
                viewMode === 'html' && "bg-muted font-medium"
              )}
            >
              HTML
            </button>
            <button
              onClick={() => {
                handleViewModeChange('markdown')
                closeAllDropdowns()
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors",
                viewMode === 'markdown' && "bg-muted font-medium"
              )}
            >
              Markdown
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Add Comment Form - Moved outside the main container to fix rendering issues */}
      {showAddCommentForm && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="font-medium">Add Comment</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Adding comment to: <span className="font-medium">"{selectedText}"</span>
              </p>
              <AddCommentForm
                onSubmit={handleCommentSubmit}
                onCancel={() => setShowAddCommentForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Table of Contents Panel */}
      <TableOfContents
        editor={editor}
        isOpen={isTocOpen}
        onToggle={() => setIsTocOpen(!isTocOpen)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        editor={editor}
        documentTitle={selectedDocumentId || 'document'}
      />
    </>
  )
}
