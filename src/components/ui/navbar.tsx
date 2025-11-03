'use client';

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Flame, FileSearch, Ticket, ImageIcon, FileText, Boxes, FileEdit, Search, X, Sun, Moon, Activity, MessageSquare, Mic, Zap, Sparkles, Code2, Menu, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface NavbarProps {
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
  hideMobileOnPaths?: string[];
  hideButtonOnMobileForPaths?: string[];
  mode?: 'floating' | 'traditional'; // New prop to switch between modes
  traditionalOnPaths?: string[]; // Paths where traditional mode should be used
}

export function Navbar({
  showOnDesktop = true,
  showOnMobile = true,
  hideMobileOnPaths = [],
  hideButtonOnMobileForPaths = [],
  mode = 'floating',
  traditionalOnPaths = []
}: NavbarProps = {}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Determine which mode to use based on current path
  // If traditionalOnPaths is specified, use traditional mode UNLESS current path is in the array
  // Otherwise, use the mode prop (default: floating)
  const useTraditionalMode = traditionalOnPaths.length > 0
    ? !traditionalOnPaths.includes(pathname)  // Traditional for all EXCEPT listed paths
    : mode === 'traditional';                  // Otherwise use mode prop
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [corner, setCorner] = useState<Corner>('top-left');
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Mobile detection and auto-position based on screen size
  useEffect(() => {
    const checkMobile = () => {
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth < 768;
      setIsMobile(nowMobile);

      // When switching between mobile/desktop, reset to default position
      // unless user has manually dragged it (saved in localStorage)
      const userHasDragged = localStorage.getItem('nav-user-dragged') === 'true';

      if (!userHasDragged && wasMobile !== nowMobile) {
        if (nowMobile) {
          // Switching to mobile: move to bottom-LEFT (updated)
          setCorner('bottom-left');
          localStorage.setItem('nav-corner', 'bottom-left');
        } else {
          // Switching to desktop: move to top-left
          setCorner('top-left');
          localStorage.setItem('nav-corner', 'top-left');
        }
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  // Initialize position from localStorage on mount
  useEffect(() => {
    const userHasDragged = localStorage.getItem('nav-user-dragged') === 'true';
    const actuallyMobile = window.innerWidth < 768;

    if (userHasDragged) {
      // User has manually positioned the button - respect their choice
      const savedCorner = localStorage.getItem('nav-corner') as Corner | null;
      if (savedCorner) {
        console.log('📍 Navbar: User dragged, using saved position:', savedCorner);
        setCorner(savedCorner);
      }
    } else {
      // User hasn't dragged - always set based on current screen size
      // UPDATED: Mobile now uses bottom-LEFT, desktop stays top-left
      const defaultCorner = actuallyMobile ? 'bottom-left' : 'top-left';
      console.log('📍 Navbar: Auto-positioning based on screen width:', {
        width: window.innerWidth,
        isMobile: actuallyMobile,
        position: defaultCorner
      });
      setCorner(defaultCorner);
      localStorage.setItem('nav-corner', defaultCorner);
    }
  }, []); // Empty dependency array - only run once on mount

  // Calculate position based on corner
  useEffect(() => {
    const updatePosition = () => {
      const margin = 16; // 16px margin from edges for desktop
      const mobileMargin = 10; // 10px margin for mobile (aligned with BottomNav)
      const buttonWidth = isMobile ? 56 : 180; // Mobile: 56px circle, Desktop: 180px pill
      const buttonHeight = 56; // Both use 56px height
      // Use 10px margin on mobile for bottom positioning (matches BottomNav)
      const bottomMargin = isMobile ? mobileMargin : margin;
      const sideMargin = isMobile ? mobileMargin : margin;

      switch (corner) {
        case 'top-left':
          setPosition({ x: margin, y: margin });
          break;
        case 'top-right':
          setPosition({ x: window.innerWidth - buttonWidth - margin, y: margin });
          break;
        case 'bottom-left':
          setPosition({ x: sideMargin, y: window.innerHeight - buttonHeight - bottomMargin });
          break;
        case 'bottom-right':
          setPosition({ x: window.innerWidth - buttonWidth - sideMargin, y: window.innerHeight - buttonHeight - bottomMargin });
          break;
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [corner, isMobile]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Listen for custom event to toggle menu from external sources (e.g., mobile HT logo)
  useEffect(() => {
    const handleToggleNav = () => {
      setMenuOpen(prev => !prev);
    };

    window.addEventListener('toggle-nav-menu', handleToggleNav);
    return () => window.removeEventListener('toggle-nav-menu', handleToggleNav);
  }, []);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Store start position to detect if this was a click vs drag
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };

    // We'll start dragging mode immediately but check distance moved in handleMouseUp
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    // Follow cursor smoothly during drag
    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging) return;

    // Check if mouse moved significantly (drag) or stayed put (click)
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      // Was a click, not a drag - toggle menu
      setIsDragging(false);
      setMenuOpen(!menuOpen);
      return;
    }

    // Was a drag - calculate which corner to snap to
    const windowCenterX = window.innerWidth / 2;
    const windowCenterY = window.innerHeight / 2;

    let targetCorner: Corner;
    if (e.clientX < windowCenterX && e.clientY < windowCenterY) {
      targetCorner = 'top-left';
    } else if (e.clientX >= windowCenterX && e.clientY < windowCenterY) {
      targetCorner = 'top-right';
    } else if (e.clientX < windowCenterX && e.clientY >= windowCenterY) {
      targetCorner = 'bottom-left';
    } else {
      targetCorner = 'bottom-right';
    }

    setCorner(targetCorner);
    setIsDragging(false);

    // Save to localStorage
    localStorage.setItem('nav-corner', targetCorner);
    localStorage.setItem('nav-user-dragged', 'true');
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, position]);

  const tools = {
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
        icon: Sparkles,
      },
    ],
    design: [
      {
        title: "Elementor Builder",
        href: "/elementor-editor",
        description: "WordPress section builder with live preview",
        icon: Boxes,
      },
      {
        title: "HubSpot Converter",
        href: "/hubspot-converter",
        description: "Convert HTML to HubSpot modules",
        icon: Code2,
      },
      {
        title: "Image Editor",
        href: "/image-editor",
        description: "AI-powered image generation and editing",
        icon: ImageIcon,
      },
    ],
    research: [
      {
        title: "Firecrawl",
        href: "/firecrawl",
        description: "Map and scrape entire websites with AI",
        icon: Flame,
      },
      {
        title: "Page Extractor",
        href: "/page-extractor",
        description: "Extract HTML, CSS, JS from any page",
        icon: FileSearch,
      },
    ],
    tools: [
      {
        title: "API Monitor",
        href: "/api-monitor",
        description: "Track API usage and performance metrics",
        icon: Activity,
      },
      {
        title: "TKX Events",
        href: "/tkx-calendar",
        description: "Browse upcoming concerts and events",
        icon: Ticket,
      },
      {
        title: "Roadmap",
        href: "/roadmap",
        description: "Product roadmap and upcoming features",
        icon: Zap,
      },
    ],
  };

  // Check if we should hide the button on mobile (but keep menu listener)
  const shouldHideButtonOnMobile = isMobile && hideButtonOnMobileForPaths.includes(pathname);

  // Hide floating button on desktop for Elementor and Doc Editor pages (they have NavigationBar instead)
  const shouldHideButtonOnDesktop = !isMobile && traditionalOnPaths.includes(pathname);

  // Hide completely on mobile if showOnMobile is false OR if current path is in hideMobileOnPaths
  if (isMobile && (!showOnMobile || hideMobileOnPaths.includes(pathname))) {
    return null;
  }

  // Hide on desktop if showOnDesktop is false OR if should hide button on desktop
  if (!isMobile && (!showOnDesktop || shouldHideButtonOnDesktop)) {
    return null;
  }

  // TRADITIONAL MODE - Horizontal navbar with logo and center links
  if (useTraditionalMode) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
                Hustle Tools
              </span>
            </Link>

            {/* Desktop Navigation - Grouped Dropdowns */}
            {!isMobile && (
              <div className="hidden md:flex items-center space-x-1">
                {Object.entries(tools).map(([groupName, items]) => (
                  <DropdownMenu key={groupName}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                          items.some(item => item.href === pathname)
                            ? "bg-gray-900 text-white"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        {groupName.charAt(0).toUpperCase() + groupName.slice(1)}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem key={item.href} asChild>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-start gap-3 cursor-pointer",
                                pathname === item.href && "bg-accent"
                              )}
                            >
                              <Icon className="h-4 w-4 mt-0.5 text-orange-500" />
                              <div className="flex flex-col">
                                <span className="font-medium">{item.title}</span>
                                <span className="text-xs text-muted-foreground">{item.description}</span>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </div>
            )}

            {/* Right side - Theme toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hidden md:flex p-2 rounded-md hover:bg-gray-100 transition-colors relative"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-900" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-900" />
                <span className="sr-only">Toggle theme</span>
              </button>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-md hover:bg-gray-100"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Grouped Navigation */}
        {isMobile && menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-3">
              {Object.entries(tools).map(([groupName, items]) => (
                <div key={groupName} className="space-y-1">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {groupName}
                  </div>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                          pathname === item.href
                            ? "bg-gray-900 text-white"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5",
                          pathname === item.href ? "text-white" : "text-orange-500"
                        )} />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className={cn(
                            "text-xs",
                            pathname === item.href ? "text-gray-200" : "text-gray-500"
                          )}>{item.description}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}

              {/* Theme toggle in mobile menu */}
              <button
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2 relative"
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <Sun className="h-5 w-5 absolute rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="h-5 w-5 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </div>
                <span className="ml-2">Toggle theme</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    );
  }

  // FLOATING MODE - Original floating button
  return (
    <>
      {/* Floating Draggable Button - always render but hide if needed */}
      <div
        ref={buttonRef}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 3250, // Above chat drawer handle (3200) so button is visible
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          userSelect: 'none',
          display: shouldHideButtonOnMobile ? 'none' : 'block', // Hide visually but keep in DOM
        }}
      >
        <button
          data-nav-trigger
          data-nav-button="true"
          onMouseDown={handleMouseDown}
          className={cn(
            "group relative flex items-center justify-center backdrop-blur-md border-2 overflow-hidden",
            // Light mode: black bg, white text | Dark mode: white bg, black text
            "bg-black dark:bg-white",
            "text-white dark:text-black",
            "border-black/20 dark:border-white/20",
            "shadow-lg dark:shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.2)]",
            isMobile ? "w-14 h-14" : "gap-2 px-4 py-3"
          )}
          style={{
            borderRadius: '9999px',
            fontSize: isMobile ? '16px' : '14px',
            fontWeight: 600,
            letterSpacing: '-0.025em',
            cursor: isDragging ? 'grabbing' : 'grab',
            pointerEvents: 'auto',
          }}
        >
          {/* Water-fill hover animation background */}
          <div
            className="absolute inset-0 bg-white dark:bg-black transition-all duration-500 ease-out translate-y-full group-hover:translate-y-0 rounded-full"
          />

          {/* Text with color inversion on hover */}
          <span className="relative z-10 transition-colors duration-500 group-hover:text-black dark:group-hover:text-white">
            {isMobile ? 'HT' : 'Hustle Tools'}
          </span>
        </button>
      </div>

      {/* Desktop: Dropdown Menu */}
      {!isMobile && menuOpen && (
        <div
          ref={menuRef}
          className="fixed z-[3150] bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            left: `${position.x}px`,
            top: corner.includes('bottom') ? 'auto' : `${position.y + 60}px`,
            bottom: corner.includes('bottom') ? `${window.innerHeight - position.y + 4}px` : 'auto',
            minWidth: '280px',
            maxWidth: '320px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          {/* Header with Mode Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="text-sm font-semibold">Navigation</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative p-1.5 hover:bg-accent rounded-md transition-colors"
                title="Toggle theme"
              >
                <div className="relative w-4 h-4">
                  <Sun className="absolute inset-0 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute inset-0 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </div>
              </button>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 hover:bg-accent rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="p-2">
            {/* AI Chat & Content */}
            <div>
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI Chat & Content
              </div>
              {tools.chat.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  <tool.icon className="h-4 w-4" />
                  <div>
                    <div className="text-sm font-medium">{tool.title}</div>
                    <div className="text-xs text-muted-foreground">{tool.description}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Design & Development */}
            <div className="mt-4">
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Design & Development
              </div>
              {tools.design.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  <tool.icon className="h-4 w-4" />
                  <div>
                    <div className="text-sm font-medium">{tool.title}</div>
                    <div className="text-xs text-muted-foreground">{tool.description}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Research & Data */}
            <div className="mt-4">
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Research & Data
              </div>
              {tools.research.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  <tool.icon className="h-4 w-4" />
                  <div>
                    <div className="text-sm font-medium">{tool.title}</div>
                    <div className="text-xs text-muted-foreground">{tool.description}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Utilities */}
            <div className="mt-4">
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Utilities
              </div>
              {tools.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  <tool.icon className="h-4 w-4" />
                  <div>
                    <div className="text-sm font-medium">{tool.title}</div>
                    <div className="text-xs text-muted-foreground">{tool.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Slide-in Panel */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {menuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-[3140] animate-in fade-in duration-200"
              onClick={() => setMenuOpen(false)}
            />
          )}

          {/* Slide-in Menu */}
          <div
            ref={menuRef}
            className={cn(
              "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-background border-r border-border z-[3150] overflow-y-auto transition-transform duration-300 ease-out",
              menuOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-white dark:bg-background z-10">
              <span className="text-lg font-bold">Hustle Tools</span>
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
                  onClick={() => setMenuOpen(false)}
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
                {tools.chat.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <tool.icon className="h-5 w-5" />
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
                {tools.design.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <tool.icon className="h-5 w-5" />
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
                {tools.research.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <tool.icon className="h-5 w-5" />
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
                {tools.tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <tool.icon className="h-5 w-5" />
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
}
