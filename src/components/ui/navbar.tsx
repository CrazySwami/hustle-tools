import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"

export async function Navbar() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-lg font-bold tracking-tighter text-green-600">
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
            href="/chat-doc-editor"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Doc Editor
          </Link>
          <Link
            href="/editor"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Editor
          </Link>
          <Link
            href="/elementor-editor"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Elementor
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <ModeToggle />
          {user ? (
            <UserNav user={user} />
          ) : (
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
