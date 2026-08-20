import { useState } from 'react'
import { Link } from 'react-router'
import { Check } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { DEV_PLATFORM_HREF } from '@/components/landing/status'

// `to` renders a router Link, `href` an anchor. The in-page anchors only
// resolve on the landing page, so anything reachable from every page — which
// is the whole footer — points at a real route instead.
const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', to: '/product' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Ask AI', to: '/product' },
      { label: 'Pipeline', to: '/product' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'API reference', to: '/docs' },
      { label: 'Quickstart', to: '/docs' },
      { label: 'Request API access', href: DEV_PLATFORM_HREF },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Questions', to: '/pricing' },
      { label: 'Contact', href: 'mailto:hello@oryn.com' },
    ],
  },
]

export function Footer() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!email.includes('@')) return
    // TODO: POST /api/waitlist
    setDone(true)
  }

  return (
    <footer className="p-3 sm:p-6 lg:p-10">
      <div className="overflow-hidden rounded-[16px] border border-border bg-card sm:rounded-[32px]">
        <div className="grid gap-12 border-b border-border p-8 sm:p-12 lg:grid-cols-[1fr_2fr]">
          {/* newsletter */}
          <div>
            <h3 className="font-display text-lg font-semibold">
              Want to stay in touch?
            </h3>
            <p className="mt-3 max-w-xs font-mono text-[12px] leading-[1.8] text-muted-foreground">
              Early access updates, changelog notes and the occasional
              engineering write-up.
            </p>

            {done ? (
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-2 text-sm text-primary">
                <Check className="size-4" /> You&rsquo;re on the list
              </p>
            ) : (
              <form onSubmit={submit} className="mt-6 flex max-w-sm">
                <div className="flex w-full items-center rounded-full border border-border bg-background p-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER YOUR E-MAIL"
                    aria-label="Email address"
                    className="min-w-0 flex-1 bg-transparent px-4 font-mono text-[11px] uppercase tracking-widest outline-none placeholder:text-muted-foreground/60"
                  />
                  <Button type="submit" size="sm" className="rounded-full px-5">
                    Subscribe
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {col.title}
                </p>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.to ? (
                        <Link to={l.to} className="text-sm transition-colors hover:text-primary">
                          {l.label}
                        </Link>
                      ) : (
                        <a href={l.href} className="text-sm transition-colors hover:text-primary">
                          {l.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* oversized wordmark */}
        <div className="overflow-hidden px-8 pt-12">
          <p className="select-none text-center font-display text-[clamp(4rem,17vw,13rem)] font-bold leading-[0.85] tracking-tighter text-foreground/[0.05]">
            ORYN
          </p>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border px-8 py-6 font-mono text-[11px] text-muted-foreground sm:flex-row sm:px-12">
          <div className="flex items-center gap-3">
            <Logo showWord={false} />
            <span>© {new Date().getFullYear()} ORYN · All rights reserved</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Terms
            </a>
            <Link to="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
