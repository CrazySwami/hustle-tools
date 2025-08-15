import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface Comment {
  id: string
  text: string
  from: number
  to: number
  createdAt: Date
  author: string
  resolved: boolean
}

interface CommentOptions {
  HTMLAttributes: Record<string, any>
  onCommentActivated: (commentId: string | null) => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      /**
       * Add a comment to the selected text
       */
      setComment: (commentId: string) => ReturnType
      /**
       * Remove a comment
       */
      unsetComment: (commentId: string) => ReturnType
    }
  }
}

export const CommentExtension = Extension.create<CommentOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
      onCommentActivated: () => {},
    }
  },

  addCommands() {
    return {
      setComment:
        (commentId: string) =>
        ({ tr, dispatch }) => {
          const { selection } = tr
          
          if (selection.empty) {
            return false
          }
          
          if (dispatch) {
            // Store the comment ID as a metadata on the transaction
            tr.setMeta('comment', {
              type: 'add',
              from: selection.from,
              to: selection.to,
              commentId,
            })
          }
          
          return true
        },
      unsetComment:
        (commentId: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            // Store the removal action as metadata on the transaction
            tr.setMeta('comment', {
              type: 'remove',
              commentId,
            })
          }
          
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const { onCommentActivated } = this.options
    
    // Store all active comments
    const comments = new Map<string, { from: number; to: number; id: string }>()
    
    return [
      new Plugin({
        key: new PluginKey('comment'),
        
        // Process metadata from the transaction
        appendTransaction: (transactions, _, newState) => {
          let modified = false
          const tr = newState.tr
          
          transactions.forEach(transaction => {
            const commentMeta = transaction.getMeta('comment')
            
            if (commentMeta) {
              if (commentMeta.type === 'add') {
                // Add comment to our map
                comments.set(commentMeta.commentId, {
                  from: commentMeta.from,
                  to: commentMeta.to,
                  id: commentMeta.commentId,
                })
                modified = true
              } else if (commentMeta.type === 'remove') {
                // Remove comment from our map
                comments.delete(commentMeta.commentId)
                modified = true
              }
            }
          })
          
          return modified ? tr : null
        },
        
        props: {
          // Add decorations to show comments
          decorations(state) {
            const decorations: Decoration[] = []
            
            comments.forEach(comment => {
              decorations.push(
                Decoration.inline(comment.from, comment.to, {
                  class: 'comment-decoration',
                  'data-comment-id': comment.id,
                })
              )
            })
            
            return DecorationSet.create(state.doc, decorations)
          },
          
          // Handle clicks on comments
          handleClick(view, pos) {
            const { state } = view
            const decorations = this.getState(state)
            
            if (!decorations) return false
            
            // Improved comment detection - check if the click is within a comment decoration
            const domAtPos = view.domAtPos(pos)
            let node = domAtPos.node as Node
            let commentId = null
            
            // Traverse up the DOM to find a comment decoration
            while (node && !commentId) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element
                if (element.classList && element.classList.contains('comment-decoration')) {
                  commentId = element.getAttribute('data-comment-id')
                  break
                }
              }
              node = node.parentNode as Node
            }
            
            // If we found a comment, activate it
            if (commentId) {
              onCommentActivated(commentId)
              return true
            }
            
            return false
          },
        },
      }),
    ]
  },
})

export default CommentExtension
