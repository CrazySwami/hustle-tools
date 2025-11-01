'use client';

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Flame, FileSearch, Ticket, ImageIcon, FileText, Boxes, FileEdit, Search, X, Sun, Moon, Activity, MessageSquare, Mic } from "lucide-react"

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export function Navbar() {
  const { theme, setTheme } = useTheme();
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
          // Switching to mobile: move to bottom-right
          setCorner('bottom-right');
          localStorage.setItem('nav-corner', 'bottom-right');
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
    const savedCorner = localStorage.getItem('nav-corner') as Corner | null;
    const userHasDragged = localStorage.getItem('nav-user-dragged') === 'true';

    if (savedCorner && userHasDragged) {
      setCorner(savedCorner);
    } else {
      // Set default based on current screen size
      const defaultCorner = isMobile ? 'bottom-right' : 'top-left';
      setCorner(defaultCorner);
      localStorage.setItem('nav-corner', defaultCorner);
    }
  }, []);

  // Calculate position based on corner
  useEffect(() => {
    const updatePosition = () => {
      const margin = 16; // 16px margin from edges
      const buttonWidth = isMobile ? 56 : 180; // Mobile: 56px circle, Desktop: 180px pill
      const buttonHeight = 56; // Both use 56px height
      // On mobile, add extra margin from bottom to align with typical action buttons (80-100px from bottom)
      const bottomMargin = isMobile ? 80 : margin;

      switch (corner) {
        case 'top-left':
          setPosition({ x: margin, y: margin });
          break;
        case 'top-right':
          setPosition({ x: window.innerWidth - buttonWidth - margin, y: margin });
          break;
        case 'bottom-left':
          setPosition({ x: margin, y: window.innerHeight - buttonHeight - bottomMargin });
          break;
        case 'bottom-right':
          setPosition({ x: window.innerWidth - buttonWidth - margin, y: window.innerHeight - buttonHeight - bottomMargin });
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

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag when clicking the button itself

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap to nearest corner
    const buttonWidth = isMobile ? 56 : 180;
    const buttonHeight = 56;
    const centerX = position.x + buttonWidth / 2;
    const centerY = position.y + buttonHeight / 2;
    const windowCenterX = window.innerWidth / 2;
    const windowCenterY = window.innerHeight / 2;

    let newCorner: Corner;
    if (centerX < windowCenterX && centerY < windowCenterY) {
      newCorner = 'top-left';
    } else if (centerX >= windowCenterX && centerY < windowCenterY) {
      newCorner = 'top-right';
    } else if (centerX < windowCenterX && centerY >= windowCenterY) {
      newCorner = 'bottom-left';
    } else {
      newCorner = 'bottom-right';
    }

    setCorner(newCorner);
    localStorage.setItem('nav-corner', newCorner);
    // Mark that user has manually positioned the button
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
        title: "Voice Chat",
        href: "/voice-chat",
        description: "Real-time voice conversation with AI",
        icon: Mic,
      },
      {
        title: "AI Doc Editor",
        href: "/chat-doc",
        description: "AI-powered document editor with analysis",
        icon: FileText,
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
      {
        title: "Keyword Research",
        href: "/keyword-research",
        description: "Google search results and SERP analysis",
        icon: Search,
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
    ],
  };

  const navLinks = [
    { href: "/voice-chat", label: "Voice Chat" },
    { href: "/chat-doc", label: "AI Doc" },
    { href: "/elementor-editor", label: "Elementor" },
    { href: "/firecrawl", label: "Firecrawl" },
    { href: "/keyword-research", label: "Keyword Research" },
    { href: "/image-editor", label: "Image Editor" },
    { href: "/page-extractor", label: "Page Extractor" },
    { href: "/tkx-calendar", label: "TKX Events" },
    { href: "/api-monitor", label: "API Monitor" },
  ];

  return (
    <>
      {/* Floating Draggable Button */}
      <div
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: 'none',
        }}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "flex items-center justify-center bg-background/95 backdrop-blur-md border-2 hover:bg-accent hover:text-accent-foreground transition-colors",
            "border-border dark:border-foreground/20 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.5)] shadow-lg",
            isMobile ? "w-14 h-14" : "gap-2 px-4 py-3"
          )}
          style={{
            borderRadius: '9999px',
            fontSize: isMobile ? '16px' : '14px',
            fontWeight: 600,
            letterSpacing: '-0.025em',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          <span>{isMobile ? 'HT' : 'Hustle Together'}</span>
        </button>
      </div>

      {/* Desktop: Dropdown Menu */}
      {!isMobile && menuOpen && (
        <div
          ref={menuRef}
          className="fixed z-[9998] bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
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
              className="fixed inset-0 bg-black/50 z-[9997] animate-in fade-in duration-200"
              onClick={() => setMenuOpen(false)}
            />
          )}

          {/* Slide-in Menu */}
          <div
            ref={menuRef}
            className={cn(
              "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-background border-r border-border z-[9998] overflow-y-auto transition-transform duration-300 ease-out",
              menuOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-white dark:bg-background z-10">
              <span className="text-lg font-bold">Hustle Together</span>
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
