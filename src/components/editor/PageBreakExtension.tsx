import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React from 'react'
import { NodeViewProps } from '@tiptap/react'

// PageBreak Node View Component
function PageBreakComponent({ editor, getPos, extension }: NodeViewProps) {
  // Get page configuration from extension options
  const pageHeight = extension.options.pageHeight || 1056
  const marginTop = extension.options.marginTop || 96
  const marginBottom = extension.options.marginBottom || 96
  const pageGap = extension.options.pageGap || 24

  // Calculate dynamic spacing to jump to next page
  const calculateSpacing = () => {
    try {
      if (typeof getPos !== 'function') return 24 // Fallback

      const pos = getPos()
      const resolvedPos = editor.state.doc.resolve(pos)
      const domNode = editor.view.nodeDOM(pos)

      if (!domNode) return 24 // Fallback

      // Get the Y position of the page break in the editor
      const editorElement = editor.view.dom.parentElement
      if (!editorElement) return 24

      const editorRect = editorElement.getBoundingClientRect()
      const nodeRect = (domNode as HTMLElement).getBoundingClientRect()
      const currentY = nodeRect.top - editorRect.top

      // Calculate which page we're on and position within that page
      const contentHeight = pageHeight - (marginTop + marginBottom)
      const totalPageHeight = pageHeight + pageGap // Each "page unit" including its following gap

      const currentPageIndex = Math.floor(currentY / totalPageHeight)
      const nextPageStart = (currentPageIndex + 1) * totalPageHeight

      // Calculate spacing needed to reach next page start
      const spacingNeeded = Math.max(24, nextPageStart - currentY)

      return spacingNeeded
    } catch (error) {
      console.warn('PageBreak spacing calculation error:', error)
      return 24 // Fallback to minimum spacing
    }
  }

  const spacing = calculateSpacing()

  return (
    <NodeViewWrapper
      className="page-break-node"
      data-type="page-break"
      contentEditable={false}
      style={{
        display: 'block',
        margin: '0',
        padding: `${spacing}px 0 0 0`, // Dynamic padding to reach next page
        userSelect: 'none',
        position: 'relative',
        height: 'auto',
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* Hidden by CSS but kept for structure */}
      <div
        style={{
          position: 'relative',
          height: '2px',
          background: 'repeating-linear-gradient(to right, #ccc 0px, #ccc 8px, transparent 8px, transparent 16px)',
        }}
      />
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

  addOptions() {
    return {
      pageHeight: 1056,
      marginTop: 96,
      marginBottom: 96,
      marginLeft: 96,
      marginRight: 96,
      pageGap: 24,
    }
  },

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
        'style': 'page-break-after: always; break-after: page; display: block; margin: 0; padding: 24px 0;'
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
