import { Pricing } from '@/components/landing/Pricing'
import { FAQ } from '@/components/landing/FAQ'

/**
 * Standalone pricing page.
 *
 * Reuses the landing page's Pricing and FAQ sections — see the note in
 * Product.jsx on why these are composed rather than copied. The FAQ belongs
 * here as much as on the landing page: most of what it answers is what someone
 * wants to know at exactly the moment they are looking at prices.
 *
 * Named PricingPage rather than Pricing so it does not collide with the
 * section component it renders.
 */
export default function PricingPage() {
  return (
    <>
      <section className="wrap pt-16 pb-2 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Pricing
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Priced on what you actually use
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Storage, encoding, transcription, delivery and AI questions are metered
            separately, and your dashboard shows each one against your plan as it accrues.
          </p>
        </div>
      </section>

      <Pricing showHeading={false} />
      <FAQ />
    </>
  )
}
