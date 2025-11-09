import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import React from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

const ChartComponent = ({ node }: any) => {
  const { type, title, data, options } = node.attrs

  const ChartType = type === 'bar' ? Bar : type === 'line' ? Line : type === 'pie' ? Pie : Doughnut

  return (
    <NodeViewWrapper className="chart-node my-4">
      <div className="rounded-lg border bg-card p-4">
        {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
        <div className="max-w-2xl">
          <ChartType data={data} options={options} />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const ChartNode = Node.create({
  name: 'chart',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      type: { default: 'bar' },
      title: { default: '' },
      data: { default: {} },
      options: { default: {} },
      fallbackText: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="chart"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'chart' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartComponent)
  },

  addCommands() {
    return {
      insertChart: (attrs) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs,
        })
      },
    }
  },
})
