'use client';

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { ModeToggle } from "./mode-toggle"

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

  const navLinks = [
    { href: "/firecrawl", label: "Firecrawl" },
    { href: "/image-alterations", label: "Image Alterations" },
    { href: "/chat", label: "Chat" },
    { href: "/chat-doc-editor", label: "Doc Editor" },
    { href: "/editor", label: "Editor" },
    { href: "/elementor-editor", label: "Elementor" },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo - Black text */}
        <Link href="/" className="text-lg font-bold tracking-tighter text-foreground hover:text-foreground/80 transition-colors">
          Hustle Tools
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <>
            <nav className="flex items-center gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
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
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '6px',
                background: menuOpen ? '#000000' : 'transparent',
                color: menuOpen ? '#ffffff' : '#000000',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                transition: 'all 0.2s ease'
              }}
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '50px',
                  right: '0',
                  background: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  minWidth: '200px',
                  overflow: 'hidden',
                  animation: 'slideDown 0.2s ease-out',
                  zIndex: 100
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
                      color: '#374151',
                      textDecoration: 'none',
                      borderBottom: index < navLinks.length - 1 ? '1px solid #e5e7eb' : 'none',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
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
