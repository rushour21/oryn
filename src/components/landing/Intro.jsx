import {
  Lock,
  AudioLines,
  MessagesSquare,
  Layers,
  Code2,
  Gauge,
} from 'lucide-react'

const CAPS = [
  { icon: Layers, label: 'Ladder' },
  { icon: Lock, label: 'Encrypt' },
  { icon: AudioLines, label: 'Transcribe' },
  { icon: MessagesSquare, label: 'Ask AI' },
  { icon: Code2, label: 'Embed' },
  { icon: Gauge, label: 'Observe' },
]

/** Asymmetric statement + capability strip. */
export function Intro() {
  return (
    <section id="platform" className="wrap py-20">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <h2
          data-reveal
          className="font-display text-[clamp(1.75rem,3.6vw,2.6rem)] font-medium leading-[1.2] tracking-tight"
        >
          ORYN is a video pipeline designed to ship secure, searchable lectures
        </h2>

        <p
          data-reveal
          className="max-w-md self-end font-mono text-[13px] leading-[1.85] text-muted-foreground"
        >
          Media processing, encryption, transcription and retrieval normally mean
          four vendors and three months of glue code. ORYN runs them as one
          background worker with five stages, so a forty minute lecture is live,
          locked and answerable in about twenty minutes.
        </p>
      </div>

      {/* capability strip */}
      <div
        data-reveal-group
        className="mt-16 grid grid-cols-3 border-l border-t border-border sm:grid-cols-6"
      >
        {CAPS.map((c) => (
          <div
            key={c.label}
            className="group flex h-28 flex-col items-center justify-center gap-3
                       border-b border-r border-border transition-colors hover:bg-accent/40"
          >
            <c.icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
