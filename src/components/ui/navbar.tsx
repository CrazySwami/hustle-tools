"use client"

import * as React from "react"
import Link from "next/link"

import { ModeToggle } from "./mode-toggle"

export function Navbar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-lg font-bold tracking-tighter">
          Hustle Tools
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/firecrawl"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Firecrawl
          </Link>
          <Link
            href="/image-alterations"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Image Alterations
          </Link>
          <Link
            href="/chat"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Chat
          </Link>
          <Link
            href="/editor"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Editor
          </Link>
        </nav>
        <ModeToggle />
      </div>
    </div>
  )
}
