import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Film,
  Gauge,
  LayoutGrid,
  Search,
  Settings2,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LogoMark } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { Ring, Spark } from '@/components/dashboard/glass'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

const NAV = [
  { icon: LayoutGrid, label: 'Overview', active: true },
  { icon: Film, label: 'Videos' },
  { icon: UploadCloud, label: 'Upload' },
  { icon: Gauge, label: 'Usage' },
  { icon: Settings2, label: 'Settings' },
]

const ROWS = [
  { title: 'Thermodynamics · Lecture 12', len: '40:12', state: 'ready' },
  { title: 'Entropy and the arrow of time', len: '34:58', state: 'ready' },
  { title: 'Heat engines — worked problems', len: '51:03', state: 'working' },
  { title: 'Course intro and syllabus', len: '08:24', state: 'ready' },
]

/* ---------------------------------------------------------------- chrome -- */

/** Browser window the preview sits in — gives the mock a place to be real. */
function BrowserChrome({ children }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-[0_60px_120px_-40px_rgba(0,0,0,0.65)] sm:rounded-[16px]">
      <div className="flex items-center gap-3 border-b border-border bg-secondary/60 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-1 font-mono text-[10px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-[var(--success)]" />
          app.oryn.com/dashboard
        </div>
      </div>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ mock -- */

function StatusPill({ state, pct }) {
  if (state === 'ready') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--success)]/30 bg-[var(--success)]/10 px-2 py-0.5 font-mono text-[10px] text-[var(--success)]">
        <CheckCircle2 className="size-3" />
        Ready
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
      <span className="size-1.5 animate-pulse-dot rounded-full bg-primary" />
      Transcribing {pct}%
    </span>
  )
}

/**
 * A working replica of the dashboard rather than a flat image: it stays sharp
 * on every display, follows the visitor's theme, and cannot drift out of date
 * the way an exported PNG does.
 */
function DashboardMock() {
  // The one moving part. A still screenshot says "software"; a progress bar
  // that actually advances says "your upload is being worked on right now".
  const [pct, setPct] = useState(38)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setPct((p) => (p >= 99 ? 38 : p + 1)), 220)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative flex min-h-[420px] bg-background">
      {/* ambient mesh, scoped to the frame */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <span className="absolute -left-16 -top-20 size-64 rounded-full bg-[var(--teal)] opacity-[0.09] blur-[70px]" />
        <span className="absolute -right-10 top-24 size-56 rounded-full bg-[var(--lime)] opacity-[0.07] blur-[70px]" />
      </div>

      {/* rail */}
      <aside className="relative z-10 hidden w-[168px] shrink-0 flex-col gap-1 border-r border-border-soft p-4 sm:flex">
        <div className="mb-5 flex items-center gap-2">
          <LogoMark className="size-5" />
          <span className="font-display text-[13px] font-bold tracking-tight">
            ORYN
          </span>
        </div>
        {NAV.map((n) => (
          <div
            key={n.label}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px]',
              n.active
                ? 'bg-primary/10 font-medium text-foreground'
                : 'text-muted-foreground',
            )}
          >
            <n.icon
              className={cn('size-3.5', n.active ? 'text-primary' : 'opacity-70')}
            />
            {n.label}
          </div>
        ))}
      </aside>

      {/* content */}
      <div className="relative z-10 min-w-0 flex-1 p-4 sm:p-5">
        {/* header */}
        <div className="mb-5 flex items-center gap-3">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            My Academy › Overview
          </p>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground sm:flex">
              <Search className="size-3" /> ⌘K
            </span>
            <Bell className="size-3.5 text-muted-foreground" />
            <span className="size-6 rounded-full grad-bg" />
          </div>
        </div>

        {/* tiles */}
        {/*
          Uploads is the tall anchor on the left; the ring and storage stack
          beside it to fill that height, and Ask AI runs full width underneath
          because a sparkline needs the horizontal room more than the vertical.
        */}
        <div className="grid gap-3 lg:grid-cols-[1fr_200px]">
          {/* uploads */}
          <div className="min-w-0 rounded-xl border border-border bg-card/70 p-4 lg:row-span-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-[13px] font-semibold">
                Recent uploads
              </p>
              <span className="font-mono text-[10px] text-muted-foreground">
                4 of 128
              </span>
            </div>

            <ul className="space-y-2.5">
              {ROWS.map((r) => (
                <li key={r.title} className="flex items-center gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-secondary">
                    <Film className="size-3 text-muted-foreground" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">
                      {r.title}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {r.len}
                    </span>
                  </span>
                  <StatusPill state={r.state} pct={pct} />
                </li>
              ))}
            </ul>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full grad-bg transition-[width] duration-200 ease-linear"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* pipeline ring */}
          <div className="flex items-center justify-center rounded-xl border border-border bg-card/70 p-4">
            <Ring value={pct} size={104} stroke={7}>
              <p className="font-display text-lg font-medium leading-none">
                {pct}%
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                pipeline
              </p>
            </Ring>
          </div>

          {/* storage */}
          <div className="rounded-xl border border-border bg-card/70 p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Storage
            </p>
            <p className="mt-2 font-display text-2xl font-medium leading-none">
              184<span className="text-sm text-muted-foreground"> GB</span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full w-[37%] rounded-full grad-bg" />
            </div>
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">
              of 500 GB · Pro
            </p>
          </div>

          {/* ask ai — full width under both columns */}
          <div className="rounded-xl border border-border bg-card/70 p-4 lg:col-span-2">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Sparkles className="size-3 text-primary" />
                  <p className="font-display text-[12px] font-semibold">
                    Ask AI · this week
                  </p>
                </div>
                <p className="font-display text-2xl font-medium leading-none">
                  1,284
                </p>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                questions answered
              </p>
            </div>
            <Spark
              points={[8, 14, 11, 22, 19, 31, 27, 38, 44, 41, 52, 61]}
              className="mt-3 h-9"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- section -- */

export function DashboardPreview() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const frame = el.querySelector('[data-frame]')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(frame, { rotateX: 0, y: 0, scale: 1, opacity: 1 })
      return
    }

    const ctx = gsap.context(() => {
      // Scrubbed rather than played once: the frame straightens as the visitor
      // scrolls, so the motion is theirs to control and never fires off-screen.
      gsap.fromTo(
        frame,
        { rotateX: 10, y: 48, scale: 0.94, opacity: 0.35 },
        {
          rotateX: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            end: 'top 38%',
            scrub: 0.6,
          },
        },
      )
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} id="product" className="wrap pb-24 pt-20 sm:pt-28 lg:pt-32">
      <div style={{ perspective: '1600px' }}>
        <div data-frame style={{ transformStyle: 'preserve-3d' }}>
          {/*
            Swap the mock for a real capture by replacing <DashboardMock /> with
            <img src={shot} alt="The ORYN dashboard" className="w-full" /> —
            the chrome, shadow and scroll animation stay as they are.
          */}
          <BrowserChrome>
            <DashboardMock />
          </BrowserChrome>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div data-reveal>
          <h2 className="max-w-xl font-display text-[clamp(1.6rem,3vw,2.25rem)] font-medium leading-[1.15] tracking-tight">
            Upload the lecture. Watch the rest happen.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Encoding, encryption, transcription and the AI index run on their
            own and report back stage by stage. Nothing to install, no server to
            keep alive, no plugin to update.
          </p>
        </div>

        <div data-reveal className="flex flex-wrap gap-3">
          <Button asChild className="rounded-full px-6">
            <Link to="/signup">
              Start free <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <a href="#pipeline">See the pipeline</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
