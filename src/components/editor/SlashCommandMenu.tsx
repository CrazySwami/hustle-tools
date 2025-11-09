'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Editor } from '@tiptap/react'
import { Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Table, Code, Quote, Minus, BarChart3, Info } from 'lucide-react'

export interface SlashCommandMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean
}

interface SlashCommand {
  id: string
  label: string
  description: string
  icon: any
  group: string
  command: () => void
}

export function getDefaultSlashCommands(editor: Editor): SlashCommand[] {
  return [
    {
      id: 'h1',
      label: 'Heading 1',
      description: 'Large section heading',
      icon: Heading1,
      group: 'basic',
      command: () => editor.chain().focus().setHeading({ level: 1 }).run(),
    },
    {
      id: 'h2',
      label: 'Heading 2',
      description: 'Medium section heading',
      icon: Heading2,
      group: 'basic',
      command: () => editor.chain().focus().setHeading({ level: 2 }).run(),
    },
    {
      id: 'h3',
      label: 'Heading 3',
      description: 'Small section heading',
      icon: Heading3,
      group: 'basic',
      command: () => editor.chain().focus().setHeading({ level: 3 }).run(),
    },
    {
      id: 'bullet-list',
      label: 'Bullet List',
      description: 'Create a bullet list',
      icon: List,
      group: 'basic',
      command: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      id: 'numbered-list',
      label: 'Numbered List',
      description: 'Create a numbered list',
      icon: ListOrdered,
      group: 'basic',
      command: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      id: 'task-list',
      label: 'Task List',
      description: 'Create a task list with checkboxes',
      icon: CheckSquare,
      group: 'basic',
      command: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      id: 'table',
      label: 'Table',
      description: 'Insert a table',
      icon: Table,
      group: 'basic',
      command: () => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run(),
    },
    {
      id: 'code-block',
      label: 'Code Block',
      description: 'Insert a code block',
      icon: Code,
      group: 'basic',
      command: () => editor.chain().focus().setCodeBlock().run(),
    },
    {
      id: 'quote',
      label: 'Quote',
      description: 'Insert a blockquote',
      icon: Quote,
      group: 'basic',
      command: () => editor.chain().focus().setBlockquote().run(),
    },
    {
      id: 'divider',
      label: 'Divider',
      description: 'Insert a horizontal line',
      icon: Minus,
      group: 'basic',
      command: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ]
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuRef, any>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { items, command } = props

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        const item = items[selectedIndex]
        if (item) {
          command(item)
        }
        return true
      }
      return false
    },
  }))

  return (
    <div className="z-50 min-w-[200px] rounded-lg border bg-popover p-2 shadow-md">
      {items.length > 0 ? (
        items.map((item: SlashCommand, index: number) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
              onClick={() => command(item)}
            >
              <Icon className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </button>
          )
        })
      ) : (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">No results</div>
      )}
    </div>
  )
})

SlashCommandMenu.displayName = 'SlashCommandMenu'
