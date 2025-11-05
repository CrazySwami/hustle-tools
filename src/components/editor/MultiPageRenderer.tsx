'use client'

import { useEffect, useRef, useState } from 'react'
import { Editor } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'

interface MultiPageRendererProps {
  editor: Editor | null
}

const CONTENT_HEIGHT = 864 // 9 inches (11 - 2 inch margins) at 96 DPI

export function MultiPageRenderer({ editor }: MultiPageRendererProps) {
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor || !editorRef.current) return

    const calculatePages = () => {
      const editorElement = editorRef.current
      if (!editorElement) return

      // Get the ProseMirror content element
      const pmContent = editorElement.querySelector('.ProseMirror')
      if (!pmContent) return

      // Calculate total content height
      const totalHeight = pmContent.scrollHeight

      // Calculate number of pages needed
      const pagesNeeded = Math.max(1, Math.ceil(totalHeight / CONTENT_HEIGHT))

      setPageCount(pagesNeeded)

      // Insert visual page separators at page boundaries
      insertPageSeparators(pmContent as HTMLElement, pagesNeeded)
    }

    const insertPageSeparators = (content: HTMLElement, pages: number) => {
      // Remove existing separators
      content.querySelectorAll('.auto-page-separator').forEach(el => el.remove())

      if (pages <= 1) return

      // Walk through nodes and insert separators at page boundaries
      let currentHeight = 0
      let pageNumber = 1
      const children = Array.from(content.children)

      children.forEach((child, index) => {
        const element = child as HTMLElement

        // Skip page breaks and existing separators
        if (element.classList.contains('page-break-wrapper') ||
            element.classList.contains('auto-page-separator')) {
          return
        }

        const elementHeight = element.offsetHeight
        currentHeight += elementHeight

        // If we've exceeded a page boundary, insert a separator
        if (currentHeight > CONTENT_HEIGHT * pageNumber && pageNumber < pages) {
          const separator = document.createElement('div')
          separator.className = 'auto-page-separator'
          separator.style.cssText = `
            height: 0;
            border-top: 2px dashed rgba(0, 0, 0, 0.1);
            margin: ${CONTENT_HEIGHT * pageNumber - currentHeight + elementHeight}px 0 0 0;
            page-break-after: always;
            break-after: page;
          `

          // Insert after current element
          element.after(separator)
          pageNumber++
        }
      })
    }

    // Debounce page calculation
    let timeoutId: NodeJS.Timeout
    const debouncedCalculate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(calculatePages, 100)
    }

    // Initial calculation
    calculatePages()

    // Listen for content changes
    editor.on('update', debouncedCalculate)
    editor.on('transaction', debouncedCalculate)

    // Listen for resize
    window.addEventListener('resize', debouncedCalculate)

    return () => {
      clearTimeout(timeoutId)
      editor.off('update', debouncedCalculate)
      editor.off('transaction', debouncedCalculate)
      window.removeEventListener('resize', debouncedCalculate)
    }
  }, [editor])

  // Track scroll position to update current page
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const page = Math.floor(scrollTop / (CONTENT_HEIGHT + 120)) + 1 // 120 = padding + margin
      setCurrentPage(Math.min(page, pageCount))
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [pageCount])

  if (!editor) {
    return null
  }

  return (
    <div
      className="tiptap-page-view overflow-y-auto scrollbar-hide h-full"
      ref={containerRef}
    >
      <div className="tiptap-page-container" ref={editorRef}>
        <EditorContent editor={editor} className="w-full" />
      </div>

      {/* Page indicator */}
      {pageCount > 1 && (
        <div className="fixed bottom-4 right-4 bg-background/95 backdrop-blur-sm border rounded-lg px-4 py-2 text-sm text-muted-foreground shadow-lg z-[45]">
          Page {currentPage} of {pageCount}
        </div>
      )}
    </div>
  )
}
