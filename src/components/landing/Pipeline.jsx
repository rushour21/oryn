import { useEffect, useRef, useState } from 'react'
import { UploadCloud, Film, KeyRound, AudioLines, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGES = [
  {
    icon: UploadCloud,
    label: 'Inspect',
    time: '~4s',
    body: 'ffprobe reads duration, codec, resolution, framerate and bitrate. Corrupt files are rejected here, not twenty minutes in.',
    out: 'source_meta → jsonb',
  },
  {
    icon: Film,
    label: 'Transcode',
    time: '~8m',
    body: 'The ladder is chosen from the source resolution, so nothing is ever upscaled. Four renditions, one FFmpeg pass.',
    out: '360p · 480p · 720p · 1080p',
  },
  {
    icon: KeyRound,
    label: 'Encrypt',
    time: '~40s',
    body: 'A random AES-128 key per video encrypts every HLS segment. The key itself is wrapped with the master key before it touches Postgres.',
    out: 'aes-128-cbc + key info',
  },
  {
    icon: AudioLines,
    label: 'Transcribe',
    time: '~3m',
    body: '16 kHz mono audio goes to Whisper and comes back with word-level timestamps in English or Hindi.',
    out: 'segments[] + words[]',
  },
  {
    icon: Database,
    label: 'Index',
    time: '~2s',
    body: 'Segments are joined into ~60 second overlapping chunks — small enough to cite, large enough to carry meaning.',
    out: 'chunks[] → Ask AI',
  },
]

export function Pipeline() {
  const [active, setActive] = useState(0)
  const wrapRef = useRef(null)
  const paused = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) setActive((i) => (i + 1) % STAGES.length)
    }, 3200)
    return () => clearInterval(id)
  }, [])

  const Icon = STAGES[active].icon

  return (
    <section id="pipeline" className="relative z-10 border-y border-border-soft py-24">
      <div className="wrap">
        <div data-reveal className="mb-14 max-w-2xl">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
            {'{ 03 }'} Pipeline
          </p>
          <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-medium leading-[1.14] tracking-tight">
            One background worker, five stages
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
            Jobs are idempotent and retried three times before they land in a dead
            letter queue. Every step is timed, logged, and replayable from the
            dashboard.
          </p>
        </div>

        <div
          ref={wrapRef}
          data-reveal
          onMouseEnter={() => (paused.current = true)}
          onMouseLeave={() => (paused.current = false)}
          className="grid gap-6 lg:grid-cols-[300px_1fr]"
        >
          {/* rail */}
          <ol className="relative flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            <span className="pointer-events-none absolute left-[19px] top-5 hidden h-[calc(100%-40px)] w-px bg-border lg:block" />
            {STAGES.map((s, i) => (
              <li key={s.label} className="relative shrink-0 lg:w-full">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all',
                    i === active
                      ? 'border-primary/40 bg-primary/8'
                      : 'border-transparent hover:bg-accent',
                  )}
                >
                  <span
                    className={cn(
                      'relative z-10 grid size-10 shrink-0 place-items-center rounded-lg border transition-colors',
                      i === active
                        ? 'border-primary/45 bg-card text-primary'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    <s.icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block font-display text-sm font-semibold',
                        i === active ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {s.label}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground/70">
                      {s.time}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>

          {/* detail */}
          <div className="grad-border relative overflow-hidden rounded-xl border border-border bg-card p-7 sm:p-9">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-lg grad-bg text-[#04140f]">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    Stage {active + 1} of {STAGES.length}
                  </p>
                  <h3 className="font-display text-xl font-semibold">
                    {STAGES[active].label}
                  </h3>
                </div>
              </div>

              <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                {STAGES[active].body}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-border-soft pt-5">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Output
                </span>
                <code className="rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-[12px] text-primary">
                  {STAGES[active].out}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
