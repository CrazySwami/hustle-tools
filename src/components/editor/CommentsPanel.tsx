import React, { useState, useEffect } from 'react'
import { Comment } from './CommentExtension'
import { X, MessageSquare, Check, Plus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CommentTabType = 'active' | 'resolved'

interface CommentsPanelProps {
  comments: Comment[]
  activeCommentId: string | null
  onCommentClick: (commentId: string) => void
  onCommentResolve: (commentId: string) => void
  onCommentDelete: (commentId: string) => void
  onAddComment: () => void
  isOpen: boolean
  onToggle: () => void
  activeTab?: CommentTabType
  onTabChange?: (tab: CommentTabType) => void
}

export default function CommentsPanel({
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
}: CommentsPanelProps) {
  const [internalTab, setInternalTab] = useState<CommentTabType>('active')

  // Use controlled tab if provided, otherwise use internal state
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab
  const setActiveTab = onTabChange || setInternalTab
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null)
  
  // Filter comments based on active tab
  const filteredComments = comments.filter(comment => 
    activeTab === 'active' ? !comment.resolved : comment.resolved
  )
  
  // Highlight effect for newly activated comments
  useEffect(() => {
    if (activeCommentId) {
      setHighlightedCommentId(activeCommentId)
      const timer = setTimeout(() => {
        setHighlightedCommentId(null)
      }, 2000) // Highlight for 2 seconds
      
      return () => clearTimeout(timer)
    }
  }, [activeCommentId])
  
  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header with tabs */}
        <div className="flex items-center justify-between p-3 border-b bg-white/50 dark:bg-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setActiveTab('active')}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded transition-colors",
                activeTab === 'active'
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              Active ({comments.filter(c => !c.resolved).length})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded transition-colors",
                activeTab === 'resolved'
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              Resolved ({comments.filter(c => c.resolved).length})
            </button>
          </div>
          <button
            onClick={onAddComment}
            className="p-1 rounded hover:bg-white/50 dark:hover:bg-white/10 flex-shrink-0"
            title="Add comment"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredComments.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">
              No {activeTab} comments
            </div>
          ) : (
            <div className="space-y-2">
              {filteredComments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isActive={comment.id === activeCommentId}
                  isHighlighted={comment.id === highlightedCommentId}
                  onClick={() => onCommentClick(comment.id)}
                  onResolve={() => onCommentResolve(comment.id)}
                  onDeleteRequest={() => setCommentToDelete(comment.id)}
                  showResolveButton={activeTab === 'active'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {commentToDelete && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#2C2C2C] rounded-lg shadow-lg w-full max-w-sm p-4">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <AlertCircle size={18} />
              <h3 className="font-medium">Delete Comment</h3>
            </div>
            <p className="text-sm mb-4">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCommentToDelete(null)}
                className="px-3 py-1 text-sm rounded hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (commentToDelete) {
                    onCommentDelete(commentToDelete)
                    setCommentToDelete(null)
                  }
                }}
                className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface CommentItemProps {
  comment: Comment
  isActive: boolean
  isHighlighted: boolean
  onClick: () => void
  onResolve: () => void
  onDeleteRequest: () => void
  showResolveButton: boolean
}

function CommentItem({
  comment,
  isActive,
  isHighlighted,
  onClick,
  onResolve,
  onDeleteRequest,
  showResolveButton
}: CommentItemProps) {
  return (
    <div
      className={cn(
        "p-2 rounded border transition-colors cursor-pointer bg-white dark:bg-[#3A3A3A]",
        isActive ? "border-primary ring-1 ring-primary" : "hover:border-primary/50",
        isHighlighted && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium truncate">{comment.author}</span>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-xs break-words">{comment.text}</p>
        </div>

        <div className="flex gap-0.5 flex-shrink-0">
          {showResolveButton && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onResolve()
              }}
              className="p-1 rounded hover:bg-white/50 dark:hover:bg-white/10 text-muted-foreground"
              title="Resolve"
            >
              <Check size={12} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteRequest()
            }}
            className="p-1 rounded hover:bg-white/50 dark:hover:bg-white/10 text-muted-foreground"
            title="Delete"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AddCommentForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (text: string) => void
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit(text)
      setText('')
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="p-3 border rounded-md">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 text-sm border rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Add a comment..."
        rows={3}
        autoFocus
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-xs rounded hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded disabled:opacity-50"
        >
          Comment
        </button>
      </div>
    </form>
  )
}
