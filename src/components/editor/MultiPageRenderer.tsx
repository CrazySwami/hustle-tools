'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { UnifiedPanel, PanelType } from './UnifiedPanel'

export interface PageSetupConfig {
  pageSize: 'letter' | 'a4' | 'legal' | 'custom'
  width: number
  height: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  orientation: 'portrait' | 'landscape'
}

interface MultiPageRendererProps {
  editor: Editor | null
  pageConfig?: PageSetupConfig
  mobileZoom?: number
  leftPanel?: PanelType
  rightPanel?: PanelType
  leftPanelContent?: React.ReactNode
  rightPanelContent?: React.ReactNode
  onLeftPanelClose?: () => void
  onRightPanelClose?: () => void
}

// Default page dimensions if no config provided
const DEFAULT_PAGE_CONFIG: PageSetupConfig = {
  pageSize: 'letter',
  width: 816,
  height: 1056,
  marginTop: 96,
  marginRight: 96,
  marginBottom: 96,
  marginLeft: 96,
  orientation: 'portrait',
}

const PAGE_GAP = 24 // Gap between pages (FIXED)

export function MultiPageRenderer({
  editor,
  pageConfig = DEFAULT_PAGE_CONFIG,
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

  // Extract dimensions from config
  const PAGE_WIDTH = pageConfig.width
  const PAGE_HEIGHT = pageConfig.height
  const PAGE_PADDING_TOP = pageConfig.marginTop
  const PAGE_PADDING_RIGHT = pageConfig.marginRight
  const PAGE_PADDING_BOTTOM = pageConfig.marginBottom
  const PAGE_PADDING_LEFT = pageConfig.marginLeft
  const CONTENT_HEIGHT = PAGE_HEIGHT - (PAGE_PADDING_TOP + PAGE_PADDING_BOTTOM)

  // Calculate number of pages needed based on content height
  const calculatePages = useCallback(() => {
    if (!editor || !editorWrapperRef.current) return

    const wrapper = editorWrapperRef.current
    const proseMirror = wrapper.querySelector('.ProseMirror')
    if (!proseMirror) return

    // Get total content height
    const totalHeight = (proseMirror as HTMLElement).scrollHeight

    // Calculate pages needed (based on content area, not full page height)
    const pagesNeeded = Math.max(1, Math.ceil(totalHeight / CONTENT_HEIGHT))

    setPageCount(pagesNeeded)
  }, [editor, CONTENT_HEIGHT])

  // Set up observers for content changes
  useEffect(() => {
    if (!editor || !editorWrapperRef.current) return

    // Initial calculation
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

    // Observe size changes
    const resizeObserver = new ResizeObserver(debouncedCalculate)
    const proseMirror = editorWrapperRef.current.querySelector('.ProseMirror')
    if (proseMirror) {
      resizeObserver.observe(proseMirror as Element)
    }

    return () => {
      clearTimeout(initialTimer)
      clearTimeout(debounceTimer)
      editor.off('update', debouncedCalculate)
      editor.off('transaction', debouncedCalculate)
      resizeObserver.disconnect()
    }
  }, [editor, calculatePages])

  // Track scroll position for current page indicator
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

        {/* Multi-Page Document Container */}
        <div
          className="transform-gpu flex-shrink-0 relative"
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

          {/* Pages container - stacks page boxes with continuous editor overlay */}
          <div className="relative">
            {/* Page boxes - background pages with gaps */}
            <div className="flex flex-col" style={{ gap: `${PAGE_GAP}px` }}>
              {Array.from({ length: pageCount }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "page-box mx-auto",
                    "bg-white dark:bg-[#2a2a2a]",
                    "shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.05)]",
                    "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.2)]",
                    "rounded-sm"
                  )}
                  style={{
                    width: `${PAGE_WIDTH}px`,
                    height: `${PAGE_HEIGHT}px`,
                  }}
                />
              ))}
            </div>

            {/* Continuous editor overlay - flows through all pages */}
            <div
              ref={editorWrapperRef}
              className="absolute top-0 left-0"
              style={{
                width: `${PAGE_WIDTH}px`,
                padding: `${PAGE_PADDING_TOP}px ${PAGE_PADDING_RIGHT}px ${PAGE_PADDING_BOTTOM}px ${PAGE_PADDING_LEFT}px`,
                // Min height to allow content to flow through all pages
                minHeight: `${pageCount * PAGE_HEIGHT + (pageCount - 1) * PAGE_GAP}px`,
              }}
            >
              <EditorContent editor={editor} />
            </div>
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

      {/* Mobile document view - simplified single page */}
      <div className="md:hidden">
        <div
          className={cn(
            "tiptap-page",
            "w-full",
            "bg-white dark:bg-[#2a2a2a]",
          )}
          style={{
            padding: '16px',
            minHeight: '100vh',
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
