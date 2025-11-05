"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, Menu, Code, FolderOpen, Globe, Palette, BarChart3, Sun, Moon, X, FileText, MessageSquare, ImageIcon, Search, Boxes } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import Link from "next/link"

export interface DropdownItem {
  label: string
  disabled?: boolean
}

export interface TabItem {
  id: string
  label: string
  icon: React.ReactNode
  dropdownItems: (string | DropdownItem)[] // Support both string and object format
}

export interface NavigationBarProps {
  tabs?: TabItem[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  onDropdownItemClick?: (tabId: string, item: string) => void
  onLogoClick?: () => void
  logoMenuItems?: string[] // Custom menu items for HT logo dropdown
  onLogoMenuItemClick?: (item: string) => void // Handler for logo menu clicks
  showOnDesktop?: boolean
  showOnMobile?: boolean
  hideLogoOnMobile?: boolean
  hideLogoOnDesktop?: boolean
  dimmed?: boolean // Add overlay effect when chat drawer is open on mobile
  containerWidth?: number // Optional container width to determine compact mode based on panel size instead of window size
  mobileBreakpoint?: number // Custom mobile breakpoint (default: 450 for container, 768 for window)
  compactBreakpoint?: number // Custom compact breakpoint (default: 600 for container, 1024 for window)
}

const defaultTabs: TabItem[] = [
  {
    id: "code-editor",
    label: "Code Editor",
    icon: <Code className="h-4 w-4" />,
    dropdownItems: ["New File", "Open File", "Save", "Settings"],
  },
  {
    id: "project-library",
    label: "Project Library",
    icon: <FolderOpen className="h-4 w-4" />,
    dropdownItems: ["My Projects", "Templates", "Shared", "Archive"],
  },
  {
    id: "wordpress-playground",
    label: "WordPress Playground",
    icon: <Globe className="h-4 w-4" />,
    dropdownItems: ["Start Playground", "Import Site", "Export", "Reset"],
  },
  {
    id: "style-guide",
    label: "Style Guide",
    icon: <Palette className="h-4 w-4" />,
    dropdownItems: ["Colors", "Typography", "Components", "Spacing"],
  },
  {
    id: "usage",
    label: "Usage",
    icon: <BarChart3 className="h-4 w-4" />,
    dropdownItems: ["Analytics", "Billing", "Limits", "Reports"],
  },
]

// Navigation tools data
const navigationTools = {
  chat: [
    {
      title: "AI Doc Editor",
      href: "/chat-doc",
      description: "AI-powered document editor with analysis",
      icon: FileText,
    },
    {
      title: "Blog Builder",
      href: "/blog-builder",
      description: "Multi-step blog content generation workflow",
      icon: MessageSquare,
    },
  ],
  design: [
    {
      title: "Elementor Editor",
      href: "/elementor-editor",
      description: "Visual WordPress section builder",
      icon: Code,
    },
    {
      title: "HubSpot Converter",
      href: "/hubspot-converter",
      description: "Convert HTML to HubSpot HubL modules",
      icon: Boxes,
    },
  ],
  research: [
    {
      title: "Site Crawler",
      href: "/firecrawl",
      description: "Map and scrape websites with Firecrawl",
      icon: Search,
    },
  ],
  tools: [
    {
      title: "Image Generator",
      href: "/image-generator",
      description: "AI image generation with DALL-E",
      icon: ImageIcon,
    },
  ],
};

export function NavigationBar({
  tabs = defaultTabs,
  activeTab: controlledActiveTab,
  onTabChange,
  onDropdownItemClick,
  onLogoClick,
  logoMenuItems,
  onLogoMenuItemClick,
  showOnDesktop = true,
  showOnMobile = true,
  hideLogoOnMobile = false,
  hideLogoOnDesktop = false,
  dimmed = false,
  containerWidth,
  mobileBreakpoint,
  compactBreakpoint,
}: NavigationBarProps = {}) {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs.length > 0 ? tabs[0].id : '')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [siteMenuOpen, setSiteMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [isMobile, setIsMobile] = useState(false)
  const [isCompactMode, setIsCompactMode] = useState(false) // For narrow desktop widths
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use controlled or internal state
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab

  // Mobile detection AND compact mode detection
  // When using containerWidth (panel-based): smaller breakpoints
  // When using window width (full screen): standard breakpoints
  useEffect(() => {
    const checkSize = () => {
      // Use containerWidth if provided AND non-zero, otherwise fall back to window.innerWidth
      const width = (containerWidth !== undefined && containerWidth > 0) ? containerWidth : window.innerWidth

      // Different breakpoints for panel vs window
      // Panel mode: 450px/600px (for resizable panels that are 25-75% of screen)
      // Window mode: 768px/1024px (standard mobile/tablet breakpoints)
      const isUsingContainerWidth = (containerWidth !== undefined && containerWidth > 0)
      const defaultMobileBreakpoint = isUsingContainerWidth ? 450 : 768
      const defaultCompactBreakpoint = isUsingContainerWidth ? 600 : 1024

      // Use custom breakpoints if provided, otherwise use defaults
      const mobileBp = mobileBreakpoint !== undefined ? mobileBreakpoint : defaultMobileBreakpoint
      const compactBp = compactBreakpoint !== undefined ? compactBreakpoint : defaultCompactBreakpoint

      setIsMobile(width < mobileBp)
      setIsCompactMode(width >= mobileBp && width < compactBp)
    }
    checkSize()

    // Always add window resize listener to ensure responsiveness
    window.addEventListener("resize", checkSize)
    return () => window.removeEventListener("resize", checkSize)
  }, [containerWidth, mobileBreakpoint, compactBreakpoint])

  // Keyboard shortcuts (only when tabs exist)
  useEffect(() => {
    if (tabs.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const num = Number.parseInt(e.key)
        if (num >= 1 && num <= tabs.length) {
          e.preventDefault()
          const newTabId = tabs[num - 1].id
          if (onTabChange) {
            onTabChange(newTabId)
          } else {
            setInternalActiveTab(newTabId)
          }
          setOpenDropdown(null)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [tabs, onTabChange])

  // Handle tab click - always switch to tab, don't manage dropdown state
  const handleTabClick = (tabId: string) => {
    // Always switch to the clicked tab
    if (onTabChange) {
      onTabChange(tabId)
    } else {
      setInternalActiveTab(tabId)
    }
    // Don't close dropdown - let DropdownMenu component manage its own state
  }

  // Helper to get item label and disabled state
  const getItemInfo = (item: string | DropdownItem): { label: string; disabled: boolean } => {
    if (typeof item === 'string') {
      return { label: item, disabled: false }
    }
    return { label: item.label, disabled: item.disabled ?? false }
  }

  // Handle dropdown item click
  const handleDropdownClick = (tabId: string, item: string | DropdownItem) => {
    const { label, disabled } = getItemInfo(item)

    // Don't execute if disabled
    if (disabled) return

    if (onDropdownItemClick) {
      onDropdownItemClick(tabId, label)
    }
  }

  // Handle logo menu item click
  const handleLogoMenuClick = (item: string) => {
    // Handle theme toggle built-in
    if (item === 'Toggle Theme' || item === 'Light Mode' || item === 'Dark Mode') {
      setTheme(theme === 'dark' ? 'light' : 'dark')
      return
    }

    // Call custom handler if provided
    if (onLogoMenuItemClick) {
      onLogoMenuItemClick(item)
    }
  }

  // Handle HT logo click - toggle site navigation menu
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick()
    } else {
      setSiteMenuOpen(prev => !prev)
    }
  }

  const activeTabData = tabs.find((tab) => tab.id === activeTab)

  // Render function for site navigation menu (used by both mobile and desktop)
  // Uses EXACT same structure as Navbar component's slide-in menu
  const renderSiteMenu = () => (
    <>
      {/* Backdrop - matches Navbar z-index and styling */}
      {siteMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[5000] animate-in fade-in duration-200"
          onClick={() => setSiteMenuOpen(false)}
        />
      )}

      {/* Slide-in Menu - EXACT copy from Navbar component */}
      {siteMenuOpen && (
        <>
          <div
            className="fixed top-0 left-0 h-full w-full max-w-md bg-card/95 backdrop-blur-md border-r border-border shadow-2xl z-[5100] overflow-y-auto animate-in slide-in-from-left duration-300"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">HT</span>
                </div>
                <span className="text-lg font-bold">Hustle Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="relative p-2 hover:bg-accent rounded-md transition-colors"
                  title="Toggle theme"
                >
                  <div className="relative w-5 h-5">
                    <Sun className="absolute inset-0 h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute inset-0 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </div>
                </button>
                <button
                  onClick={() => setSiteMenuOpen(false)}
                  className="p-2 hover:bg-accent rounded-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4">
              {/* AI Chat & Content */}
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  AI Chat & Content
                </div>
                {navigationTools.chat.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setSiteMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <tool.icon className="h-5 w-5 text-black dark:text-black" />
                    <div>
                      <div className="font-medium">{tool.title}</div>
                      <div className="text-sm text-muted-foreground">{tool.description}</div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Design & Development */}
              <div className="mt-6">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Design & Development
                </div>
                {navigationTools.design.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setSiteMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <tool.icon className="h-5 w-5 text-black dark:text-black" />
                    <div>
                      <div className="font-medium">{tool.title}</div>
                      <div className="text-sm text-muted-foreground">{tool.description}</div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Research & Data */}
              <div className="mt-6">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Research & Data
                </div>
                {navigationTools.research.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setSiteMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <tool.icon className="h-5 w-5 text-black dark:text-black" />
                    <div>
                      <div className="font-medium">{tool.title}</div>
                      <div className="text-sm text-muted-foreground">{tool.description}</div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Utilities */}
              <div className="mt-6">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Utilities
                </div>
                {navigationTools.tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setSiteMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <tool.icon className="h-5 w-5 text-black dark:text-black" />
                    <div>
                      <div className="font-medium">{tool.title}</div>
                      <div className="text-sm text-muted-foreground">{tool.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )

  // Only respect showOnMobile/showOnDesktop when using window width (not container width)
  // When using container width, always show the component (it's panel-based responsive, not device-based)
  const isUsingContainerWidth = (containerWidth !== undefined && containerWidth > 0)

  if (!isUsingContainerWidth) {
    // Hide on mobile if showOnMobile is false
    if (isMobile && !showOnMobile) {
      return null
    }

    // Hide on desktop if showOnDesktop is false
    if (!isMobile && !showOnDesktop) {
      return null
    }
  }

  // Mobile layout
  if (isMobile) {
    // No tabs - show only HT logo (if not hidden)
    if (tabs.length === 0) {
      if (hideLogoOnMobile) {
        return null
      }
      return (
        <>
          <div
            className={cn(
              "flex items-center border-b border-border px-4 py-3 transition-opacity duration-200",
              "bg-[#EBEBEB] dark:bg-[#2C2C2C]",
              dimmed && "opacity-30"
            )}
          >
            <button
              onClick={handleLogoClick}
              className="text-xl font-bold hover:opacity-70 transition-opacity"
            >
              HT
            </button>
          </div>

          {/* Site Navigation Slide-in Menu */}
          {renderSiteMenu()}
        </>
      )
    }

    // With tabs - show HT logo (left), tab dropdown (center), options hamburger (right)
    return (
      <>
        <div
          className={cn(
            "flex items-center justify-between border-b border-border px-3 py-2 transition-opacity duration-200",
            "bg-[#EBEBEB] dark:bg-[#2C2C2C]",
            dimmed && "opacity-30"
          )}
        >
          {/* HT Logo on the left - opens site navigation */}
          {!hideLogoOnMobile && (
            <button
              onClick={handleLogoClick}
              className="text-xl font-bold hover:opacity-70 transition-opacity"
            >
              HT
            </button>
          )}

          {/* Tab selector dropdown in center */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                {activeTabData?.icon}
                <span className="text-sm font-medium">{activeTabData?.label}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 z-[6000]">
              {tabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.id}
                  onClick={() => {
                    if (onTabChange) {
                      onTabChange(tab.id)
                    } else {
                      setInternalActiveTab(tab.id)
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2",
                    activeTab === tab.id && "bg-accent"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hamburger menu on the right - shows options for active tab OR all tabs categorized */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[6000] max-h-[80vh] overflow-y-auto">
              {/* Show ALL tabs' items in categorized list (mobile dropdown UI) */}
              {tabs.map((tab, tabIndex) => (
                <div key={tab.id}>
                  {tabIndex > 0 && <div className="h-px bg-border my-1" />}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {tab.label}
                  </div>
                  {tab.dropdownItems.map((item, itemIndex) => {
                    if (typeof item === 'string' && item === 'separator') {
                      return <DropdownMenuSeparator key={`${tab.id}-separator-${itemIndex}`} />
                    }
                    const { label, disabled } = getItemInfo(item)
                    return (
                      <DropdownMenuItem
                        key={`${tab.id}-${label}`}
                        onClick={() => handleDropdownClick(tab.id, item)}
                        disabled={disabled}
                        className={cn(
                          "pl-4",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {label}
                      </DropdownMenuItem>
                    )
                  })}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Site Navigation Slide-in Menu */}
        {renderSiteMenu()}
      </>
    )
  }

  // Desktop layout (but use compact mode for widths < 1024px)
  // If in compact mode, use the mobile-style layout (dropdown + hamburger)
  if (isCompactMode) {
    // Use same layout as mobile for narrow desktop widths
    if (tabs.length === 0) {
      if (hideLogoOnDesktop) {
        return null
      }
      return (
        <>
          <div className="flex items-center border-b border-border bg-[#EBEBEB] dark:bg-[#2C2C2C] px-4 py-2 rounded-t-lg">
            <button
              onClick={handleLogoClick}
              className="text-xl font-bold hover:opacity-70 transition-opacity"
            >
              HT
            </button>
          </div>
          {renderSiteMenu()}
        </>
      )
    }

    // With tabs - show compact layout (HT logo, tab dropdown, hamburger menu)
    return (
      <>
        <div className="flex items-center justify-between border-b border-border bg-[#EBEBEB] dark:bg-[#2C2C2C] px-3 py-2 rounded-t-lg">
          {/* HT Logo on the left */}
          {!hideLogoOnDesktop && (
            <button
              onClick={handleLogoClick}
              className="text-lg font-bold hover:opacity-70 transition-opacity"
            >
              HT
            </button>
          )}

          {/* Tab selector dropdown in center */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <span className="text-sm font-medium">{activeTabData?.label}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {tabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.id}
                  onClick={() => {
                    if (onTabChange) {
                      onTabChange(tab.id)
                    } else {
                      setInternalActiveTab(tab.id)
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2",
                    activeTab === tab.id && "bg-accent"
                  )}
                >
                  <span>{tab.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hamburger menu on the right */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-[80vh] overflow-y-auto">
              {/* Show ALL tabs' items in categorized list */}
              {tabs.map((tab, tabIndex) => (
                <div key={tab.id}>
                  {tabIndex > 0 && <div className="h-px bg-border my-1" />}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {tab.label}
                  </div>
                  {tab.dropdownItems.map((item, itemIndex) => {
                    if (typeof item === 'string' && item === 'separator') {
                      return <DropdownMenuSeparator key={`${tab.id}-separator-${itemIndex}`} />
                    }
                    const { label, disabled } = getItemInfo(item)
                    return (
                      <DropdownMenuItem
                        key={`${tab.id}-${label}`}
                        onClick={() => handleDropdownClick(tab.id, item)}
                        disabled={disabled}
                        className={cn(
                          "pl-4",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {label}
                      </DropdownMenuItem>
                    )
                  })}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Site Navigation Slide-in Menu */}
        {renderSiteMenu()}
      </>
    )
  }

  // Full desktop layout (width >= 1024px)
  // No tabs - show only HT logo (if not hidden)
  if (tabs.length === 0) {
    if (hideLogoOnDesktop) {
      return null
    }
    return (
      <>
        <div className="flex items-center border-b border-border bg-[#EBEBEB] dark:bg-[#2C2C2C] px-4 py-2 rounded-t-lg">
          <button
            onClick={handleLogoClick}
            className="text-xl font-bold hover:opacity-70 transition-opacity"
          >
            HT
          </button>
        </div>

        {/* Site Navigation Slide-in Menu */}
        {renderSiteMenu()}
      </>
    )
  }

  // With tabs - show full desktop navigation with hover-to-open dropdowns (NO horizontal scroll)
  return (
    <>
      <div className="flex items-center border-b border-border bg-[#EBEBEB] dark:bg-[#2C2C2C] rounded-t-lg overflow-hidden">
        {/* Fixed HT logo - doesn't scroll, positioned absolutely or with flex-shrink-0 */}
        {!hideLogoOnDesktop && (
          <div className="flex-shrink-0 border-r border-border">
            {logoMenuItems && logoMenuItems.length > 0 ? (
              // HT logo with dropdown menu
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-lg font-bold hover:opacity-70 transition-opacity px-3 py-1.5"
                  >
                    HT
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {logoMenuItems.map((item, index) => {
                    // Check if item is a theme toggle
                    const isThemeToggle = item === 'Toggle Theme' || item === 'Light Mode' || item === 'Dark Mode'

                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => handleLogoMenuClick(item)}
                        className="flex items-center gap-2"
                      >
                        {isThemeToggle && (
                          <div className="relative w-4 h-4">
                            <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                          </div>
                        )}
                        <span>{item}</span>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // HT logo without dropdown (original behavior)
              <button
                onClick={handleLogoClick}
                className="text-lg font-bold hover:opacity-70 transition-opacity px-3 py-1.5"
              >
                HT
              </button>
            )}
          </div>
        )}
        {/* Tabs area - regular flex layout (no scrolling needed, compact mode handles narrow widths) */}
        <div className="flex items-center gap-0.5 py-1.5 px-1 flex-1">
            {tabs.map((tab, index) => {
            // Check if tab has dropdown items
            const hasDropdown = tab.dropdownItems && tab.dropdownItems.length > 0

            // Check if this is the Options tab (last tab with dropdown)
            const isOptionsTab = tab.label === 'Options' || index === tabs.length - 1

            return hasDropdown ? (
              // Tab with dropdown
              <div
                key={tab.id}
                onMouseEnter={() => {
                  // Clear any pending close timeout
                  if (dropdownTimeoutRef.current) {
                    clearTimeout(dropdownTimeoutRef.current)
                    dropdownTimeoutRef.current = null
                  }
                  setOpenDropdown(tab.id)
                }}
                onMouseLeave={() => {
                  // Delay closing to prevent jitter when moving to dropdown content
                  dropdownTimeoutRef.current = setTimeout(() => {
                    setOpenDropdown(null)
                  }, 150)
                }}
                style={{ touchAction: 'pan-x' }} // Allow horizontal scrolling on touch devices
              >
                <DropdownMenu
                  open={openDropdown === tab.id}
                  onOpenChange={(open) => {
                    if (!open) setOpenDropdown(null)
                    else setOpenDropdown(tab.id)
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={activeTab === tab.id ? "secondary" : "ghost"}
                      className={cn(
                        "flex items-center gap-0.5 px-2 py-1 text-xs flex-shrink-0 rounded-md",
                        activeTab === tab.id && "bg-secondary/50 border border-border shadow-sm"
                      )}
                      onClick={(e) => {
                        // For Options tab, ONLY open dropdown - don't change tab
                        if (isOptionsTab) {
                          e.preventDefault()
                          setOpenDropdown(tab.id)
                        } else {
                          // For other tabs, switch to tab
                          handleTabClick(tab.id)
                        }
                      }}
                    >
                      <span className="font-medium whitespace-nowrap">{tab.label}</span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-48"
                    onMouseEnter={() => {
                      // Clear any pending close timeout when entering dropdown
                      if (dropdownTimeoutRef.current) {
                        clearTimeout(dropdownTimeoutRef.current)
                        dropdownTimeoutRef.current = null
                      }
                      setOpenDropdown(tab.id)
                    }}
                    onMouseLeave={() => {
                      // Delay closing
                      dropdownTimeoutRef.current = setTimeout(() => {
                        setOpenDropdown(null)
                      }, 150)
                    }}
                  >
                    {tab.dropdownItems.map((item, itemIndex) => {
                      if (typeof item === 'string' && item === 'separator') {
                        return <DropdownMenuSeparator key={`separator-${itemIndex}`} />
                      }
                      const { label, disabled } = getItemInfo(item)
                      return (
                        <DropdownMenuItem
                          key={label}
                          onClick={() => handleDropdownClick(tab.id, item)}
                          disabled={disabled}
                          className={cn(
                            disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {label}
                        </DropdownMenuItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            ) : (
              // Tab without dropdown - just a button
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "secondary" : "ghost"}
                className={cn(
                  "flex items-center gap-0.5 px-2 py-1 text-xs flex-shrink-0 rounded-md",
                  activeTab === tab.id && "bg-secondary/50 border border-border shadow-sm"
                )}
                onClick={() => handleTabClick(tab.id)}
              >
                <span className="font-medium whitespace-nowrap">{tab.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Site Navigation Slide-in Menu */}
      {renderSiteMenu()}
    </>
  )
}
