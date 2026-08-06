import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Menu, X, ArrowRight } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'

const LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Ask AI', href: '#askai' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Pricing', href: '#pricing' },
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
            <a
              key={l.href}
              href={l.href}
              className="text-[15px] font-medium text-white/85 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle className="size-9 rounded-full border-0 text-white/70 hover:bg-white/10 hover:text-white" />

          <Button
            asChild
            size="sm"
            className="ml-1 hidden rounded-full px-5 sm:inline-flex"
          >
            <Link to="/dashboard">
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
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <Button asChild className="mt-2 w-full rounded-full">
            <Link to="/dashboard">Start free</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
