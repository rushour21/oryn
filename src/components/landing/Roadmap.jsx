import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Check, Circle, ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

const PHASES = [
  {
    tag: 'Phase 1',
    status: 'Shipping now',
    live: true,
    title: 'The dashboard product',
    weeks: '6–8 weeks',
    lede: 'Everything a course seller needs without writing a line of code.',
    items: [
      'Accounts, organisations and team roles',
      'Resumable chunked upload straight to storage',
      'Adaptive ladder — never upscaled',
      'AES-128 encrypted HLS with wrapped keys',
      'Time-coded transcript index and subtitles',
      'Ask AI with seeking timestamps',
      'One-line embed, locked to your domains',
      'Processing timeline with retry',
    ],
  },
  {
    tag: 'Phase 2',
    status: 'Next',
    live: false,
    title: 'The developer platform',
    weeks: '4–5 weeks',
    lede: 'The same API the dashboard already runs on, made public.',
    items: [
      'Publishable and secret keys, test and live',
      'REST API with request IDs and idempotency',
      'Direct upload URLs and pull ingest',
      'Playback tokens scoped to one viewer',
      'Signed webhooks with a delivery log',
      '@oryn/node and @oryn/react, fully typed',
      'Docs with a five minute quickstart',
      'Metering across five billable units',
    ],
  },
]

/** Cards start fanned out and straighten as the section scrolls in. */
export function Roadmap() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const cards = el.querySelectorAll('[data-phase]')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(cards, { rotate: 0, y: 0, opacity: 1 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { rotate: (i) => (i === 0 ? -4 : 4), y: 60, opacity: 0 },
        {
          rotate: 0,
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        },
      )
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section id="roadmap" ref={root} className="wrap py-24">
      <div data-reveal className="mx-auto mb-16 max-w-2xl text-center">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
          {'{ 06 }'} Roadmap
        </p>
        <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-medium leading-[1.1] tracking-tight">
          Two phases, one API underneath
        </h2>
        <p className="mx-auto mt-6 max-w-lg font-mono text-[13px] leading-[1.85] text-muted-foreground">
          The dashboard is not a prototype that gets thrown away. It is the first
          client of the same HTTP API we open in Phase 2 — which is why the second
          phase takes weeks, not a rewrite.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {PHASES.map((p) => (
          <div
            key={p.tag}
            data-phase
            className={cn(
              'grain relative overflow-hidden rounded-[16px] border p-8 sm:rounded-[24px] sm:p-10',
              p.live ? 'border-primary/30' : 'border-border',
            )}
            style={p.live ? { background: 'var(--brand-grad-soft)' } : undefined}
          >
            <div className="relative">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Badge variant="mono">{p.tag}</Badge>
                <Badge variant={p.live ? 'success' : 'outline'}>
                  {p.live && (
                    <span className="size-1.5 rounded-full bg-[var(--success)]" />
                  )}
                  {p.status}
                </Badge>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                  {p.weeks}
                </span>
              </div>

              <h3 className="font-display text-2xl font-medium tracking-tight">
                {p.title}
              </h3>
              <p className="mt-3 font-mono text-[13px] leading-relaxed text-muted-foreground">
                {p.lede}
              </p>

              <ul className="mt-8 space-y-3">
                {p.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    {p.live ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={p.live ? 'text-foreground/90' : 'text-muted-foreground'}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              {p.live && (
                <Button asChild className="mt-9 rounded-full">
                  <Link to="/dashboard">
                    Open the dashboard <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
