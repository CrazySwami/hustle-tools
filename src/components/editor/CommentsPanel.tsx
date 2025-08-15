import React, { useState, useEffect } from 'react'
import { Comment } from './CommentExtension'
import { X, MessageSquare, Check, Plus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentsPanelProps {
  comments: Comment[]
  activeCommentId: string | null
  onCommentClick: (commentId: string) => void
  onCommentResolve: (commentId: string) => void
  onCommentDelete: (commentId: string) => void
  onAddComment: () => void
  isOpen: boolean
  onToggle: () => void
}

type TabType = 'active' | 'resolved'

export default function CommentsPanel({
  comments,
  activeCommentId,
  onCommentClick,
  onCommentResolve,
  onCommentDelete,
  onAddComment,
  isOpen,
  onToggle,
}: CommentsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('active')
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
      {/* Panel container with toggle button - both move together */}
      <div className="relative">
        <div className={cn(
          "h-screen transition-all duration-300 ease-in-out bg-background border-l shadow-lg flex flex-col",
          isOpen ? "w-80" : "w-0 opacity-0"
        )}>
          {isOpen && (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-medium">Comments</h3>
                <button 
                  onClick={onAddComment}
                  className="p-1 rounded-full hover:bg-muted"
                  title="Add comment"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('active')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium",
                    activeTab === 'active' 
                      ? "border-b-2 border-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  Active
                </button>
                <button
                  onClick={() => setActiveTab('resolved')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium",
                    activeTab === 'resolved' 
                      ? "border-b-2 border-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  Resolved
                </button>
              </div>
              
              {/* Comments list */}
              <div className="flex-1 overflow-y-auto p-2">
                {filteredComments.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
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
            </>
          )}
        </div>
        
        {/* Toggle button - positioned relative to the panel container */}
        <button 
          onClick={onToggle}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-primary text-primary-foreground rounded-l-full p-2 shadow-md"
        >
          <MessageSquare size={16} />
        </button>
      </div>
      
      {/* Delete confirmation modal */}
      {commentToDelete && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-sm p-4">
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
        "p-3 rounded-md border transition-colors",
        isActive ? "bg-muted border-primary" : "hover:bg-muted/50",
        isHighlighted && "ring-2 ring-primary ring-offset-1"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.author}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm mt-1">{comment.text}</p>
        </div>
        
        <div className="flex gap-1">
          {showResolveButton && (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onResolve()
              }}
              className="p-1 rounded-sm hover:bg-background text-muted-foreground"
              title="Resolve"
            >
              <Check size={14} />
            </button>
          )}
          
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onDeleteRequest()
            }}
            className="p-1 rounded-sm hover:bg-background text-muted-foreground"
            title="Delete"
          >
            <X size={14} />
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
