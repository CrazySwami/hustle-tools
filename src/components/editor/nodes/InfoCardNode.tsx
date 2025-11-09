import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import React from 'react'
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const InfoCardComponent = ({ node }: any) => {
  const { type, title, icon, content, bullets, footer } = node.attrs

  const typeStyles = {
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    success: 'border-green-500 bg-green-50 dark:bg-green-950',
    error: 'border-red-500 bg-red-50 dark:bg-red-950',
  }

  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    error: XCircle,
  }

  const Icon = icons[type as keyof typeof icons] || Info

  return (
    <NodeViewWrapper className="info-card-node my-4">
      <div className={`rounded-lg border-l-4 p-4 ${typeStyles[type as keyof typeof typeStyles]}`}>
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            {title && <h4 className="mb-2 font-semibold">{title}</h4>}
            {content && <p className="mb-2">{content}</p>}
            {bullets && bullets.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {bullets.map((bullet: string, i: number) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            )}
            {footer && <p className="mt-2 text-sm text-muted-foreground">{footer}</p>}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const InfoCardNode = Node.create({
  name: 'infoCard',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      type: { default: 'info' },
      title: { default: '' },
      icon: { default: '' },
      content: { default: '' },
      bullets: { default: [] },
      footer: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="info-card"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'info-card' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoCardComponent)
  },

  addCommands() {
    return {
      insertInfoCard: (attrs) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs,
        })
      },
    }
  },
})
