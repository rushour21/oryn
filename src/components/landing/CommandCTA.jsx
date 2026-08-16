import { useState } from 'react'

/**
 * The line a teacher actually pastes into their site. It is the whole Phase 1
 * integration story, and it stays true after the SDKs ship — which is why the
 * closing card copies an embed rather than an install command for a package
 * nobody can download yet.
 */
const EMBED = `<iframe src="https://embed.oryn.com/v/vid_9k2m"
  width="100%" height="480" allow="encrypted-media" allowfullscreen></iframe>`

const LINES = [
  '<iframe src="oryn.com/v/…"',
  'allow="encrypted-media" />',
]

export function CommandCTA() {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(EMBED)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="wrap py-16">
      <button
        type="button"
        onClick={copy}
        data-reveal
        className="grain group relative block w-full overflow-hidden rounded-[16px]
                   border border-border bg-card px-6 py-24 text-center sm:rounded-[32px] sm:py-32"
      >
        <div className="pointer-events-none absolute inset-0 grad-bg-soft opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative">
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            One line, on any site you already have
          </p>

          {LINES.map((c, i) => (
            <p
              key={c}
              className="whitespace-nowrap font-display text-[clamp(1.05rem,5vw,3.4rem)]
                         font-medium leading-[1.2] tracking-tight transition-colors"
              style={{ color: i === 0 ? undefined : 'var(--muted-foreground)' }}
            >
              {c}
            </p>
          ))}

          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {copied ? '{ copied to clipboard _ }' : '{ click. copy. paste _ }'}
          </p>
        </div>
      </button>
    </section>
  )
}
