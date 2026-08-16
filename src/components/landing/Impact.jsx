import { useRef } from 'react'
import { useCountUp } from '@/hooks/useScrollAnimations'

function Big({ value, decimals, suffix, prefix }) {
  const ref = useRef(null)
  useCountUp(ref, value, { decimals, suffix })
  return (
    <>
      {prefix}
      <span ref={ref}>0{suffix}</span>
    </>
  )
}

/** Gradient stat card + the "can't afford" band, both from the nestjs layout. */
export function Impact() {
  return (
    <>
      <section className="wrap py-10">
        <div
          data-reveal
          className="grain relative grid overflow-hidden rounded-[16px] px-8 py-14
                     sm:rounded-[32px] sm:px-14 lg:grid-cols-2 lg:items-end"
          style={{
            background:
              'linear-gradient(115deg, var(--hero-edge) 0%, var(--hero-core) 55%, var(--hero-edge) 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(600px 380px at 8% 10%, rgba(184,234,95,.2), transparent 62%)',
            }}
          />

          <h2 className="relative font-display text-[clamp(1.9rem,4vw,3rem)] font-medium leading-[1.1] tracking-tight text-white">
            One upload.
            <br />
            Four outputs.
          </h2>

          <div className="relative mt-12 lg:mt-0 lg:text-right">
            <p className="font-display text-[clamp(3rem,9vw,5.5rem)] font-medium leading-none text-white">
              <Big value={20} suffix="m" />
            </p>
            <p className="mt-3 font-mono text-xs uppercase tracking-widest text-white/60">
              A 40-minute lecture, live in
            </p>

            <div className="mt-9 flex gap-12 lg:justify-end">
              <div>
                <p className="font-display text-2xl font-medium text-white">
                  <Big value={4} />
                </p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-white/55">
                  quality levels per video
                </p>
              </div>
              <div>
                <p className="font-display text-2xl font-medium text-white">
                  <Big value={90} suffix="s" />
                </p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-white/55">
                  token lifetime
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "can't afford mistakes" band with the arc glow */}
      <section className="wrap relative overflow-hidden py-28">
        <div className="pointer-events-none absolute -right-40 top-1/2 size-[520px] -translate-y-1/2 arc-glow opacity-70" />

        <div data-reveal className="relative max-w-2xl">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
            {'{ 05 }'} Reliability
          </p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3.25rem)] font-medium leading-[1.1] tracking-tight">
            Built for courses that can&rsquo;t afford a broken player
          </h2>
          <p className="mt-6 max-w-lg font-mono text-[13px] leading-[1.85] text-muted-foreground">
            Jobs are idempotent and retried three times before they reach a dead
            letter queue. Every step is timed, logged and replayable, so
            &ldquo;why is my video stuck&rdquo; is a question you answer in the
            dashboard rather than a terminal.
          </p>
        </div>
      </section>
    </>
  )
}
