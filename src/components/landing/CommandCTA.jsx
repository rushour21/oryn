import { useState } from 'react'

const COMMANDS = ['$ npm i @oryn/node', '$ oryn upload lecture-12.mp4']

/** The oversized copy-the-command card that closes nestjs.com. */
export function CommandCTA() {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(COMMANDS.join('\n').replace(/\$ /g, ''))
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
          {COMMANDS.map((c, i) => (
            <p
              key={c}
              className="whitespace-nowrap font-display text-[clamp(1.4rem,6.5vw,4.5rem)]
                         font-medium leading-[1.15] tracking-tight transition-colors"
              style={{ color: i === 0 ? undefined : 'var(--muted-foreground)' }}
            >
              {c}
            </p>
          ))}

          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {copied ? '{ copied to clipboard _ }' : '{ click. copy. build _ }'}
          </p>
        </div>
      </button>
    </section>
  )
}
