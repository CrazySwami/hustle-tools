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
import { useState, useEffect } from 'react'
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
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import CommentExtension, { Comment } from './CommentExtension'
import CommentsPanel, { AddCommentForm } from './CommentsPanel'
import '@/styles/comments.css'

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false,
  children,
  title = ''
}: { 
  onClick: () => void, 
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
  const colors = [
    { name: 'Default', value: 'inherit' },
    { name: 'Red', value: '#ff0000' },
    { name: 'Green', value: '#00ff00' },
    { name: 'Blue', value: '#0000ff' },
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Purple', value: '#800080' },
    { name: 'Orange', value: '#ffa500' },
  ]

  return (
    <div className="flex flex-wrap gap-1 p-1 bg-background border rounded-md shadow-sm">
      {colors.map((color) => (
        <button
          key={color.value}
          onClick={() => editor.chain().focus().setColor(color.value).run()}
          className="w-5 h-5 rounded-full border"
          style={{ backgroundColor: color.value }}
          title={color.name}
        />
      ))}
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
    { name: 'Arial', value: 'Arial' },
    { name: 'Courier New', value: 'Courier New' },
    { name: 'Georgia', value: 'Georgia' },
    { name: 'Times New Roman', value: 'Times New Roman' },
    { name: 'Verdana', value: 'Verdana' },
  ]

  return (
    <div className="flex flex-col gap-1 p-1 bg-background border rounded-md shadow-sm">
      {fonts.map((font) => (
        <button
          key={font.value}
          onClick={() => editor.chain().focus().setFontFamily(font.value).run()}
          className="px-2 py-1 text-left hover:bg-muted rounded-sm"
          style={{ fontFamily: font.value }}
        >
          {font.name}
        </button>
      ))}
    </div>
  )
}

interface TiptapEditorProps {
  onContentChange?: (content: string) => void;
}

export default function TiptapEditor({ onContentChange }: TiptapEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [showColorSelector, setShowColorSelector] = useState(false)
  const [showFontSelector, setShowFontSelector] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false)
  const [showAddCommentForm, setShowAddCommentForm] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  
  // Initialize the editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Strike,
      Underline,
      Subscript,
      Superscript,
      TextStyle,
      Color,
      FontFamily,
      Typography,
      Highlight.configure({
        multicolor: true,
      }),
      HorizontalRule,
      HardBreak,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CommentExtension.configure({
        onCommentActivated: (commentId) => {
          if (commentId) {
            // Open the panel if it's not already open
            setIsCommentsPanelOpen(true)
            setActiveCommentId(commentId)
          }
        }
      })
    ],
    content: '<p>Hello, start typing here...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none w-full max-w-none min-h-[calc(100vh-16rem)]',
      },
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from !== to) {
        setSelectedText(editor.state.doc.textBetween(from, to))
      } else {
        setSelectedText('')
      }
    }
  })

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Add a new comment
  const handleAddComment = () => {
    if (!editor || !selectedText) return
    
    setShowAddCommentForm(true)
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
      <div className="w-full border rounded-lg overflow-hidden relative">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 bg-muted/20 border-b">
          {/* Text formatting */}
          <div className="flex flex-wrap gap-1 mr-2 border-r pr-2">
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
            
            <div className="relative">
              <MenuButton 
                onClick={() => setShowColorSelector(!showColorSelector)}
                isActive={editor.isActive('textStyle')}
                title="Text Color"
              >
                <Palette className="h-4 w-4" />
              </MenuButton>
              {showColorSelector && (
                <div className="absolute z-10 top-full left-0 mt-1">
                  <ColorSelector editor={editor} />
                </div>
              )}
            </div>
            
            <MenuButton 
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              title="Highlight"
            >
              <Highlighter className="h-4 w-4" />
            </MenuButton>
            
            <div className="relative">
              <MenuButton 
                onClick={() => setShowFontSelector(!showFontSelector)}
                title="Font Family"
              >
                <TextSelect className="h-4 w-4" />
              </MenuButton>
              {showFontSelector && (
                <div className="absolute z-10 top-full left-0 mt-1">
                  <FontSelector editor={editor} />
                </div>
              )}
            </div>
            
            <MenuButton 
              onClick={() => editor.chain().focus().setFontFamily('inherit').run()}
              title="Clear Formatting"
            >
              <Type className="h-4 w-4" />
            </MenuButton>
          </div>
          
          {/* Headings and blocks */}
          <div className="flex flex-wrap gap-1 mr-2 border-r pr-2">
            <MenuButton 
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton 
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton 
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </MenuButton>
            
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
          <div className="flex flex-wrap gap-1 mr-2 border-r pr-2">
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
          <div className="flex flex-wrap gap-1 mr-2 border-r pr-2">
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
          <div className="ml-auto flex gap-1">
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
        </div>
        
        {/* Main content area with editor and comments panel */}
        <div className="flex h-[calc(100vh-16rem)]">
          {/* Editor Content */}
          <div className={cn(
            "p-4 transition-all duration-300 ease-in-out",
            isCommentsPanelOpen ? "w-[calc(100%-20rem)]" : "w-full"
          )}>
            <EditorContent editor={editor} className="w-full" />
          </div>
          
          {/* Comments Panel */}
          <CommentsPanel 
            comments={comments}
            activeCommentId={activeCommentId}
            onCommentClick={handleCommentClick}
            onCommentResolve={handleCommentResolve}
            onCommentDelete={handleCommentDelete}
            onAddComment={handleAddComment}
            isOpen={isCommentsPanelOpen}
            onToggle={() => setIsCommentsPanelOpen(!isCommentsPanelOpen)}
          />
        </div>
        
        {/* Bubble Menu */}
        {editor && (
          <BubbleMenu 
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="bg-background border rounded-md shadow-md flex p-1 gap-1"
          >
            <MenuButton 
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
            >
              <Bold className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton 
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
            >
              <Italic className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton 
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
            >
              <Strikethrough className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton 
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
            >
              <UnderlineIcon className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton 
              onClick={() => {
                const url = window.prompt('URL')
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run()
                }
              }}
              isActive={editor.isActive('link')}
            >
              <LinkIcon className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton 
              onClick={handleAddComment}
              disabled={!selectedText}
            >
              <MessageSquare className="h-4 w-4" />
            </MenuButton>
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
