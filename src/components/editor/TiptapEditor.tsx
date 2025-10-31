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
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import CommentExtension, { Comment } from './CommentExtension'
import CommentsPanel, { AddCommentForm } from './CommentsPanel'
import { AIBubbleMenuContent } from './AIBubbleMenu'
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
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onCommentsChange?: (comments: Comment[]) => void;
  toolbarActions?: React.ReactNode;
  onAIEdit?: (selectedText: string, instruction: string) => void;
  selectedModel?: string;
}

const savedContent = typeof window !== 'undefined' ? localStorage.getItem('tiptap-document') : null;
const initialComments = typeof window !== 'undefined' ? localStorage.getItem('tiptap-comments') : null;

export default function TiptapEditor({ initialContent, onContentChange, onCommentsChange, toolbarActions, onAIEdit, selectedModel }: TiptapEditorProps = {}) {
  const [isMounted, setIsMounted] = useState(false)
  const [showColorSelector, setShowColorSelector] = useState(false)
  const [showFontSelector, setShowFontSelector] = useState(false)
  const [comments, setComments] = useState<Comment[]>(initialComments ? JSON.parse(initialComments) : [])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)

  useEffect(() => {
    if (onCommentsChange) {
      onCommentsChange(comments);
    }
    localStorage.setItem('tiptap-comments', JSON.stringify(comments));
  }, [comments, onCommentsChange]);
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false)
  const [showAddCommentForm, setShowAddCommentForm] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [aiInstruction, setAiInstruction] = useState('')
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [isInlineProcessing, setIsInlineProcessing] = useState(false)
  
  // Initialize the editor
  const editor = useEditor({
    extensions: [
      StarterKit,
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

  // Update editor content when initialContent prop changes
  useEffect(() => {
    if (editor && initialContent && initialContent !== editor.getText()) {
      editor.commands.setContent(initialContent);
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
        tone: 'Adjust the writing style and tone of this text to be more engaging'
      };

      const instruction = instructions[action] || 'Improve this text';

      // Call the inline edit API with the selected model
      const response = await fetch('/api/inline-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          instruction,
          model: selectedModel || 'anthropic/claude-haiku-4-5-20251001' // Use chat's selected model or default to Haiku
        })
      });

      const result = await response.json();

      if (result.editedText) {
        // Replace the selected text with the edited version
        editor.chain()
          .focus()
          .deleteRange({ from, to })
          .insertContentAt(from, result.editedText)
          .setTextSelection({ from, to: from + result.editedText.length })
          .run();
      }
    } catch (error) {
      console.error('Inline edit failed:', error);
    } finally {
      setIsInlineProcessing(false);
    }
  }

  // Handle chat actions (send to chat)
  const handleChatAction = (action: string) => {
    if (!editor || !selectedText || !onAIEdit) return

    const instructions: Record<string, string> = {
      research: `Research and verify this information with web search: "${selectedText}"`,
      ask: `Answer this question about the selected text: "${selectedText}"`
    };

    const instruction = instructions[action] || selectedText;
    onAIEdit(selectedText, instruction);
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
      <div className="border rounded-lg bg-background shadow-sm h-full flex flex-col">
        {/* Toolbar */}
        <div className="flex justify-between items-center flex-wrap gap-1 p-2 bg-muted/20 border-b">
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
          <div>{toolbarActions}</div>
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
          
          {/* Comments Panel */}
          <div className={cn(
            "absolute top-0 right-0 h-full transition-transform duration-300 ease-in-out",
            isCommentsPanelOpen ? "translate-x-0" : "translate-x-full"
          )}>
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
        </div>
        
        {/* Bubble Menu */}
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="bg-background border rounded-lg shadow-xl overflow-hidden"
          >
            {!showAIMenu ? (
              // Compact view with formatting buttons + AI button
              <div className="flex items-center p-1 gap-1">
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

                {/* Divider */}
                <div className="h-6 w-px bg-border mx-1" />

                {/* AI Menu Button */}
                <MenuButton
                  onClick={() => setShowAIMenu(true)}
                  disabled={!selectedText}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  title="AI Actions"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs ml-1 font-medium">AI</span>
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </MenuButton>
              </div>
            ) : (
              // Expanded AI menu
              <div className="relative">
                <button
                  onClick={() => setShowAIMenu(false)}
                  className="absolute top-2 right-2 p-1 hover:bg-muted rounded transition-colors z-10"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
                <AIBubbleMenuContent
                  onInlineAction={handleInlineAction}
                  onChatAction={handleChatAction}
                  isProcessing={isInlineProcessing}
                  hasSelection={!!selectedText}
                />
              </div>
            )}
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
