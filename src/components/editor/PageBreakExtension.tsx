import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React from 'react'

// PageBreak Node View Component
function PageBreakComponent() {
  return (
    <NodeViewWrapper 
      className="page-break-node" 
      data-type="page-break"
      contentEditable={false}
      style={{
        margin: '48px 0',
        userSelect: 'none',
        position: 'relative',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div 
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '1px',
          background: 'repeating-linear-gradient(to right, #ccc 0px, #ccc 10px, transparent 10px, transparent 20px)',
        }}
      />
      <div 
        style={{
          position: 'relative',
          background: 'white',
          padding: '4px 16px',
          fontSize: '11px',
          fontWeight: '600',
          color: '#666',
          border: '1px solid #ccc',
          borderRadius: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          zIndex: 1,
        }}
      >
        Page Break
      </div>
    </NodeViewWrapper>
  )
}

// PageBreak Tiptap Extension
export const PageBreak = Node.create({
  name: 'pageBreak',

  group: 'block',

  atom: true,

  selectable: true,

  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
      {
        tag: 'hr[data-type="page-break"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 
        'data-type': 'page-break',
        'class': 'page-break-node',
        'style': 'page-break-after: always; break-after: page; margin: 48px 0; height: 48px;'
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageBreakComponent)
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }) => {
          // Insert page break at current position
          return commands.insertContent({
            type: this.name,
          })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      // Ctrl/Cmd + Enter to insert page break
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
      // Delete key to remove page break when selected
      'Backspace': () => {
        const { $from } = this.editor.state.selection
        const nodeBefore = $from.nodeBefore
        
        if (nodeBefore && nodeBefore.type.name === this.name) {
          return this.editor.commands.deleteNode(this.name)
        }
        
        return false
      },
      'Delete': () => {
        const { $from } = this.editor.state.selection
        const nodeAfter = $from.nodeAfter
        
        if (nodeAfter && nodeAfter.type.name === this.name) {
          return this.editor.commands.deleteNode(this.name)
        }
        
        return false
      },
    }
  },
})
