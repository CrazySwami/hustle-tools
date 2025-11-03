"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronDown, Menu, Code, FolderOpen, Globe, Palette, BarChart3, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

export interface TabItem {
  id: string
  label: string
  icon: React.ReactNode
  dropdownItems: string[]
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
}: NavigationBarProps = {}) {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs.length > 0 ? tabs[0].id : '')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  // Use controlled or internal state
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

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

  // Handle tab click - always switch to tab, don't toggle dropdown on click
  const handleTabClick = (tabId: string) => {
    // Always switch to the clicked tab
    if (onTabChange) {
      onTabChange(tabId)
    } else {
      setInternalActiveTab(tabId)
    }
    // Close dropdown after switching
    setOpenDropdown(null)
  }

  // Handle dropdown item click
  const handleDropdownClick = (tabId: string, item: string) => {
    if (onDropdownItemClick) {
      onDropdownItemClick(tabId, item)
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

  // Handle HT logo click - use custom handler if provided, otherwise trigger floating nav
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick()
    } else {
      // Try to find and click the floating nav button
      const navButton = document.querySelector('[data-nav-button="true"]') as HTMLButtonElement
      if (navButton) {
        navButton.click()
      } else {
        // If no floating button, try to trigger the nav button via data-nav-trigger
        const navTrigger = document.querySelector('[data-nav-trigger]') as HTMLButtonElement
        if (navTrigger) {
          navTrigger.click()
        } else {
          // Fallback: navigate to home
          window.location.href = '/'
        }
      }
    }
  }

  const activeTabData = tabs.find((tab) => tab.id === activeTab)

  // Hide on mobile if showOnMobile is false
  if (isMobile && !showOnMobile) {
    return null
  }

  // Hide on desktop if showOnDesktop is false
  if (!isMobile && !showOnDesktop) {
    return null
  }

  // Mobile layout
  if (isMobile) {
    // No tabs - show only HT logo (if not hidden)
    if (tabs.length === 0) {
      if (hideLogoOnMobile) {
        return null
      }
      return (
        <div className="flex items-center border-b border-border bg-background px-4 py-3">
          <button
            onClick={handleLogoClick}
            className="text-xl font-bold hover:opacity-70 transition-opacity"
          >
            HT
          </button>
        </div>
      )
    }

    // With tabs - show HT logo (left), tab dropdown (center), options hamburger (right)
    return (
      <div className="flex items-center justify-between border-b border-border bg-background px-3 py-2">
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

        {/* Hamburger menu on the right - shows options for active tab */}
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
          <DropdownMenuContent align="end" className="w-48 z-[6000]">
            {activeTabData?.dropdownItems.map((item) => (
              <DropdownMenuItem
                key={item}
                onClick={() => handleDropdownClick(activeTabData.id, item)}
              >
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Desktop layout
  // No tabs - show only HT logo (if not hidden)
  if (tabs.length === 0) {
    if (hideLogoOnDesktop) {
      return null
    }
    return (
      <div className="flex items-center border-b border-border bg-muted px-4 py-2 rounded-t-lg">
        <button
          onClick={handleLogoClick}
          className="text-xl font-bold hover:opacity-70 transition-opacity"
        >
          HT
        </button>
      </div>
    )
  }

  // With tabs - show full desktop navigation with horizontal scroll (NO ICONS, hover to open)
  return (
    <div className="flex items-center border-b border-border bg-muted rounded-t-lg">
      {/* Fixed HT logo - doesn't scroll */}
      {!hideLogoOnDesktop && (
        <>
          {logoMenuItems && logoMenuItems.length > 0 ? (
            // HT logo with dropdown menu
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-lg font-bold hover:opacity-70 transition-opacity px-3 py-1.5 flex-shrink-0"
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
              className="text-lg font-bold hover:opacity-70 transition-opacity px-3 py-1.5 flex-shrink-0"
            >
              HT
            </button>
          )}
        </>
      )}
      {/* Scrollable tabs area */}
      <div className="flex items-center gap-0.5 overflow-x-auto py-1.5 pr-3 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {tabs.map((tab, index) => {
          // Check if tab has dropdown items
          const hasDropdown = tab.dropdownItems && tab.dropdownItems.length > 0

          return hasDropdown ? (
            // Tab with dropdown
            <DropdownMenu
              key={tab.id}
              open={openDropdown === tab.id}
              onOpenChange={(open) => setOpenDropdown(open ? tab.id : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  className={cn("flex items-center gap-0.5 px-2 py-1 text-xs flex-shrink-0", activeTab === tab.id && "bg-secondary")}
                  onClick={() => handleTabClick(tab.id)}
                  onMouseEnter={() => setOpenDropdown(tab.id)}
                >
                  <span className="font-medium whitespace-nowrap">{tab.label}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {tab.dropdownItems.map((item) => (
                  <DropdownMenuItem
                    key={item}
                    onClick={() => handleDropdownClick(tab.id, item)}
                  >
                    {item}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Tab without dropdown - just a button
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "secondary" : "ghost"}
              className={cn("flex items-center gap-0.5 px-2 py-1 text-xs flex-shrink-0", activeTab === tab.id && "bg-secondary")}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="font-medium whitespace-nowrap">{tab.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
