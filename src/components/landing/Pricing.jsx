import { Check, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DEV_PLATFORM_BLURB, DEV_PLATFORM_HREF } from '@/components/landing/status'

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    lede: 'Enough to ship a real course and see if this works for you.',
    cta: 'Start free',
    to: '/signup',
    features: [
      '10 videos',
      '20 GB storage',
      '300 encoding minutes',
      '500 AI questions / month',
      'Domain-locked embeds',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: '₹2,499',
    period: 'per month',
    lede: 'For teachers and small academies running a paid catalogue.',
    cta: 'Start free trial',
    to: '/signup',
    featured: true,
    features: [
      'Unlimited videos',
      '500 GB storage',
      '3,000 encoding minutes',
      '20,000 AI questions / month',
      'Custom player branding',
      'Concurrent stream limits',
      'Email support',
    ],
  },
  {
    name: 'Business',
    price: '₹9,999',
    period: 'per month',
    lede: 'For platforms integrating ORYN through the API and SDKs.',
    cta: 'Talk to us',
    href: DEV_PLATFORM_HREF,
    // Everything above the line is live today; the API items are not yet
    // self-serve, so the card says so rather than letting someone pay for
    // a key they cannot generate.
    note: DEV_PLATFORM_BLURB,
    features: [
      'Everything in Pro',
      '2 TB storage',
      'API keys + webhooks',
      '@oryn/node and @oryn/react',
      'Playback tokens per viewer',
      'Usage-based overage',
      'Priority support + SLA',
    ],
  },
]

/**
 * `showHeading` exists because this section is used in two places that need
 * different framing: on the landing page it is section seven of a numbered
 * sequence and needs its own heading, while /pricing gives the page a heading
 * already — rendering both produced the same sentence twice, one above the
 * other, and a "{ 07 }" label on a page with no sections one through six.
 */
export function Pricing({ showHeading = true }) {
  return (
    <section id="pricing" className="relative z-10 py-24">
      <div className="wrap">
        {showHeading && (
          <div data-reveal className="mb-14 max-w-2xl">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
              {'{ 07 }'} Pricing
            </p>
            <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-medium leading-[1.14] tracking-tight">
              Priced on what you actually use
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
              Five metered units: storage, encoding minutes, transcription minutes,
              delivery, and AI questions. No per-seat pricing, no surprise bandwidth
              invoice.
            </p>
          </div>
        )}

        <div data-reveal-group className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={cn(
                'relative flex flex-col overflow-hidden rounded-xl border bg-card p-7',
                p.featured ? 'border-primary/40 lg:-my-3 lg:py-10' : 'border-border',
              )}
            >
              {p.featured && (
                <>
                  <div className="pointer-events-none absolute inset-0 grad-bg-soft" />
                  <Badge className="absolute right-6 top-6">Most popular</Badge>
                </>
              )}

              <div className="relative flex flex-1 flex-col">
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <p className="mt-2 min-h-10 text-sm text-muted-foreground">
                  {p.lede}
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold">{p.price}</span>
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {p.period}
                  </span>
                </div>

                <Button
                  asChild
                  variant={p.featured ? 'default' : 'outline'}
                  className="mt-7 w-full"
                >
                  {p.to ? (
                    <Link to={p.to}>
                      {p.cta} <ArrowRight className="size-4" />
                    </Link>
                  ) : (
                    <a href={p.href}>
                      {p.cta} <ArrowRight className="size-4" />
                    </a>
                  )}
                </Button>

                {p.note && (
                  <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {p.note}
                  </p>
                )}

                <ul className="mt-8 space-y-3 border-t border-border-soft pt-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <p data-reveal className="mt-8 text-center font-mono text-[11px] text-muted-foreground">
          Prices are indicative for early access · billed monthly · cancel anytime
        </p>
      </div>
    </section>
  )
}
