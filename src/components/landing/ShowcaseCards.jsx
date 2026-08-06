import { Lock, Play, FastForward, Sparkles, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

function Card({ id, eyebrow, title, lede, columns, children, tint }) {
  return (
    <section id={id} className="wrap py-10">
      <div
        data-reveal
        className="grain relative overflow-hidden rounded-[16px] border border-border sm:rounded-[32px]"
        style={{ background: tint }}
      >
        <div className="relative px-6 pt-16 text-center sm:px-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-[clamp(1.9rem,4vw,3rem)] font-medium leading-[1.08] tracking-tight">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-mono text-[13px] leading-[1.8] text-muted-foreground">
            {lede}
          </p>
        </div>

        {/* visual */}
        <div className="relative mx-4 mt-14 overflow-hidden rounded-t-[12px] border border-b-0 border-border bg-card sm:mx-10 sm:rounded-t-[20px]">
          {children}
        </div>

        {/* feature columns */}
        <div className="relative grid border-t border-border sm:grid-cols-3">
          {columns.map((c, i) => (
            <div
              key={c.title}
              className={cn(
                'p-7 sm:p-8',
                i < columns.length - 1 && 'border-b border-border sm:border-b-0 sm:border-r',
              )}
            >
              <h3 className="font-display text-[15px] font-semibold">{c.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- visual 1: encrypted player ---------- */
function PlayerMock() {
  return (
    <div className="relative aspect-[16/7] bg-gradient-to-br from-secondary to-background">
      <div className="absolute inset-0 bg-grid opacity-50" />

      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/75 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
        <Lock className="size-3 text-primary" /> AES-128 · token 04:52
      </div>

      <div className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full grad-bg shadow-brand">
          <Play className="size-6 translate-x-0.5 fill-[#04140f] text-[#04140f]" />
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="relative h-1 rounded-full bg-foreground/15">
          <div className="absolute inset-y-0 left-0 w-[36%] rounded-full grad-bg" />
          <div className="absolute left-[36%] top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
        </div>
        <div className="mt-2.5 flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>14:22</span>
          <span className="hidden sm:inline">1080p · 720p · 480p · 360p</span>
          <span>40:12</span>
        </div>
      </div>
    </div>
  )
}

/* ---------- visual 2: ask ai ---------- */
function ChatMock() {
  return (
    <div className="grid gap-px bg-border sm:grid-cols-[1fr_360px]">
      <div className="relative aspect-video bg-gradient-to-br from-secondary to-background sm:aspect-auto">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute inset-0 grid place-items-center">
          <span className="rounded-lg bg-background/85 px-3 py-1.5 font-mono text-xs text-primary backdrop-blur">
            seeking → 14:22
          </span>
        </div>
      </div>

      <div className="flex flex-col bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Sparkles className="size-4 text-primary" />
          <span className="font-display text-sm font-semibold">Ask AI</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            this video only
          </span>
        </div>

        <div className="flex-1 space-y-4 p-4">
          <div className="flex justify-end">
            <p className="max-w-[85%] rounded-xl rounded-br-sm bg-secondary px-3.5 py-2.5 text-sm">
              What is entropy in simple terms?
            </p>
          </div>
          <div className="flex gap-2.5">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md grad-bg">
              <Sparkles className="size-3 text-[#04140f]" />
            </span>
            <p className="text-sm leading-[1.9] text-muted-foreground">
              A measure of how spread out a system&rsquo;s energy is — he calls it
              &ldquo;disorder you cannot get back&rdquo;.
              <span className="mx-1 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 align-middle font-mono text-[11px] text-primary">
                <FastForward className="size-3" />
                14:22
              </span>
              The ice example follows.
              <span className="mx-1 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 align-middle font-mono text-[11px] text-primary">
                <FastForward className="size-3" />
                17:23
              </span>
            </p>
          </div>
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <span className="flex-1 text-sm text-muted-foreground/60">
              Ask anything about this lecture…
            </span>
            <Send className="size-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ShowcaseCards() {
  return (
    <>
      <Card
        id="security"
        eyebrow="{ 01 } Secure delivery"
        title="Encrypt, everything"
        lede="A random AES-128 key per video encrypts every HLS segment. The key is wrapped with a master key before it touches Postgres, and only ever served against a short-lived session token."
        tint="var(--brand-grad-soft)"
        columns={[
          {
            title: 'Token-bound keys',
            body: 'Ninety second sessions, pinned to viewer, IP and device. Every key request is logged.',
          },
          {
            title: 'Domain allowlist',
            body: 'A referer check plus a frame-ancestors policy the browser itself enforces.',
          },
          {
            title: 'Source-aware ladder',
            body: 'Four renditions chosen from the source. A 480p file never pays for a 1080p encode.',
          },
        ]}
      >
        <PlayerMock />
      </Card>

      <Card
        id="askai"
        eyebrow="{ 02 } Content intelligence"
        title="Answers that know where they came from"
        lede="Every claim is grounded in a chunk of the transcript, and every chunk carries a start time. Click a timestamp and the player is already there."
        columns={[
          {
            title: 'Forced citations',
            body: 'The model must cite a transcript chunk before an answer renders. No citation, no claim.',
          },
          {
            title: 'Honest gaps',
            body: 'If the lecture never covers it, the assistant says so instead of inventing an answer.',
          },
          {
            title: 'Whole transcript',
            body: 'Forty minutes is about eight thousand tokens, so it all goes in the prompt. No retrieval bugs.',
          },
        ]}
      >
        <ChatMock />
      </Card>
    </>
  )
}
