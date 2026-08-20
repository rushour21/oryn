import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { Menu, X } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Navigation for the standalone marketing pages.
 *
 * Separate from landing's Navbar rather than shared: that one is a floating
 * glass pill positioned inside the hero card and styled against it, which only
 * works when there is a hero underneath. This is a conventional sticky bar for
 * pages that begin with content.
 *
 * Uses NavLink, not anchors, so the current section is actually marked —
 * the reason for having real routes at all is that a visitor can tell where
 * they are, link to it, and use the back button.
 */
const LINKS = [
  { label: 'Product', to: '/product' },
  { label: 'Docs', to: '/docs' },
  { label: 'Pricing', to: '/pricing' },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="ORYN home" className="flex shrink-0 items-center gap-2.5">
          <LogoMark className="size-7" />
          <span className="font-display text-[18px] font-bold tracking-tight">ORYN</span>
        </Link>

        <div className="ml-8 hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => cn(
                'text-[15px] font-medium transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/signup">Start free</Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-md text-muted-foreground md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border/60 px-4 py-3 md:hidden">
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => cn(
                  'rounded-md px-2 py-2.5 text-[15px] font-medium',
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground',
                )}
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2.5 text-[15px] font-medium text-muted-foreground sm:hidden"
            >
              Log in
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
