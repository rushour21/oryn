import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShowcaseCards } from '@/components/landing/ShowcaseCards'
import { Pipeline } from '@/components/landing/Pipeline'
import { Impact } from '@/components/landing/Impact'

/**
 * Product overview.
 *
 * Composed from the same section components the landing page uses rather than
 * rewritten. They were already self-contained, and duplicating them would mean
 * two versions of the product story drifting apart the first time a feature
 * changes — the failure mode of every marketing site that grows pages faster
 * than it grows structure.
 *
 * What this page adds is a page-level frame: a heading that says what the
 * product is for someone arriving from a search result rather than scrolling
 * from a hero, and a close.
 */
export default function Product() {
  return (
    <>
      <section className="wrap pt-16 pb-4 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            The product
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Upload a lecture. Get a secure player and an AI tutor that knows it.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            Encrypted streaming that stops casual downloading, a player that only runs on
            domains you approve, and a chatbot per video that answers with timestamps a
            student can click.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link to="/signup">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link to="/docs">Read the docs</Link>
            </Button>
          </div>
        </div>
      </section>

      <ShowcaseCards />
      <Pipeline />
      <Impact />

      <section className="wrap py-16">
        <div className="mx-auto max-w-2xl rounded-[16px] border border-border bg-card p-8 text-center sm:rounded-[32px] sm:p-12">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Built to be integrated, not just used
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Everything the dashboard does is a documented HTTP call. Paste an iframe, or
            drive the whole thing from your own product.
          </p>
          <Button asChild className="mt-6 rounded-full px-6">
            <Link to="/docs">
              API reference <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}
