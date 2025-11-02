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
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { marked } from 'marked'
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
  Code2
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
    if (HTMLAttributes.marginTop) {
      styles.push(`margin-top: ${HTMLAttributes.marginTop}`)
    }
    if (HTMLAttributes.marginBottom) {
      styles.push(`margin-bottom: ${HTMLAttributes.marginBottom}`)
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

  renderHTML({ HTMLAttributes }) {
    const styles = []
    if (HTMLAttributes.marginTop) {
      styles.push(`margin-top: ${HTMLAttributes.marginTop}`)
    }
    if (HTMLAttributes.marginBottom) {
      styles.push(`margin-bottom: ${HTMLAttributes.marginBottom}`)
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

const ColorSelector = ({
  editor
}: {
  editor: any
}) => {
  const [customColor, setCustomColor] = useState('#000000')
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#ffffff' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
  ]

  return (
    <div className="p-3 bg-background border rounded-md shadow-lg w-80">
      <div className="mb-2 text-sm font-medium">Text Color</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {colors.map((color) => (
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
}

const HighlightColorSelector = ({
  editor
}: {
  editor: any
}) => {
  const [customColor, setCustomColor] = useState('#ffff00')
  const colors = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Purple', value: '#e9d5ff' },
    { name: 'Orange', value: '#fed7aa' },
    { name: 'Red', value: '#fecaca' },
  ]

  return (
    <div className="p-3 bg-background border rounded-md shadow-lg w-80">
      <div className="mb-2 text-sm font-medium">Highlight Color</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {colors.map((color) => (
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
}

const FontSelector = ({
  editor
}: {
  editor: any
}) => {
  const fonts = [
    { name: 'Default', value: 'inherit' },
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
  ]

  return (
    <div className="p-2 bg-background border rounded-md shadow-lg w-56 max-h-80 overflow-y-auto">
      <div className="mb-1 text-xs font-medium text-muted-foreground px-2">Font Family</div>
      {fonts.map((font) => (
        <button
          key={font.value}
          onClick={() => editor.chain().focus().setFontFamily(font.value).run()}
          className="w-full px-3 py-2 text-left hover:bg-muted rounded text-sm"
          style={{ fontFamily: font.value }}
        >
          {font.name}
        </button>
      ))}
    </div>
  )
}

const HeadingSelector = ({
  editor
}: {
  editor: any
}) => {
  const headings = [
    { name: 'Paragraph', level: 0, command: () => editor.chain().focus().setParagraph().run() },
    { name: 'Heading 1', level: 1, command: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { name: 'Heading 2', level: 2, command: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { name: 'Heading 3', level: 3, command: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { name: 'Heading 4', level: 4, command: () => editor.chain().focus().toggleHeading({ level: 4 }).run() },
    { name: 'Heading 5', level: 5, command: () => editor.chain().focus().toggleHeading({ level: 5 }).run() },
    { name: 'Heading 6', level: 6, command: () => editor.chain().focus().toggleHeading({ level: 6 }).run() },
  ]

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
}

const FontSizeSelector = ({
  editor
}: {
  editor: any
}) => {
  const [customSize, setCustomSize] = useState('')
  const sizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px']

  const applyFontSize = (size: string) => {
    // First ensure textStyle mark exists, then set fontSize
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
  }

  return (
    <div className="p-3 bg-background border rounded-md shadow-lg w-72">
      <div className="mb-2 text-sm font-medium">Font Size</div>
      <div className="grid grid-cols-2 gap-1 mb-3">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => applyFontSize(size)}
            className="px-3 py-1.5 text-left hover:bg-muted rounded text-sm border"
          >
            {size}
          </button>
        ))}
      </div>
      <div className="border-t pt-3">
        <label className="text-xs text-muted-foreground mb-1 block">Custom Size</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            className="flex-1 px-2 py-1 border rounded text-sm"
            placeholder="24px"
          />
          <button
            onClick={() => customSize && applyFontSize(customSize)}
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 whitespace-nowrap"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

const LineHeightSelector = ({
  editor
}: {
  editor: any
}) => {
  const lineHeights = ['1', '1.15', '1.25', '1.5', '1.75', '2', '2.5', '3']

  return (
    <div className="p-2 bg-background border rounded-md shadow-lg w-44">
      <div className="mb-1 text-xs font-medium text-muted-foreground px-2">Line Height</div>
      {lineHeights.map((height) => (
        <button
          key={height}
          onClick={() => editor.chain().focus().setLineHeight(height).run()}
          className="w-full px-3 py-2 text-left hover:bg-muted rounded text-sm"
        >
          {height}
        </button>
      ))}
      <button
        onClick={() => editor.chain().focus().unsetLineHeight().run()}
        className="w-full mt-1 px-3 py-2 text-left hover:bg-muted rounded text-sm border-t"
      >
        Reset
      </button>
    </div>
  )
}

const SpacingSelector = ({
  editor
}: {
  editor: any
}) => {
  const spacingPresets = [
    { label: 'No space', top: '0', bottom: '0' },
    { label: 'Compact', top: '0.25em', bottom: '0.25em' },
    { label: 'Normal', top: '0.5em', bottom: '0.5em' },
    { label: 'Relaxed', top: '0.75em', bottom: '0.75em' },
    { label: 'Loose', top: '1em', bottom: '1em' },
  ]

  const applySpacing = (top: string, bottom: string) => {
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
  }

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
}

interface TiptapEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onCommentsChange?: (comments: Comment[]) => void;
  toolbarActions?: React.ReactNode;
  onAIEdit?: (selectedText: string, instruction: string, enableWebSearch?: boolean) => void;
  selectedModel?: string;
  onToggleSidebar?: () => void;
  isSidebarVisible?: boolean;
}

const savedContent = typeof window !== 'undefined' ? localStorage.getItem('tiptap-document') : null;
const initialComments = typeof window !== 'undefined' ? localStorage.getItem('tiptap-comments') : null;

export default function TiptapEditor({ initialContent, onContentChange, onCommentsChange, toolbarActions, onAIEdit, selectedModel, onToggleSidebar, isSidebarVisible }: TiptapEditorProps = {}) {
  const [isMounted, setIsMounted] = useState(false)
  const [showColorSelector, setShowColorSelector] = useState(false)
  const [showHighlightSelector, setShowHighlightSelector] = useState(false)
  const [showFontSelector, setShowFontSelector] = useState(false)
  const [showHeadingSelector, setShowHeadingSelector] = useState(false)
  const [showFontSizeSelector, setShowFontSizeSelector] = useState(false)
  const [showLineHeightSelector, setShowLineHeightSelector] = useState(false)
  const [showSpacingSelector, setShowSpacingSelector] = useState(false)
  const [markdownMode, setMarkdownMode] = useState(true) // true = rich text editor, false = raw markdown textarea
  const [markdownText, setMarkdownText] = useState('') // Stores raw markdown when in markdown view mode
  const [comments, setComments] = useState<Comment[]>(initialComments ? JSON.parse(initialComments) : [])
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number} | null>(null)
  const isInternalUpdate = useRef(false) // Flag to prevent circular updates
  const hasUserInteracted = useRef(false) // Track if user has clicked/edited the document
  const colorButtonRef = useRef<HTMLButtonElement>(null)
  const highlightButtonRef = useRef<HTMLButtonElement>(null)
  const fontButtonRef = useRef<HTMLButtonElement>(null)
  const fontSizeButtonRef = useRef<HTMLButtonElement>(null)
  const lineHeightButtonRef = useRef<HTMLButtonElement>(null)
  const headingButtonRef = useRef<HTMLButtonElement>(null)
  const spacingButtonRef = useRef<HTMLButtonElement>(null)
  const [highlightDropdownPosition, setHighlightDropdownPosition] = useState<{top: number, left: number} | null>(null)
  const [fontDropdownPosition, setFontDropdownPosition] = useState<{top: number, left: number} | null>(null)
  const [fontSizeDropdownPosition, setFontSizeDropdownPosition] = useState<{top: number, left: number} | null>(null)
  const [lineHeightDropdownPosition, setLineHeightDropdownPosition] = useState<{top: number, left: number} | null>(null)
  const [spacingDropdownPosition, setSpacingDropdownPosition] = useState<{top: number, left: number} | null>(null)
  const [headingDropdownPosition, setHeadingDropdownPosition] = useState<{top: number, left: number} | null>(null)

  // Helper function to close all dropdowns
  const closeAllDropdowns = () => {
    setShowColorSelector(false)
    setShowHighlightSelector(false)
    setShowFontSelector(false)
    setShowHeadingSelector(false)
    setShowFontSizeSelector(false)
    setShowLineHeightSelector(false)
    setShowSpacingSelector(false)
  }

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
  const [showAddCommentForm, setShowAddCommentForm] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [aiInstruction, setAiInstruction] = useState('')
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [isInlineProcessing, setIsInlineProcessing] = useState(false)

  // Get document content store for animations
  const { setEditor: registerEditor } = useDocumentContent()

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
      StreamingExtension,
    ],
    content: initialContent || (savedContent ? JSON.parse(savedContent) : '<p>Hello, start typing here...</p>'),
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none w-full max-w-none min-h-[calc(100vh-16rem)]',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();

      // Don't convert on every keystroke - just store JSON
      // Conversion happens only when needed (e.g., when sending to AI)
      localStorage.setItem('tiptap-document', JSON.stringify(json));

      // Send a simple update notification without heavy conversion
      // The actual HTML will be converted to markdown only when sending to AI
      if (onContentChange && !isInternalUpdate.current) {
        console.log('⌨️ [EDITOR] onUpdate → onContentChange (isInternalUpdate:', isInternalUpdate.current, ')');
        const html = editor.getHTML();
        onContentChange(html);
      } else if (isInternalUpdate.current) {
        console.log('⏭️ [EDITOR] onUpdate SKIPPED (isInternalUpdate=true)');
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      setSelectedText(text);
    },
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

  // Handle click-to-clear welcome message on first interaction
  useEffect(() => {
    if (!editor) return

    const handleFirstInteraction = () => {
      // Only clear once, on first interaction
      if (hasUserInteracted.current) return

      const currentHTML = editor.getHTML()
      const welcomeMessage = '<h1>Welcome to your new document</h1><p>Start typing here...</p>'

      // Check if current content matches the welcome message
      if (currentHTML === welcomeMessage) {
        hasUserInteracted.current = true
        isInternalUpdate.current = true

        // Clear the content and focus
        editor.commands.setContent('')
        editor.commands.focus()

        setTimeout(() => {
          isInternalUpdate.current = false
        }, 10)
      } else {
        // If content is different, mark as interacted
        hasUserInteracted.current = true
      }
    }

    // Listen for focus event
    editor.on('focus', handleFirstInteraction)

    return () => {
      editor.off('focus', handleFirstInteraction)
    }
  }, [editor])

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
      const welcomeMessage = '<h1>Welcome to your new document</h1><p>Start typing here...</p>'
      if (initialContent === welcomeMessage) {
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

  // Handle markdown mode toggle
  const handleMarkdownToggle = async () => {
    if (!editor) return;

    if (markdownMode) {
      // Switch FROM rich text editor TO raw HTML textarea
      // Store the raw HTML (preserves ALL formatting including highlights, colors, etc.)
      const html = editor.getHTML();
      setMarkdownText(html); // Store HTML, not markdown
      setMarkdownMode(false);
    } else {
      // Switch FROM raw HTML textarea TO rich text editor
      // Restore the HTML directly (no conversion needed)
      isInternalUpdate.current = true;
      editor.commands.setContent(markdownText);
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 10);
      setMarkdownMode(true);
    }
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

  if (!isMounted) {
    return null
  }

  if (!editor) {
    return <div>Loading editor...</div>
  }

  return (
    <>
      <div className="border rounded-lg bg-background shadow-sm h-full flex flex-col w-full overflow-x-hidden overflow-y-hidden" style={{ position: 'relative', isolation: 'isolate' }}>
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 pl-3 bg-muted/20 border-b overflow-x-auto overflow-y-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1000 }}>
          {/* Sidebar Toggle + Markdown Toggle + Comments + Tools (ClickUp-style) */}
          <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
            <SidebarTrigger className="p-2 bg-black hover:bg-black/80 text-white rounded" />

            <MenuButton
              onClick={handleMarkdownToggle}
              isActive={!markdownMode}
              title={markdownMode ? "Rich Text Mode (Click for raw HTML)" : "Raw HTML Mode (Click for rich text)"}
            >
              {markdownMode ? <FileText className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
            </MenuButton>

            <MenuButton
              onClick={() => {
                setIsCommentsPanelOpen(!isCommentsPanelOpen)
                if (!isCommentsPanelOpen) {
                  setPanelTab('comments')
                }
              }}
              isActive={isCommentsPanelOpen && panelTab === 'comments'}
              title="Comments"
            >
              <MessageSquare className="h-4 w-4" />
            </MenuButton>
            <MenuButton
              onClick={() => {
                setIsCommentsPanelOpen(!isCommentsPanelOpen)
                if (!isCommentsPanelOpen) {
                  setPanelTab('tools')
                } else {
                  setPanelTab('tools')
                }
              }}
              isActive={isCommentsPanelOpen && panelTab === 'tools'}
              title="Tools"
            >
              <Wrench className="h-4 w-4" />
            </MenuButton>
          </div>

          {/* Text formatting */}
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
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton 
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
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
              onClick={() => editor.chain().focus().unsetAllMarks().run()}
              title="Clear Formatting"
            >
              <Eraser className="h-4 w-4" />
            </MenuButton>

            <div className="relative" data-dropdown="color">
              <MenuButton
                onClick={(e) => {
                  e?.stopPropagation()
                  const wasOpen = showColorSelector
                  closeAllDropdowns()
                  const btn = e?.currentTarget
                  if (btn) {
                    const rect = btn.getBoundingClientRect()
                    setDropdownPosition({ top: rect.bottom + 4, left: rect.left })
                  }
                  setShowColorSelector(!wasOpen)
                }}
                isActive={editor.isActive('textStyle')}
                title="Text Color"
              >
                <Palette className="h-4 w-4" />
              </MenuButton>
            </div>

            <div className="relative" data-dropdown="highlight">
              <MenuButton
                ref={highlightButtonRef}
                onClick={(e) => {
                  e?.stopPropagation()
                  const wasOpen = showHighlightSelector
                  closeAllDropdowns()
                  const btn = highlightButtonRef.current
                  if (btn) {
                    const rect = btn.getBoundingClientRect()
                    setHighlightDropdownPosition({ top: rect.bottom + 4, left: rect.left })
                  }
                  setShowHighlightSelector(!wasOpen)
                }}
                isActive={editor.isActive('highlight')}
                title="Highlight Color"
              >
                <Highlighter className="h-4 w-4" />
              </MenuButton>
            </div>

            <div className="relative" data-dropdown="font">
              <MenuButton
                ref={fontButtonRef}
                onClick={(e) => {
                  e?.stopPropagation()
                  const wasOpen = showFontSelector
                  closeAllDropdowns()
                  const btn = fontButtonRef.current
                  if (btn) {
                    const rect = btn.getBoundingClientRect()
                    setFontDropdownPosition({ top: rect.bottom + 4, left: rect.left })
                  }
                  setShowFontSelector(!wasOpen)
                }}
                title="Font Family"
              >
                <Type className="h-4 w-4" />
              </MenuButton>
            </div>

            <div className="relative" data-dropdown="fontsize">
              <MenuButton
                ref={fontSizeButtonRef}
                onClick={(e) => {
                  e?.stopPropagation()
                  const wasOpen = showFontSizeSelector
                  closeAllDropdowns()
                  const btn = fontSizeButtonRef.current
                  if (btn) {
                    const rect = btn.getBoundingClientRect()
                    setFontSizeDropdownPosition({ top: rect.bottom + 4, left: rect.left })
                  }
                  setShowFontSizeSelector(!wasOpen)
                }}
                title="Font Size"
              >
                <div className="flex items-center gap-1">
                  {(() => {
                    const fontSize = editor.getAttributes('textStyle').fontSize
                    return fontSize ? (
                      <span className="text-xs font-medium">{fontSize}</span>
                    ) : (
                      <TextSelect className="h-4 w-4" />
                    )
                  })()}
                  <ChevronDown className="h-3 w-3" />
                </div>
              </MenuButton>
            </div>

            <div className="relative" data-dropdown="lineheight">
              <MenuButton
                ref={lineHeightButtonRef}
                onClick={(e) => {
                  e?.stopPropagation()
                  const wasOpen = showLineHeightSelector
                  closeAllDropdowns()
                  const btn = lineHeightButtonRef.current
                  if (btn) {
                    const rect = btn.getBoundingClientRect()
                    setLineHeightDropdownPosition({ top: rect.bottom + 4, left: rect.left })
                  }
                  setShowLineHeightSelector(!wasOpen)
                }}
                title="Line Height"
              >
                <AlignJustify className="h-4 w-4" />
              </MenuButton>
            </div>

            <div className="relative" data-dropdown="spacing">
              <MenuButton
                ref={spacingButtonRef}
                onClick={(e) => {
                  e?.stopPropagation()
                  const wasOpen = showSpacingSelector
                  closeAllDropdowns()
                  const btn = spacingButtonRef.current
                  if (btn) {
                    const rect = btn.getBoundingClientRect()
                    setSpacingDropdownPosition({ top: rect.bottom + 4, left: rect.left })
                  }
                  setShowSpacingSelector(!wasOpen)
                }}
                title="Paragraph Spacing"
              >
                <SeparatorVertical className="h-4 w-4" />
              </MenuButton>
            </div>
          </div>

          {/* Headings and blocks */}
          <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
            <div className="relative" data-dropdown="heading">
              <MenuButton
                ref={headingButtonRef}
                onClick={(e) => {
                  e?.stopPropagation()
                  const wasOpen = showHeadingSelector
                  closeAllDropdowns()
                  const btn = headingButtonRef.current
                  if (btn) {
                    const rect = btn.getBoundingClientRect()
                    setHeadingDropdownPosition({ top: rect.bottom + 4, left: rect.left })
                  }
                  setShowHeadingSelector(!wasOpen)
                }}
                title="Text Style"
              >
                <div className="flex items-center gap-1">
                  {/* Show current heading level or "P" for paragraph */}
                  {editor.isActive('heading', { level: 1 }) ? (
                    <Heading1 className="h-4 w-4" />
                  ) : editor.isActive('heading', { level: 2 }) ? (
                    <Heading2 className="h-4 w-4" />
                  ) : editor.isActive('heading', { level: 3 }) ? (
                    <Heading3 className="h-4 w-4" />
                  ) : editor.isActive('heading', { level: 4 }) ? (
                    <span className="text-xs font-semibold">H4</span>
                  ) : editor.isActive('heading', { level: 5 }) ? (
                    <span className="text-xs font-semibold">H5</span>
                  ) : editor.isActive('heading', { level: 6 }) ? (
                    <span className="text-xs font-semibold">H6</span>
                  ) : (
                    <span className="text-xs font-semibold">P</span>
                  )}
                  <ChevronDown className="h-3 w-3" />
                </div>
              </MenuButton>
            </div>
            
            <MenuButton 
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
              title="Code Block"
            >
              <Code className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton 
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton 
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              <SeparatorHorizontal className="h-4 w-4" />
            </MenuButton>
          </div>
          
          {/* Lists */}
          <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
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
            
            <MenuButton 
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive('taskList')}
              title="Task List"
            >
              <CheckSquare className="h-4 w-4" />
            </MenuButton>
          </div>
          
          {/* Links and Comments */}
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
            
            <MenuButton 
              onClick={handleAddComment}
              disabled={!selectedText}
              title="Add Comment"
            >
              <MessageSquare className="h-4 w-4" />
            </MenuButton>
          </div>
          
          {/* Undo/Redo */}
          <div className="flex gap-1 flex-shrink-0">
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
          </div>
          {toolbarActions && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {toolbarActions}
            </div>
          )}
        </div>
        
        {/* Main content area with editor and comments panel */}
        <div className="flex-1 relative overflow-hidden" style={{ zIndex: 1 }}>
          {/* Editor Content */}
          <div className={cn(
            "p-4 h-full overflow-y-auto scrollbar-hide transition-all duration-300 ease-in-out",
            isCommentsPanelOpen ? "pr-[21rem]" : "pr-4"
          )}>
            {markdownMode ? (
              <EditorContent editor={editor} className="w-full" />
            ) : (
              <textarea
                value={markdownText}
                onChange={(e) => setMarkdownText(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="<h1>Raw HTML view</h1><p>Edit the HTML directly...</p>"
              />
            )}
          </div>

          {/* Tabbed Side Panel (Comments + Tools) */}
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
          />
        </div>
        
        {/* Bubble Menu - v0 Version */}
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{
              duration: 100,
              zIndex: 99999,
              appendTo: () => document.body
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
      {isMounted && showColorSelector && dropdownPosition && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="color"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <ColorSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && showHighlightSelector && highlightDropdownPosition && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="highlight"
          style={{
            top: `${highlightDropdownPosition.top}px`,
            left: `${highlightDropdownPosition.left}px`
          }}
        >
          <HighlightColorSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && showFontSelector && fontDropdownPosition && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="font"
          style={{
            top: `${fontDropdownPosition.top}px`,
            left: `${fontDropdownPosition.left}px`
          }}
        >
          <FontSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && showFontSizeSelector && fontSizeDropdownPosition && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="fontsize"
          style={{
            top: `${fontSizeDropdownPosition.top}px`,
            left: `${fontSizeDropdownPosition.left}px`
          }}
        >
          <FontSizeSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && showLineHeightSelector && lineHeightDropdownPosition && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="lineheight"
          style={{
            top: `${lineHeightDropdownPosition.top}px`,
            left: `${lineHeightDropdownPosition.left}px`
          }}
        >
          <LineHeightSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && showSpacingSelector && spacingDropdownPosition && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="spacing"
          style={{
            top: `${spacingDropdownPosition.top}px`,
            left: `${spacingDropdownPosition.left}px`
          }}
        >
          <SpacingSelector editor={editor} />
        </div>,
        document.body
      )}

      {isMounted && showHeadingSelector && headingDropdownPosition && createPortal(
        <div
          className="fixed z-[99999]"
          data-dropdown-menu="heading"
          style={{
            top: `${headingDropdownPosition.top}px`,
            left: `${headingDropdownPosition.left}px`
          }}
        >
          <HeadingSelector editor={editor} />
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
    </>
  )
}
