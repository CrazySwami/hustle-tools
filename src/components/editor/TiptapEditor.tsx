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
import { PageBreak } from './PageBreakExtension'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import Suggestion from '@tiptap/suggestion'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { SlashCommandMenu, getDefaultSlashCommands, SlashCommandMenuRef } from './SlashCommandMenu'
import { ChartNode } from './nodes/ChartNode'
import { InfoCardNode } from './nodes/InfoCardNode'
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
  Table as TableIcon,
  TableProperties,
  Columns,
  Rows,
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
  ArrowLeft,
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
  Download,
  Save,
  Check,
  Loader2,
  BarChart3,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import CommentExtension, { Comment } from './CommentExtension'
import CommentsPanel, { AddCommentForm } from './CommentsPanel'
import { AIBubbleMenuContent } from './AIBubbleMenu'
import { BubbleMenuV0, AIAction, InsertAction } from './BubbleMenuV0'
import { StreamingExtension, updateStreamingState } from './StreamingExtension'
import { useDocumentContent } from '@/hooks/useDocumentContent'
import { TextStatsWidget } from '@/components/tool-ui/text-stats-widget'
import { FindStringWidget } from '@/components/tool-ui/find-string-widget'
import { ReadabilityWidget } from '@/components/tool-ui/readability-widget'
import { HeadingsWidget } from '@/components/tool-ui/headings-widget'
import { FindReplaceWidget } from '@/components/tool-ui/find-replace-widget'
import { DuplicatesWidget } from '@/components/tool-ui/duplicates-widget'
import { LineHeight } from './LineHeightExtension'
import TurndownService from 'turndown'
import '@/styles/comments.css'
import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { MultiPageRenderer } from './MultiPageRenderer'
import { ExportModal } from './ExportModal'
import { PageSetupModal, PageSetupConfig } from './PageSetupModal'

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
  onSave?: () => void;
  saveStatus?: 'saved' | 'saving' | 'unsaved';
  lastSaved?: Date | null;
  isSidebarVisible?: boolean;
  selectedDocumentId?: string;
  onDocumentSelect?: (documentId: string) => void;
  onToggleCommentsPanel?: () => void;
  onSetPanelTab?: (tab: 'comments' | 'tools') => void;
  showContextToggle?: boolean;
  onToggleContext?: () => void;
}

const savedContent = typeof window !== 'undefined' ? localStorage.getItem('tiptap-document') : null;
const initialComments = typeof window !== 'undefined' ? localStorage.getItem('tiptap-comments') : null;

export default function TiptapEditor({ initialContent, onContentChange, onCommentsChange, toolbarActions, onAIEdit, selectedModel, onToggleSidebar, isSidebarVisible, selectedDocumentId, onDocumentSelect, onToggleCommentsPanel, onSetPanelTab, showContextToggle, onToggleContext, onSave, saveStatus = 'saved', lastSaved }: TiptapEditorProps = {}) {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)
  // Consolidated dropdown state for performance
  const [dropdownStates, setDropdownStates] = useState({
    showColorSelector: false,
    showHighlightSelector: false,
    showFontSelector: false,
    showHeadingSelector: false,
    showFontSizeSelector: false,
    showLineHeightSelector: false,
    showZoomSelector: false,
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
    zoom: { top: number; left: number } | null
  }>({
    color: null,
    highlight: null,
    font: null,
    fontSize: null,
    lineHeight: null,
    spacing: null,
    heading: null,
    viewMode: null,
    zoom: null,
  })

  const [viewMode, setViewMode] = useState<'editor' | 'html' | 'markdown'>('editor')
  const [rawText, setRawText] = useState('') // Stores raw HTML or Markdown
  const [savedEditorContent, setSavedEditorContent] = useState('') // Backup of editor content before switching
  const [comments, setComments] = useState<Comment[]>(initialComments ? JSON.parse(initialComments) : [])

  const isInternalUpdate = useRef(false) // Flag to prevent circular updates
  const hasUserInteracted = useRef(false) // Track if user has clicked/edited the document
  const lastEmittedContent = useRef<string>('') // Track last content emitted to parent
  const colorButtonRef = useRef<HTMLButtonElement>(null)
  const highlightButtonRef = useRef<HTMLButtonElement>(null)
  const fontButtonRef = useRef<HTMLButtonElement>(null)
  const fontSizeButtonRef = useRef<HTMLButtonElement>(null)
  const lineHeightButtonRef = useRef<HTMLButtonElement>(null)
  const headingButtonRef = useRef<HTMLButtonElement>(null)
  const spacingButtonRef = useRef<HTMLButtonElement>(null)
  const viewModeButtonRef = useRef<HTMLButtonElement>(null)
  const zoomButtonRef = useRef<HTMLButtonElement>(null)

  // Memoized helper function to close all dropdowns
  const closeAllDropdowns = useCallback(() => {
    setDropdownStates({
      showColorSelector: false,
      showHighlightSelector: false,
      showFontSelector: false,
      showHeadingSelector: false,
      showFontSizeSelector: false,
      showLineHeightSelector: false,
      showZoomSelector: false,
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

  // New simplified panel state
  type PanelType = 'documents' | 'comments' | 'tools' | 'toc' | null;
  const [leftPanel, setLeftPanel] = useState<PanelType>(null);
  const [rightPanel, setRightPanel] = useState<PanelType>(null);

  // Tools state
  type ActiveTool = 'stats' | 'find' | 'readability' | 'headings' | 'replace' | 'duplicates' | null;
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  // TOC state
  interface HeadingNode {
    id: string;
    level: number;
    text: string;
    position: number;
    children: HeadingNode[];
  }
  const [headings, setHeadings] = useState<HeadingNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const isUpdatingHeadingsRef = useRef(false); // Ref to prevent infinite loop when updating heading IDs

  const [showAddCommentForm, setShowAddCommentForm] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [aiInstruction, setAiInstruction] = useState('')
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [isInlineProcessing, setIsInlineProcessing] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isPageSetupModalOpen, setIsPageSetupModalOpen] = useState(false)

  // Page setup configuration - load from localStorage or use defaults
  const [pageConfig, setPageConfig] = useState<PageSetupConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tiptap-page-setup')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse page config:', e)
        }
      }
    }
    return {
      pageSize: 'letter',
      width: 816,
      height: 1056,
      marginTop: 96,
      marginRight: 96,
      marginBottom: 96,
      marginLeft: 96,
      orientation: 'portrait',
    }
  })

  // Save page config to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tiptap-page-setup', JSON.stringify(pageConfig))
    }
  }, [pageConfig])

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
        lastEmittedContent.current = html; // Track what we're emitting
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

  // Helper function to calculate dropdown position with boundary detection
  const calculateDropdownPosition = useCallback((buttonRect: DOMRect, dropdownHeight = 300, dropdownWidth = 200) => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spacing = 4; // Space between button and dropdown

    // Default position: below the button, aligned left
    let top = buttonRect.bottom + spacing;
    let left = buttonRect.left;

    // Check if dropdown would go below viewport
    if (top + dropdownHeight > viewportHeight) {
      // Flip to above the button
      top = buttonRect.top - dropdownHeight - spacing;

      // If still out of bounds (button near top), clamp to viewport
      if (top < 0) {
        top = spacing;
      }
    }

    // Check if dropdown would go beyond right edge
    if (left + dropdownWidth > viewportWidth) {
      // Align right edge of dropdown with right edge of button
      left = buttonRect.right - dropdownWidth;

      // If still out of bounds (button near left edge), clamp to viewport
      if (left < 0) {
        left = spacing;
      }
    }

    return { top, left };
  }, []);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (selectionDebounceTimer.current) clearTimeout(selectionDebounceTimer.current);
      if (contentDebounceTimer.current) clearTimeout(contentDebounceTimer.current);
      if (localStorageDebounceTimer.current) clearTimeout(localStorageDebounceTimer.current);
    };
  }, []);

  // Create lowlight instance for syntax highlighting
  const lowlight = createLowlight(common)

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
        history: {
          depth: 100,
          newGroupDelay: 500,
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
            // Open comments panel via parent callback
            if (onSetPanelTab && onToggleCommentsPanel) {
              onSetPanelTab('comments');
            }
            setActiveCommentId(commentId);
          }
        },
      }),
      PageBreak.configure({
        pageHeight: pageConfig.height,
        marginTop: pageConfig.marginTop,
        marginBottom: pageConfig.marginBottom,
        marginLeft: pageConfig.marginLeft,
        marginRight: pageConfig.marginRight,
        pageGap: 24, // Fixed gap between pages
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      ChartNode,
      InfoCardNode,
      Extension.create({
        name: 'slashCommand',
        addProseMirrorPlugins() {
          return [
            Suggestion({
              editor: this.editor,
              char: '/',
              command: ({ editor, range, props }: any) => {
                // Delete the slash character and any query text
                editor.chain().focus().deleteRange(range).run()
                // Execute the command
                props.command({ editor, range })
              },
              items: ({ query }: any) => {
                const commands = getDefaultSlashCommands(this.editor)
                
                // Add AI text commands with document context
                const editor = this.editor
                const getDocContext = () => {
                  try {
                    return editor.getHTML()
                  } catch {
                    return ''
                  }
                }
                
                commands.push(
                  {
                    id: 'ai-continue',
                    label: 'Continue Writing (AI)',
                    description: 'Let AI continue from where you left off',
                    icon: Sparkles,
                    group: 'ai',
                    command: async () => {
                      const selection = editor.state.selection
                      const textBefore = editor.state.doc.textBetween(Math.max(0, selection.from - 500), selection.from, ' ')
                      
                      if (!textBefore.trim()) {
                        alert('Please write some text first before using Continue Writing.')
                        return
                      }
                      
                      const { from } = selection
                      
                      try {
                        const response = await fetch('/api/inline-edit', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            text: textBefore,
                            instruction: 'Continue writing from where this text ends',
                            model: selectedModel || 'anthropic/claude-haiku-4-5-20251001'
                          })
                        })
                        
                        if (!response.ok) throw new Error('Failed to generate continuation')
                        if (!response.body) throw new Error('No response body')
                        
                        const reader = response.body.getReader()
                        const decoder = new TextDecoder()
                        let fullText = ''
                        
                        while (true) {
                          const { done, value } = await reader.read()
                          if (done) break
                          
                          const chunk = decoder.decode(value)
                          fullText += chunk
                          
                          editor.chain().focus().insertContentAt(from + fullText.length - chunk.length, chunk).run()
                          await new Promise(resolve => setTimeout(resolve, 30))
                        }
                      } catch (error) {
                        console.error('Continue writing failed:', error)
                        alert('Failed to continue writing. Please try again.')
                      }
                    },
                  },
                  {
                    id: 'ai-prompt',
                    label: 'Ask AI (Custom Prompt)',
                    description: 'Ask AI anything with document context',
                    icon: MessageSquare,
                    group: 'ai',
                    command: async () => {
                      const userPrompt = window.prompt('What would you like AI to write?')
                      if (!userPrompt) return
                      
                      const { from } = editor.state.selection
                      
                      try {
                        const response = await fetch('/api/inline-edit', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            text: '',
                            instruction: userPrompt,
                            model: selectedModel || 'anthropic/claude-haiku-4-5-20251001'
                          })
                        })
                        
                        if (!response.ok) throw new Error('Failed to generate content')
                        if (!response.body) throw new Error('No response body')
                        
                        const reader = response.body.getReader()
                        const decoder = new TextDecoder()
                        let fullText = ''
                        
                        while (true) {
                          const { done, value } = await reader.read()
                          if (done) break
                          
                          const chunk = decoder.decode(value)
                          fullText += chunk
                          
                          editor.chain().focus().insertContentAt(from + fullText.length - chunk.length, chunk).run()
                          await new Promise(resolve => setTimeout(resolve, 30))
                        }
                      } catch (error) {
                        console.error('AI prompt failed:', error)
                        alert('Failed to generate content. Please try again.')
                      }
                    },
                  }
                )
                
                // Add AI component generation commands
                commands.push(
                  {
                    id: 'chart-ai',
                    label: 'Generate Chart (AI)',
                    description: 'Create a chart with AI',
                    icon: BarChart3,
                    group: 'components',
                    command: async () => {
                      const promptText = `📊 CHART GENERATOR

Describe the chart you want to create.

CAPABILITIES:
• Bar charts - Compare values across categories
• Line graphs - Show trends over time
• Pie charts - Show proportions of a whole
• Doughnut charts - Like pie, with center hole

LIMITATIONS:
• Maximum 12 data points recommended
• Simple datasets only (no complex nested data)
• Static charts (not real-time updating)

CONTEXT AWARE:
• Has access to your document content
• Will match your document's theme/topic

Example: "Monthly sales data for 2024"
Example: "Browser market share pie chart"
Example: "User growth line graph last 6 months"`
                      
                      const userPrompt = window.prompt(promptText)
                      if (!userPrompt) return
                      
                      // Get document context
                      const docText = editor.getText().substring(0, 2000) // First 2000 chars
                      
                      try {
                        const response = await fetch('/api/generate-component', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            componentType: 'chart',
                            userPrompt,
                            selectedText: docText,
                            model: selectedModel || 'anthropic/claude-3-5-sonnet-20241022',
                          }),
                        })
                        
                        if (!response.ok) throw new Error('Failed to generate component')
                        
                        const reader = response.body?.getReader()
                        const decoder = new TextDecoder()
                        let fullResponse = ''
                        
                        if (reader) {
                          while (true) {
                            const { done, value } = await reader.read()
                            if (done) break
                            fullResponse += decoder.decode(value)
                          }
                        }
                        
                        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
                        if (!jsonMatch) throw new Error('Invalid response format')
                        
                        const componentData = JSON.parse(jsonMatch[0])
                        // Insert the chart node
                        editor.chain().focus().insertContent({
                          type: 'chart',
                          attrs: componentData
                        }).run()
                      } catch (error) {
                        console.error('Chart generation failed:', error)
                        alert('Failed to generate chart. Please try again.')
                      }
                    },
                  },
                  {
                    id: 'infocard-ai',
                    label: 'Generate Info Card (AI)',
                    description: 'Create an info card with AI',
                    icon: Info,
                    group: 'components',
                    command: async () => {
                      const promptText = `💡 INFO CARD GENERATOR

Describe the info card you want to create.

CAPABILITIES:
• Info (blue) - General information
• Warning (yellow) - Cautions and alerts
• Success (green) - Confirmations and achievements
• Error (red) - Problems and issues

FEATURES:
• Title and icon
• Main content paragraph
• Bullet point lists
• Optional footer text

LIMITATIONS:
• Text-only (no images)
• Maximum 5 bullet points recommended
• Static content (not interactive)

CONTEXT AWARE:
• Has access to your document content
• Will match your document's theme/topic

Example: "Important security notice"
Example: "Project milestone completed"
Example: "Warning about deadline"`
                      
                      const userPrompt = window.prompt(promptText)
                      if (!userPrompt) return
                      
                      // Get document context
                      const docText = editor.getText().substring(0, 2000) // First 2000 chars
                      
                      try {
                        const response = await fetch('/api/generate-component', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            componentType: 'infoCard',
                            userPrompt,
                            selectedText: docText,
                            model: selectedModel || 'anthropic/claude-3-5-sonnet-20241022',
                          }),
                        })
                        
                        if (!response.ok) throw new Error('Failed to generate component')
                        
                        const reader = response.body?.getReader()
                        const decoder = new TextDecoder()
                        let fullResponse = ''
                        
                        if (reader) {
                          while (true) {
                            const { done, value } = await reader.read()
                            if (done) break
                            fullResponse += decoder.decode(value)
                          }
                        }
                        
                        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
                        if (!jsonMatch) throw new Error('Invalid response format')
                        
                        const componentData = JSON.parse(jsonMatch[0])
                        // Insert the info card node
                        editor.chain().focus().insertContent({
                          type: 'infoCard',
                          attrs: componentData
                        }).run()
                      } catch (error) {
                        console.error('Info card generation failed:', error)
                        alert('Failed to generate info card. Please try again.')
                      }
                    },
                  },
                  {
                    id: 'custom-component-ai',
                    label: 'Custom Component (AI)',
                    description: 'Generate any custom component',
                    icon: Sparkles,
                    group: 'components',
                    command: async () => {
                      const promptText = `✨ CUSTOM COMPONENT GENERATOR

Describe ANY component you want to create.

CAPABILITIES:
• Can generate charts, cards, or custom content
• Flexible output format
• Context-aware generation

WHAT YOU CAN REQUEST:
• "Timeline of events"
• "Comparison table"
• "Step-by-step guide"
• "Feature list with icons"
• "Statistics dashboard"
• "Quote with attribution"
• Anything else you can imagine!

LIMITATIONS:
• Text and basic formatting only
• No real-time data
• No external API calls

CONTEXT:
• Has access to your document
• Will use selected text if available

Describe what you want:`
                      
                      const userPrompt = window.prompt(promptText)
                      if (!userPrompt) return
                      
                      // Get document context and selected text
                      const { from, to } = editor.state.selection
                      const selectedText = editor.state.doc.textBetween(from, to, ' ')
                      const docText = editor.getText().substring(0, 2000)
                      
                      // Combine selected text and document context
                      const contextText = selectedText 
                        ? `SELECTED TEXT TO REPLACE:\n${selectedText}\n\nDOCUMENT CONTEXT:\n${docText}`
                        : docText
                      
                      try {
                        const response = await fetch('/api/chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            messages: [
                              {
                                role: 'system',
                                content: `You are a helpful content generator. Generate the requested component/content based on the user's description. If there is selected text to replace, use it as context but generate new content. Output clean, formatted text suitable for a document editor.\n\nContext:\n${contextText}`
                              },
                              {
                                role: 'user',
                                content: userPrompt
                              }
                            ],
                            model: selectedModel || 'anthropic/claude-3-5-sonnet-20241022',
                          }),
                        })
                        
                        if (!response.ok) throw new Error('Failed to generate component')
                        
                        const reader = response.body?.getReader()
                        const decoder = new TextDecoder()
                        let generatedContent = ''
                        
                        if (reader) {
                          while (true) {
                            const { done, value } = await reader.read()
                            if (done) break
                            const chunk = decoder.decode(value)
                            const lines = chunk.split('\n')
                            for (const line of lines) {
                              if (line.startsWith('0:')) {
                                const text = line.substring(2).trim()
                                if (text) generatedContent += text
                              }
                            }
                          }
                        }
                        
                        if (generatedContent) {
                          // If there's selected text, replace it; otherwise insert
                          if (selectedText) {
                            editor.chain().focus().deleteSelection().insertContent(generatedContent).run()
                          } else {
                            editor.chain().focus().insertContent(generatedContent).run()
                          }
                        }
                      } catch (error) {
                        console.error('Custom component generation failed:', error)
                        alert('Failed to generate custom component. Please try again.')
                      }
                    },
                  }
                )
                
                return commands.filter((item: any) =>
                  item.label.toLowerCase().includes(query.toLowerCase())
                )
              },
              render: () => {
                let component: ReactRenderer<SlashCommandMenuRef>
                let popup: TippyInstance[]

                return {
                  onStart: (props: any) => {
                    component = new ReactRenderer(SlashCommandMenu, {
                      props,
                      editor: props.editor,
                    })

                    popup = tippy('body', {
                      getReferenceClientRect: props.clientRect as any,
                      appendTo: () => document.body,
                      content: component.element,
                      showOnCreate: true,
                      interactive: true,
                      trigger: 'manual',
                      placement: 'bottom-start',
                      popperOptions: {
                        modifiers: [
                          {
                            name: 'flip',
                            enabled: true,
                            options: {
                              fallbackPlacements: ['top-start', 'bottom-start', 'top-end', 'bottom-end'],
                            },
                          },
                          {
                            name: 'preventOverflow',
                            enabled: true,
                            options: {
                              boundary: 'viewport',
                              padding: 8,
                            },
                          },
                        ],
                      },
                    })
                  },
                  onUpdate(props: any) {
                    component.updateProps(props)

                    popup[0].setProps({
                      getReferenceClientRect: props.clientRect as any,
                    })
                  },
                  onKeyDown(props: any) {
                    if (props.event.key === 'Escape') {
                      popup[0].hide()
                      return true
                    }

                    return component.ref?.onKeyDown(props.event) || false
                  },
                  onExit() {
                    // Safely cleanup popup and component
                    try {
                      if (popup && popup[0]) {
                        popup[0].destroy()
                      }
                    } catch (e) {
                      // Ignore cleanup errors
                    }
                    
                    try {
                      if (component) {
                        component.destroy()
                      }
                    } catch (e) {
                      // Ignore cleanup errors
                    }
                  },
                }
              },
            }),
          ]
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

    // Skip if this is the same content we just emitted to parent (prevents cursor reset loop)
    // This happens when parent re-renders with content that originated from this editor
    if (initialContent === lastEmittedContent.current) {
      console.log('⏭️ [EDITOR] Skipping update - content matches last emitted (no cursor reset)');
      return;
    }

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

  // Extract headings for TOC in real-time
  useEffect(() => {
    if (!editor) return;

    const buildHierarchy = (flatHeadings: Array<{ level: number; text: string; position: number; id: string }>): HeadingNode[] => {
      const result: HeadingNode[] = [];
      const stack: HeadingNode[] = [];

      flatHeadings.forEach((heading) => {
        const node: HeadingNode = { ...heading, children: [] };

        while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
          stack.pop();
        }

        if (stack.length === 0) {
          result.push(node);
        } else {
          stack[stack.length - 1].children.push(node);
        }

        stack.push(node);
      });

      return result;
    };

    const extractHeadings = () => {
      const headingsList: Array<{ level: number; text: string; position: number; id: string }> = [];
      const headingsNeedingIds: Array<{ pos: number; node: any; id: string }> = [];

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const level = node.attrs.level;
          const text = node.textContent;

          if (!text.trim()) return;

          const id = `heading-${pos}-${text.slice(0, 20).replace(/\s+/g, "-")}`;
          headingsList.push({ level, text, position: pos, id });

          // Collect headings that need IDs (don't dispatch yet)
          if (!node.attrs.id) {
            headingsNeedingIds.push({ pos, node, id });
          }
        }
      });

      // Always update the headings list (this makes TOC update in real-time)
      setHeadings(buildHierarchy(headingsList));
      const allIds = new Set(headingsList.map(h => h.id));
      setExpandedIds(allIds);

      // Batch update heading IDs in a single transaction (only if not already updating)
      if (headingsNeedingIds.length > 0 && !isUpdatingHeadingsRef.current) {
        isUpdatingHeadingsRef.current = true;

        // Use requestAnimationFrame to defer the transaction to avoid blocking the update event
        requestAnimationFrame(() => {
          const tr = editor.view.state.tr;

          headingsNeedingIds.forEach(({ pos, node, id }) => {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, id });
          });

          editor.view.dispatch(tr);

          // Reset flag immediately after dispatch
          isUpdatingHeadingsRef.current = false;
        });
      }
    };

    extractHeadings();

    const updateListener = () => extractHeadings();
    editor.on("update", updateListener);

    return () => {
      editor.off("update", updateListener);
    };
  }, [editor]);

  // Reconfigure PageBreak extension when page config changes
  useEffect(() => {
    if (editor && pageConfig) {
      // Update the PageBreak extension options with new page dimensions
      setTimeout(() => {
        if (editor) {
          editor.extensionManager.extensions.forEach((ext: any) => {
            if (ext.name === 'pageBreak') {
              ext.options.pageHeight = pageConfig.height
              ext.options.marginTop = pageConfig.marginTop
              ext.options.marginBottom = pageConfig.marginBottom
              ext.options.marginLeft = pageConfig.marginLeft
              ext.options.marginRight = pageConfig.marginRight
              ext.options.pageGap = 24
            }
          })

          // Force re-render of page breaks by triggering editor update
          editor.view.dispatch(editor.state.tr)
        }
      }, 100)
    }
  }, [editor, pageConfig])

  // Event handlers for navigation bar
  useEffect(() => {
    const handleSetPanel = (event: CustomEvent) => {
      const { tab, open } = event.detail;

      if (tab === 'documents') {
        if (open) {
          setLeftPanel('documents');
          setRightPanel(null);
        } else {
          setLeftPanel(null);
        }
      } else if (tab === 'comments') {
        if (open) {
          setRightPanel('comments');
          setLeftPanel(null);
        } else {
          setRightPanel(null);
        }
      } else if (tab === 'tools') {
        if (open) {
          setRightPanel('tools');
          setLeftPanel(null);
        } else {
          setRightPanel(null);
        }
      } else if (tab === 'toc') {
        if (open) {
          setRightPanel('toc');
          setLeftPanel(null);
        } else {
          setRightPanel(null);
        }
      }
    };

    const handleToggleDocuments = () => {
      if (leftPanel === 'documents') {
        setLeftPanel(null);
      } else {
        setLeftPanel('documents');
        setRightPanel(null);
      }
    };

    window.addEventListener('doc-set-panel', handleSetPanel as EventListener);
    window.addEventListener('toggle-documents-panel', handleToggleDocuments);

    return () => {
      window.removeEventListener('doc-set-panel', handleSetPanel as EventListener);
      window.removeEventListener('toggle-documents-panel', handleToggleDocuments);
    };
  }, [leftPanel, rightPanel]);

  // Emit panel state changes for navigation bar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('doc-panel-state', {
      detail: {
        open: !!(leftPanel || rightPanel),
        tab: leftPanel || rightPanel
      }
    }));
  }, [leftPanel, rightPanel]);

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

    // When switching from editor to code view, save the original content and get the HTML
    if (viewMode === 'editor' && newMode !== 'editor') {
      const html = editor.getHTML();
      const json = editor.getJSON(); // Save the full JSON structure
      setSavedEditorContent(JSON.stringify(json)); // Save original content

      if (newMode === 'markdown') {
        // Convert HTML to Markdown
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

    // When switching back to editor mode, restore the original saved content
    if (viewMode !== 'editor' && newMode === 'editor') {
      // Check if we have saved content (original editor state)
      if (savedEditorContent) {
        try {
          const originalContent = JSON.parse(savedEditorContent);
          isInternalUpdate.current = true;
          editor.commands.setContent(originalContent);
          setTimeout(() => {
            isInternalUpdate.current = false;
          }, 10);
        } catch (e) {
          // Fallback to converting from HTML/Markdown if JSON parse fails
          let htmlToRestore = rawText;
          if (viewMode === 'markdown') {
            htmlToRestore = await marked(rawText) as string;
          }
          isInternalUpdate.current = true;
          editor.commands.setContent(htmlToRestore);
          setTimeout(() => {
            isInternalUpdate.current = false;
          }, 10);
        }
      }
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
  const handleInlineAction = async (action: string, placement: 'replace' | 'insert' = 'replace') => {
    if (!editor || !selectedText) return

    setIsInlineProcessing(true);
    setShowAIMenu(false);

    const { from, to } = editor.state.selection;
    const insertPosition = placement === 'insert' ? to : from;

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

  // Handle AI component generation
  const handleGenerateComponent = async (componentType: 'chart' | 'infoCard') => {
    if (!editor) return

    // Show a prompt dialog
    const userPrompt = window.prompt(
      componentType === 'chart' 
        ? 'Describe the chart you want to create (e.g., "Monthly sales data for 2024")'
        : 'Describe the info card you want to create (e.g., "Important security notice")'
    )

    if (!userPrompt) return

    try {
      // Call the component generation API
      const response = await fetch('/api/generate-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentType,
          userPrompt,
          selectedText: editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to
          ),
          model: selectedModel || 'anthropic/claude-3-5-sonnet-20241022',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate component')
      }

      // Parse the streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullResponse += decoder.decode(value)
        }
      }

      // Extract JSON from the response (handle streaming format)
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid response format')
      }

      const componentData = JSON.parse(jsonMatch[0])

      // Insert the component into the editor
      if (componentType === 'chart') {
        editor.chain().focus().insertChart(componentData).run()
      } else if (componentType === 'infoCard') {
        editor.chain().focus().insertInfoCard(componentData).run()
      }
    } catch (error) {
      console.error('Component generation failed:', error)
      alert('Failed to generate component. Please try again.')
    }
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
    // Open comments panel via parent callback
    if (onSetPanelTab && onToggleCommentsPanel) {
      onSetPanelTab('comments');
    }
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
          <div className="flex items-center gap-1 p-2 pl-3 bg-[#EBEBEB] dark:bg-[#2C2C2C] border-b overflow-x-auto overflow-y-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1000, minHeight: '55px', height: '55px' }}>

            {/* Dark Mode Toggle - FIRST */}
            <div className="mr-2 pr-2 border-r">
              <MenuButton
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </MenuButton>
            </div>

            {/* Save Button with Status Light */}
            {onSave && (
              <div className="mr-2 pr-2 border-r flex items-center gap-1.5">
                {/* Status Light */}
                <div 
                  className={cn(
                    "w-2 h-2 rounded-full",
                    saveStatus === 'saved' && "bg-green-500",
                    saveStatus === 'saving' && "bg-yellow-500 animate-pulse",
                    saveStatus === 'unsaved' && "bg-yellow-500"
                  )}
                  title={
                    saveStatus === 'saved' ? `Saved${lastSaved ? ` at ${lastSaved.toLocaleTimeString()}` : ''}` :
                    saveStatus === 'saving' ? 'Saving...' :
                    'Unsaved changes'
                  }
                />
                <MenuButton
                  onClick={onSave}
                  disabled={saveStatus === 'saving'}
                  title={saveStatus === 'saving' ? 'Saving...' : 'Save document (Cmd+S)'}
                >
                  {saveStatus === 'saving' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </MenuButton>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="relative mr-2 pr-2 border-r" data-dropdown="viewmode">
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

            {/* 1. Undo/Redo */}
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

              <MenuButton
                onClick={() => setIsPageSetupModalOpen(true)}
                title="Page Setup"
              >
                <FileText className="h-4 w-4" />
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
                      const position = calculateDropdownPosition(rect, 300, 250)
                      setDropdownPositions(prev => ({ ...prev, color: position }))
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
                      const position = calculateDropdownPosition(rect, 300, 250)
                      setDropdownPositions(prev => ({ ...prev, highlight: position }))
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

            {/* 11. Panel Toggles - LAST */}
            <div className="flex gap-1 flex-shrink-0">
              {showContextToggle && onToggleContext && (
                <MenuButton
                  onClick={onToggleContext}
                  title="Show Context Library"
                >
                  <PanelLeft className="h-4 w-4" />
                </MenuButton>
              )}

              <MenuButton
                onClick={() => {
                  // Toggle comments panel
                  if (onSetPanelTab && onToggleCommentsPanel) {
                    onSetPanelTab('comments');
                    onToggleCommentsPanel(); // This will open if closed, or switch if different tab
                  }
                }}
                title="Comments"
              >
                <MessageSquare className="h-4 w-4" />
              </MenuButton>

              <MenuButton
                onClick={() => {
                  // Toggle TOC panel
                  if (onSetPanelTab && onToggleCommentsPanel) {
                    onSetPanelTab('tools');
                    onToggleCommentsPanel(); // This will open if closed, or switch if different tab
                  }
                }}
                title="Table of Contents"
              >
                <BookMarked className="h-4 w-4" />
              </MenuButton>
            </div>

            {toolbarActions && (
              <div className="flex items-center gap-1 ml-2 border-l pl-2 flex-shrink-0">
                {toolbarActions}
              </div>
            )}
          </div>
        
        {/* Main content area */}
        <div className="flex-1 relative overflow-hidden bg-background" style={{ zIndex: 1 }}>
          {viewMode === 'editor' ? (
            <MultiPageRenderer
              editor={editor}
              pageConfig={pageConfig}
              leftPanel={leftPanel}
              rightPanel={rightPanel}
              leftPanelContent={
                leftPanel === 'documents' ? (
                  <AppSidebar
                    onDocumentSelect={onDocumentSelect}
                    selectedDocumentId={selectedDocumentId}
                  />
                ) : null
              }
              rightPanelContent={
                rightPanel === 'comments' ? (
                  <CommentsPanel
                    comments={comments}
                    activeCommentId={activeCommentId}
                    onCommentClick={handleCommentClick}
                    onCommentResolve={handleCommentResolve}
                    onCommentDelete={handleCommentDelete}
                    onAddComment={handleAddComment}
                    isOpen={true}
                    onToggle={() => {}}
                  />
                ) : rightPanel === 'tools' ? (
                  <div className="h-full overflow-y-auto">
                    {!activeTool ? (
                      <div className="p-4">
                        <h3 className="font-semibold mb-4">Tools</h3>
                        <div className="space-y-2">
                          <button
                            onClick={() => setActiveTool('stats')}
                            className="w-full text-left p-3 rounded-lg border bg-white dark:bg-[#3A3A3A] hover:bg-muted/50 transition-colors"
                          >
                            <div className="text-sm font-medium">Text Statistics</div>
                            <div className="text-xs text-muted-foreground">Word count, reading time, etc.</div>
                          </button>
                          <button
                            onClick={() => setActiveTool('find')}
                            className="w-full text-left p-3 rounded-lg border bg-white dark:bg-[#3A3A3A] hover:bg-muted/50 transition-colors"
                          >
                            <div className="text-sm font-medium">Find Text</div>
                            <div className="text-xs text-muted-foreground">Search for text in document</div>
                          </button>
                          <button
                            onClick={() => setActiveTool('readability')}
                            className="w-full text-left p-3 rounded-lg border bg-white dark:bg-[#3A3A3A] hover:bg-muted/50 transition-colors"
                          >
                            <div className="text-sm font-medium">Readability Score</div>
                            <div className="text-xs text-muted-foreground">Analyze text complexity</div>
                          </button>
                          <button
                            onClick={() => setActiveTool('headings')}
                            className="w-full text-left p-3 rounded-lg border bg-white dark:bg-[#3A3A3A] hover:bg-muted/50 transition-colors"
                          >
                            <div className="text-sm font-medium">Document Outline</div>
                            <div className="text-xs text-muted-foreground">View heading structure</div>
                          </button>
                          <button
                            onClick={() => setActiveTool('replace')}
                            className="w-full text-left p-3 rounded-lg border bg-white dark:bg-[#3A3A3A] hover:bg-muted/50 transition-colors"
                          >
                            <div className="text-sm font-medium">Find & Replace</div>
                            <div className="text-xs text-muted-foreground">Search and replace text</div>
                          </button>
                          <button
                            onClick={() => setActiveTool('duplicates')}
                            className="w-full text-left p-3 rounded-lg border bg-white dark:bg-[#3A3A3A] hover:bg-muted/50 transition-colors"
                          >
                            <div className="text-sm font-medium">Find Duplicates</div>
                            <div className="text-xs text-muted-foreground">Detect repeated text</div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col">
                        <div className="p-2 border-b flex items-center gap-2">
                          <button
                            onClick={() => setActiveTool(null)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-medium">Back to Tools</span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {activeTool === 'stats' && <TextStatsWidget editor={editor} />}
                          {activeTool === 'find' && <FindStringWidget editor={editor} />}
                          {activeTool === 'readability' && <ReadabilityWidget editor={editor} />}
                          {activeTool === 'headings' && <HeadingsWidget editor={editor} />}
                          {activeTool === 'replace' && <FindReplaceWidget editor={editor} />}
                          {activeTool === 'duplicates' && <DuplicatesWidget editor={editor} />}
                        </div>
                      </div>
                    )}
                  </div>
                ) : rightPanel === 'toc' ? (
                  <div className="p-4">
                    <h3 className="font-semibold mb-4">Table of Contents</h3>
                    {headings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Add headings to your document to see them here.</p>
                    ) : (
                      <div className="space-y-1">
                        {headings.map((heading) => (
                          <TOCItem
                            key={heading.id}
                            heading={heading}
                            editor={editor}
                            expandedIds={expandedIds}
                            onToggle={(id) => {
                              const newExpanded = new Set(expandedIds);
                              if (newExpanded.has(id)) {
                                newExpanded.delete(id);
                              } else {
                                newExpanded.add(id);
                              }
                              setExpandedIds(newExpanded);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : null
              }
              onLeftPanelClose={() => setLeftPanel(null)}
              onRightPanelClose={() => setRightPanel(null)}
            />
          ) : (
            <div className="h-full p-4 overflow-y-auto scrollbar-hide bg-background">
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
            </div>
          )}
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
              onInsert={(action, text) => {
                switch (action) {
                  case 'insert-table':
                    editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
                    break
                  case 'insert-code-block':
                    editor.chain().focus().setCodeBlock().run()
                    break
                  case 'insert-task-list':
                    editor.chain().focus().toggleTaskList().run()
                    break
                  case 'generate-chart':
                    handleGenerateComponent('chart')
                    break
                  case 'generate-info-card':
                    handleGenerateComponent('infoCard')
                    break
                }
              }}
              onAIAction={(action: AIAction, text: string, additionalContext?: string, enableWebSearch?: boolean) => {
                // Map v0 actions to our existing handlers
                if (action === 'research' || action === 'ask-ai-edit' || action === 'ask-ai-question') {
                  handleChatAction(action, additionalContext, enableWebSearch)
                } else {
                  // All other actions are inline actions
                  // additionalContext now contains placement choice ('replace' or 'insert')
                  const placement = additionalContext as 'replace' | 'insert' | undefined
                  handleInlineAction(action, placement)
                }
              }}
            />
          </BubbleMenu>
        )}

        {/* Table Bubble Menu - Shows when cursor is in a table */}
        {editor && editor.isActive('table') && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{
              duration: 100,
              zIndex: 40,
              placement: 'top',
              appendTo: () => document.body,
            }}
            shouldShow={({ editor }) => editor.isActive('table')}
          >
            <div className="bg-white dark:bg-[#2C2C2C] border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-1 flex gap-1">
              <button
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                title="Add Column Before"
              >
                <Columns className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                title="Add Column After"
              >
                <Columns className="h-4 w-4 scale-x-[-1]" />
              </button>
              
              <button
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                title="Delete Column"
              >
                <Columns className="h-4 w-4 text-red-600" />
              </button>
              
              <div className="w-px bg-neutral-200 dark:bg-neutral-700 my-1" />
              
              <button
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                title="Add Row Before"
              >
                <Rows className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                title="Add Row After"
              >
                <Rows className="h-4 w-4 scale-y-[-1]" />
              </button>
              
              <button
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                title="Delete Row"
              >
                <Rows className="h-4 w-4 text-red-600" />
              </button>
              
              <div className="w-px bg-neutral-200 dark:bg-neutral-700 my-1" />
              
              <button
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                title="Delete Table"
              >
                <TableIcon className="h-4 w-4 text-red-600" />
              </button>
            </div>
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

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        editor={editor}
        documentTitle={selectedDocumentId || 'document'}
      />

      {/* Page Setup Modal */}
      <PageSetupModal
        isOpen={isPageSetupModalOpen}
        onClose={() => setIsPageSetupModalOpen(false)}
        config={pageConfig}
        onConfigChange={setPageConfig}
      />
    </>
  )
}

// TOC Item Component
interface TOCItemProps {
  heading: {
    id: string;
    level: number;
    text: string;
    position: number;
    children: any[];
  };
  editor: Editor | null;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}

function TOCItem({ heading, editor, expandedIds, onToggle }: TOCItemProps) {
  const hasChildren = heading.children && heading.children.length > 0;
  const isExpanded = expandedIds.has(heading.id);

  const scrollToHeading = () => {
    if (!editor) return;

    // Find the heading node by position
    const { state } = editor;
    const resolvedPos = state.doc.resolve(heading.position);

    // Set selection to the heading
    editor.commands.setTextSelection(heading.position);

    // Scroll into view
    editor.commands.scrollIntoView();
  };

  return (
    <div>
      <button
        onClick={scrollToHeading}
        className={cn(
          "w-full text-left px-2 py-1 rounded hover:bg-muted/50 transition-colors text-sm flex items-center gap-1",
          `pl-${(heading.level - 1) * 3 + 2}`
        )}
        style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(heading.id);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        <span className="truncate">{heading.text}</span>
      </button>

      {hasChildren && isExpanded && (
        <div>
          {heading.children.map((child: any) => (
            <TOCItem
              key={child.id}
              heading={child}
              editor={editor}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
