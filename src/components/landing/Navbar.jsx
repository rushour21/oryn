import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Menu, X, ArrowRight } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'

// `to` is a real route; `href` stays an in-page anchor. Both appear here
// because the landing page genuinely has both: sections a visitor can jump to
// while scrolling, and pages that deserve their own URL.
const LINKS = [
  { label: 'Product', to: '/product' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Ask AI', href: '#askai' },
  { label: 'Docs', to: '/docs' },
  { label: 'Pricing', to: '/pricing' },
]


/** Floating glass pill, inset inside the hero card. */
export function Navbar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="relative pt-6">
      <nav className="glass-pill flex h-[68px] items-center gap-3 rounded-full px-4 text-white sm:px-6">
        <Link
          to="/"
          aria-label="ORYN home"
          className="flex shrink-0 items-center gap-2.5"
        >
          <LogoMark className="size-8" />
          <span className="font-display text-[19px] font-bold tracking-tight text-white">
            ORYN
          </span>
        </Link>

        {/* centered links */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex">
          {LINKS.map((l) => (
            l.to ? (
              <Link
                key={l.to}
                to={l.to}
                className="text-[15px] font-medium text-white/85 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="text-[15px] font-medium text-white/85 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            )
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            asChild
            size="sm"
            className="ml-1 hidden rounded-full px-5 sm:inline-flex"
          >
            <Link to="/signup">
              Start free <ArrowRight className="size-3.5" />
            </Link>
          </Button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-full text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass-pill absolute inset-x-0 top-full z-50 mt-3 rounded-3xl p-3 lg:hidden">
          {LINKS.map((l) => {
            const cls = 'block rounded-2xl px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white'
            return l.to ? (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className={cls}>
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={cls}>
                {l.label}
              </a>
            )
          })}
          <Button asChild className="mt-2 w-full rounded-full">
            <Link to="/signup">Start free</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
