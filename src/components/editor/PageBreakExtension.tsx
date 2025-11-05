import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React from 'react'

// PageBreak Node View Component
function PageBreakComponent() {
  return (
    <NodeViewWrapper className="page-break-wrapper">
      <div className="page-break" contentEditable={false}>
        <div className="page-break-label">Page Break</div>
      </div>
    </NodeViewWrapper>
  )
}

// PageBreak Tiptap Extension
export const PageBreak = Node.create({
  name: 'pageBreak',

  group: 'block',

  atom: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'page-break', class: 'page-break-wrapper' }),
      ['div', { class: 'page-break' }, ['div', { class: 'page-break-label' }, 'Page Break']],
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
          return commands.insertContent({ type: this.name })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      // Ctrl/Cmd + Enter to insert page break
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    }
  },
})
