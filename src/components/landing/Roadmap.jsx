import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Check, ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DEV_PLATFORM_STATUS, DEV_PLATFORM_HREF } from '@/components/landing/status'

gsap.registerPlugin(ScrollTrigger)

/**
 * Two product surfaces, not two dates.
 *
 * This section used to publish the delivery schedule ("Phase 1 · 6–8 weeks").
 * That ages badly in both directions — it goes stale the day the platform
 * ships, and until then it invites everyone to time you. Framed as surfaces,
 * the copy is true now and still true afterwards; the only thing that changes
 * is the badge, which comes from `status.js`.
 */
const SURFACES = [
  {
    key: 'dashboard',
    kind: 'No code',
    status: 'Available now',
    live: true,
    title: 'The dashboard',
    lede: 'Everything a course seller needs without writing a line of code.',
    items: [
      'Resumable upload straight from the browser',
      'Adaptive quality, chosen from your source',
      'AES-128 encrypted delivery',
      'Searchable transcript and subtitles',
      'Ask AI with timestamps that seek the player',
      'One-line embed, locked to your domains',
      'Stage-by-stage processing timeline',
      'Team members, roles and usage limits',
    ],
    cta: { label: 'Start free', to: '/signup' },
  },
  {
    key: 'platform',
    kind: 'For developers',
    status: DEV_PLATFORM_STATUS,
    live: false,
    title: 'The API and SDKs',
    lede: 'The same HTTP API the dashboard already runs on, opened up.',
    items: [
      'Publishable and secret keys, test and live',
      'REST API with request IDs and idempotency',
      'Direct upload URLs and pull ingest',
      'Playback tokens scoped to a single viewer',
      'Signed webhooks with a delivery log',
      '@oryn/node and @oryn/react, fully typed',
      'Metering across five billable units',
    ],
    cta: { label: 'Request access', href: DEV_PLATFORM_HREF },
  },
]

/** Cards start fanned out and straighten as the section scrolls in. */
export function Roadmap() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const cards = el.querySelectorAll('[data-surface]')
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
    <section id="surfaces" ref={root} className="wrap py-24">
      <div data-reveal className="mx-auto mb-16 max-w-2xl text-center">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
          {'{ 06 }'} Two ways in
        </p>
        <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-medium leading-[1.1] tracking-tight">
          Click your way through it, or drive it from code
        </h2>
        <p className="mx-auto mt-6 max-w-lg font-mono text-[13px] leading-[1.85] text-muted-foreground">
          The dashboard is not a demo bolted onto an API. It is the first client
          of that API, which is why the two never drift apart — a video uploaded
          by hand and a video created over HTTP are the same video.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {SURFACES.map((s) => (
          <div
            key={s.key}
            data-surface
            className={cn(
              'grain relative flex flex-col overflow-hidden rounded-[16px] border p-8 sm:rounded-[24px] sm:p-10',
              s.live ? 'border-primary/30' : 'border-border',
            )}
            style={s.live ? { background: 'var(--brand-grad-soft)' } : undefined}
          >
            <div className="relative flex flex-1 flex-col">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Badge variant="mono">{s.kind}</Badge>
                <Badge variant={s.live ? 'success' : 'outline'}>
                  {s.live && (
                    <span className="size-1.5 rounded-full bg-[var(--success)]" />
                  )}
                  {s.status}
                </Badge>
              </div>

              <h3 className="font-display text-2xl font-medium tracking-tight">
                {s.title}
              </h3>
              <p className="mt-3 font-mono text-[13px] leading-relaxed text-muted-foreground">
                {s.lede}
              </p>

              <ul className="mt-8 space-y-3">
                {s.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={cn(
                        'mt-0.5 size-4 shrink-0',
                        s.live ? 'text-primary' : 'text-muted-foreground/40',
                      )}
                    />
                    <span
                      className={s.live ? 'text-foreground/90' : 'text-muted-foreground'}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-9">
                {s.cta.to ? (
                  <Button asChild className="rounded-full">
                    <Link to={s.cta.to}>
                      {s.cta.label} <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="rounded-full">
                    <a href={s.cta.href}>
                      {s.cta.label} <ArrowRight className="size-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
