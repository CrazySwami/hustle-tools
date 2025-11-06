'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { UnifiedPanel, PanelType } from './UnifiedPanel'

interface MultiPageRendererProps {
  editor: Editor | null
  mobileZoom?: number
  leftPanel?: PanelType
  rightPanel?: PanelType
  leftPanelContent?: React.ReactNode
  rightPanelContent?: React.ReactNode
  onLeftPanelClose?: () => void
  onRightPanelClose?: () => void
}

const PAGE_WIDTH = 816 // 8.5 inches at 96 DPI
const PAGE_HEIGHT = 1056 // 11 inches at 96 DPI
const CONTENT_HEIGHT = 864 // 9 inches (11 - 2 inch margins)
const PAGE_PADDING = 96 // 1 inch margins
const PAGE_GAP = 24 // Gap between pages

export function MultiPageRenderer({
  editor,
  mobileZoom = 60,
  leftPanel,
  rightPanel,
  leftPanelContent,
  rightPanelContent,
  onLeftPanelClose = () => {},
  onRightPanelClose = () => {}
}: MultiPageRendererProps) {
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const editorWrapperRef = useRef<HTMLDivElement>(null)

  // Calculate pages based on content height
  const calculatePages = useCallback(() => {
    if (!editor || !editorWrapperRef.current) return

    const wrapper = editorWrapperRef.current
    const proseMirror = wrapper.querySelector('.ProseMirror')
    if (!proseMirror) return

    // Get total content height
    const totalHeight = (proseMirror as HTMLElement).scrollHeight

    // Calculate number of pages needed
    const pagesNeeded = Math.max(1, Math.ceil(totalHeight / CONTENT_HEIGHT))

    setPageCount(pagesNeeded)
  }, [editor])

  // Set up observers
  useEffect(() => {
    if (!editor || !editorWrapperRef.current) return

    // Initial calculation with delay to ensure rendering
    const initialTimer = setTimeout(() => calculatePages(), 200)

    // Debounced calculation on updates
    let debounceTimer: NodeJS.Timeout
    const debouncedCalculate = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(calculatePages, 100)
    }

    // Listen for editor updates
    editor.on('update', debouncedCalculate)
    editor.on('transaction', debouncedCalculate)

    // Observe content changes
    const resizeObserver = new ResizeObserver(debouncedCalculate)
    resizeObserver.observe(editorWrapperRef.current)

    return () => {
      clearTimeout(initialTimer)
      clearTimeout(debounceTimer)
      editor.off('update', debouncedCalculate)
      editor.off('transaction', debouncedCalculate)
      resizeObserver.disconnect()
    }
  }, [editor, calculatePages])

  // Track scroll position
  useEffect(() => {
    const container = containerRef.current
    if (!container || pageCount <= 1) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const viewportHeight = container.clientHeight
      const scrollMid = scrollTop + viewportHeight / 2

      // Calculate which page is in view
      const pageHeight = PAGE_HEIGHT + PAGE_GAP
      const pageIndex = Math.floor(scrollMid / pageHeight)
      setCurrentPage(Math.min(Math.max(pageIndex + 1, 1), pageCount))
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => container.removeEventListener('scroll', handleScroll)
  }, [pageCount])

  if (!editor) {
    return null
  }

  // Calculate total height needed for all pages
  const totalHeight = pageCount * PAGE_HEIGHT + (pageCount - 1) * PAGE_GAP

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide bg-[#f0f0f0] dark:bg-[#1a1a1a]"
      style={{ padding: '40px 20px' }}
    >
      {/* Mobile overlay panels */}
      {leftPanel && (
        <div className="fixed md:hidden top-[60px] left-0 right-0 bottom-0 z-50">
          <UnifiedPanel
            type={leftPanel}
            position="left"
            onClose={onLeftPanelClose}
          >
            {leftPanelContent}
          </UnifiedPanel>
        </div>
      )}
      {rightPanel && (
        <div className="fixed md:hidden top-[60px] left-0 right-0 bottom-0 z-50">
          <UnifiedPanel
            type={rightPanel}
            position="right"
            onClose={onRightPanelClose}
          >
            {rightPanelContent}
          </UnifiedPanel>
        </div>
      )}

      {/* Desktop flex container for panels + document */}
      <div className="hidden md:flex items-start justify-center gap-4 min-h-full">
        {/* Left Panel Desktop */}
        {leftPanel && (
          <UnifiedPanel
            type={leftPanel}
            position="left"
            onClose={onLeftPanelClose}
          >
            {leftPanelContent}
          </UnifiedPanel>
        )}

        {/* Document */}
        <div
          className="transform-gpu flex-shrink-0"
          style={{
            transformOrigin: 'top center',
          }}
        >
          {/* Media query styles for responsive scaling */}
          <style jsx>{`
            /* Mobile: 98% scale, centered */
            div {
              transform: scale(0.98) !important;
            }
            @media (min-width: 640px) {
              div {
                transform: scale(0.7) !important;
              }
            }
            @media (min-width: 768px) {
              div {
                transform: scale(0.9) !important;
              }
            }
            @media (min-width: 1024px) {
              div {
                transform: scale(1) !important;
              }
            }
          `}</style>

          {/* Single continuous page container with visual page breaks */}
          <div
            ref={editorWrapperRef}
            className={cn(
              "tiptap-page mx-auto",
              "w-[816px]",
              "bg-white dark:bg-[#2a2a2a]",
              "shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.05)]",
              "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.2)]"
            )}
            style={{
              padding: `${PAGE_PADDING}px`,
              minHeight: `${totalHeight}px`,
            }}
          >
            <EditorContent editor={editor} className="w-full" />
          </div>
        </div>

        {/* Right Panel Desktop */}
        {rightPanel && (
          <UnifiedPanel
            type={rightPanel}
            position="right"
            onClose={onRightPanelClose}
          >
            {rightPanelContent}
          </UnifiedPanel>
        )}
      </div>

      {/* Mobile document view - full width edge to edge */}
      <div className="md:hidden">
        <div
          ref={editorWrapperRef}
          className={cn(
            "tiptap-page",
            "w-full",
            "bg-white dark:bg-[#2a2a2a]",
          )}
          style={{
            padding: '16px',
            minHeight: `${totalHeight}px`,
          }}
        >
          <EditorContent editor={editor} className="w-full" />
        </div>
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
