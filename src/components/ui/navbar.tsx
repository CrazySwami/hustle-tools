'use client';

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { ModeToggle } from "./mode-toggle"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { Flame, FileSearch, Ticket, ImageIcon, FileText, Boxes } from "lucide-react"

export function Navbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const tools = {
    scraping: [
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
        title: "TKX Events",
        href: "/tkx-calendar",
        description: "Browse upcoming concerts and events",
        icon: Ticket,
      },
    ],
    design: [
      {
        title: "Elementor Builder",
        href: "/elementor-editor",
        description: "WordPress section builder with live preview",
        icon: Boxes,
      },
    ],
    media: [
      {
        title: "Image Processing",
        href: "/image-alterations",
        description: "Compress and blur images in bulk",
        icon: ImageIcon,
      },
      {
        title: "Document Editor",
        href: "/editor",
        description: "Rich text editor with TipTap",
        icon: FileText,
      },
    ],
  };

  const navLinks = [
    { href: "/chat", label: "Chat" },
    { href: "/editor", label: "Editor" },
    { href: "/elementor-editor", label: "Elementor" },
    { href: "/firecrawl", label: "Firecrawl" },
    { href: "/image-alterations", label: "Image Alterations" },
    { href: "/page-extractor", label: "Page Extractor" },
    { href: "/tkx-calendar", label: "TKX Events" },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold tracking-tighter text-foreground hover:text-foreground/80 transition-colors">
          Hustle Tools
        </Link>

        {/* Desktop Navigation with Dropdowns */}
        {!isMobile && (
          <>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/chat" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Chat
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Scraping</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-1">
                      {tools.scraping.map((tool) => (
                        <ListItem
                          key={tool.title}
                          title={tool.title}
                          href={tool.href}
                          icon={tool.icon}
                        >
                          {tool.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Design</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {tools.design.map((tool) => (
                        <ListItem
                          key={tool.title}
                          title={tool.title}
                          href={tool.href}
                          icon={tool.icon}
                        >
                          {tool.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Media</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {tools.media.map((tool) => (
                        <ListItem
                          key={tool.title}
                          title={tool.title}
                          href={tool.href}
                          icon={tool.icon}
                        >
                          {tool.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <div className="flex items-center gap-4">
              <ModeToggle />
            </div>
          </>
        )}

        {/* Mobile: Hamburger Menu Button + Mode Toggle */}
        {isMobile && (
          <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ModeToggle />

            {/* Hamburger Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
              style={{
                transition: 'all 0.2s ease'
              }}
              aria-label="Toggle menu"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-[1.2rem] w-[1.2rem]"
              >
                <path
                  d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '50px',
                  right: '0',
                  background: 'var(--card)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  minWidth: '200px',
                  overflow: 'hidden',
                  animation: 'slideDown 0.2s ease-out',
                  zIndex: 100,
                  border: '1px solid var(--border)'
                }}
              >
                {navLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '14px 20px',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: 'var(--foreground)',
                      textDecoration: 'none',
                      borderBottom: index < navLinks.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--muted)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            <style jsx global>{`
              @keyframes slideDown {
                from {
                  transform: translateY(-10px);
                  opacity: 0;
                }
                to {
                  transform: translateY(0);
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  )
}

const ListItem = ({
  className,
  title,
  children,
  href,
  icon: Icon,
  ...props
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
  icon?: any;
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            <div className="text-sm font-medium leading-none">{title}</div>
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
