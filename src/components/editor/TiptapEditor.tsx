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
import { useState, useEffect, useCallback } from 'react'
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
  AlignJustify
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
import '@/styles/comments.css'

const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title = ''
}: {
  onClick: (e?: React.MouseEvent) => void,
  isActive?: boolean,
  disabled?: boolean,
  children: React.ReactNode,
  title?: string
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
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
}

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
    <div className="p-3 bg-background border rounded-md shadow-lg w-64">
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
    <div className="p-3 bg-background border rounded-md shadow-lg w-64">
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
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
  }

  return (
    <div className="p-3 bg-background border rounded-md shadow-lg w-56">
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
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90"
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

interface TiptapEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onCommentsChange?: (comments: Comment[]) => void;
  toolbarActions?: React.ReactNode;
  onAIEdit?: (selectedText: string, instruction: string, enableWebSearch?: boolean) => void;
  selectedModel?: string;
}

const savedContent = typeof window !== 'undefined' ? localStorage.getItem('tiptap-document') : null;
const initialComments = typeof window !== 'undefined' ? localStorage.getItem('tiptap-comments') : null;

export default function TiptapEditor({ initialContent, onContentChange, onCommentsChange, toolbarActions, onAIEdit, selectedModel }: TiptapEditorProps = {}) {
  const [isMounted, setIsMounted] = useState(false)
  const [showColorSelector, setShowColorSelector] = useState(false)
  const [showHighlightSelector, setShowHighlightSelector] = useState(false)
  const [showFontSelector, setShowFontSelector] = useState(false)
  const [showHeadingSelector, setShowHeadingSelector] = useState(false)
  const [showFontSizeSelector, setShowFontSizeSelector] = useState(false)
  const [showLineHeightSelector, setShowLineHeightSelector] = useState(false)
  const [comments, setComments] = useState<Comment[]>(initialComments ? JSON.parse(initialComments) : [])

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Check if click is on a dropdown or dropdown button
      const isDropdownClick = target.closest('[data-dropdown]') || target.closest('[data-dropdown-menu]')

      if (!isDropdownClick) {
        setShowColorSelector(false)
        setShowHighlightSelector(false)
        setShowFontSelector(false)
        setShowHeadingSelector(false)
        setShowFontSizeSelector(false)
        setShowLineHeightSelector(false)
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
    extensions: [
      StarterKit.configure({
        // Enable markdown-style input rules
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
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
      const text = editor.getText();
      if (onContentChange) {
        onContentChange(text);
      }
      localStorage.setItem('tiptap-document', JSON.stringify(json));
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

  // Update editor content when initialContent prop changes
  useEffect(() => {
    if (editor && initialContent && initialContent !== editor.getText()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Sync initial editor content to parent on mount
  useEffect(() => {
    if (editor && onContentChange) {
      const text = editor.getText();
      onContentChange(text);
    }
  }, [editor]); // Only run when editor is created

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
      <div className="border rounded-lg bg-background shadow-sm h-full flex flex-col w-full max-w-full overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 bg-muted/20 border-b overflow-x-auto min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
            
            <div className="relative" data-dropdown="color">
              <MenuButton
                onClick={(e) => {
                  e?.stopPropagation()
                  setShowColorSelector(!showColorSelector)
                }}
                isActive={editor.isActive('textStyle')}
                title="Text Color"
              >
                <Palette className="h-4 w-4" />
              </MenuButton>
              {showColorSelector && (
                <div className="absolute z-[9999] top-full left-0 mt-1" data-dropdown-menu="color">
                  <ColorSelector editor={editor} />
                </div>
              )}
            </div>

            <div className="relative" data-dropdown="highlight">
              <MenuButton
                onClick={(e) => {
                  e?.stopPropagation()
                  setShowHighlightSelector(!showHighlightSelector)
                }}
                isActive={editor.isActive('highlight')}
                title="Highlight Color"
              >
                <Highlighter className="h-4 w-4" />
              </MenuButton>
              {showHighlightSelector && (
                <div className="absolute z-[9999] top-full left-0 mt-1" data-dropdown-menu="highlight">
                  <HighlightColorSelector editor={editor} />
                </div>
              )}
            </div>

            <div className="relative" data-dropdown="font">
              <MenuButton
                onClick={(e) => {
                  e?.stopPropagation()
                  setShowFontSelector(!showFontSelector)
                }}
                title="Font Family"
              >
                <Type className="h-4 w-4" />
              </MenuButton>
              {showFontSelector && (
                <div className="absolute z-[9999] top-full left-0 mt-1" data-dropdown-menu="font">
                  <FontSelector editor={editor} />
                </div>
              )}
            </div>

            <div className="relative" data-dropdown="fontsize">
              <MenuButton
                onClick={(e) => {
                  e?.stopPropagation()
                  setShowFontSizeSelector(!showFontSizeSelector)
                }}
                title="Font Size"
              >
                <TextSelect className="h-4 w-4" />
              </MenuButton>
              {showFontSizeSelector && (
                <div className="absolute z-[9999] top-full left-0 mt-1" data-dropdown-menu="fontsize">
                  <FontSizeSelector editor={editor} />
                </div>
              )}
            </div>

            <div className="relative" data-dropdown="lineheight">
              <MenuButton
                onClick={(e) => {
                  e?.stopPropagation()
                  setShowLineHeightSelector(!showLineHeightSelector)
                }}
                title="Line Height"
              >
                <AlignJustify className="h-4 w-4" />
              </MenuButton>
              {showLineHeightSelector && (
                <div className="absolute z-[9999] top-full left-0 mt-1" data-dropdown-menu="lineheight">
                  <LineHeightSelector editor={editor} />
                </div>
              )}
            </div>
          </div>

          {/* Headings and blocks */}
          <div className="flex gap-1 mr-2 border-r pr-2 flex-shrink-0">
            <div className="relative" data-dropdown="heading">
              <MenuButton
                onClick={(e) => {
                  e?.stopPropagation()
                  setShowHeadingSelector(!showHeadingSelector)
                }}
                title="Text Style"
              >
                <div className="flex items-center gap-1">
                  <Heading1 className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </div>
              </MenuButton>
              {showHeadingSelector && (
                <div className="absolute z-[9999] top-full left-0 mt-1" data-dropdown-menu="heading">
                  <HeadingSelector editor={editor} />
                </div>
              )}
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
          <div className="flex items-center gap-1 flex-shrink-0">
            <MenuButton
              onClick={() => {
                setIsCommentsPanelOpen(!isCommentsPanelOpen)
                // Ensure we're on comments tab when opening
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
                // Ensure we're on tools tab when opening
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
            {toolbarActions}
          </div>
        </div>
        
        {/* Main content area with editor and comments panel */}
        <div className="flex-1 relative overflow-hidden">
          {/* Editor Content */}
          <div className={cn(
            "p-4 h-full overflow-y-auto transition-all duration-300 ease-in-out",
            isCommentsPanelOpen ? "pr-[21rem]" : "pr-4"
          )}>
            <EditorContent editor={editor} className="w-full" />
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
