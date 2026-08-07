import { Link } from 'react-router'
import {
  ArrowUpRight,
  Check,
  Film,
  MessagesSquare,
  Clock,
  Zap,
  HardDrive,
  Video,
  UploadCloud,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Glass, WaveGauge, Ring } from '@/components/dashboard/glass'
import { StatusPill } from '@/components/dashboard/shared'
import { checklist, videos, stats } from '@/data/mock'
import { useAuthStore } from '@/stores/auth'
import { formatDuration, formatDate, cn } from '@/lib/utils'

const STAT_ICONS = {
  videos:    Video,
  storage:   HardDrive,
  watch:     Clock,
  questions: MessagesSquare,
}

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const THUMBNAIL_COLOR = {
  ready:      'border-primary/20 bg-primary/8 text-primary',
  processing: 'border-warning/20 bg-warning/8 text-warning',
  failed:     'border-destructive/20 bg-destructive/8 text-destructive',
  uploading:  'border-border bg-muted text-muted-foreground',
}

export default function DashboardHome() {
  const done       = checklist.filter((c) => c.done).length
  const processing = videos.find((v) => v.status === 'processing')
  const firstName  = useAuthStore((s) => s.user?.name?.split(' ')[0])

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 pt-6">

      {/* ── page header ── */}
      <div className="flex flex-col gap-4 px-1 pb-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] font-medium tracking-tight">
            {timeGreeting()}
            {firstName && `, ${firstName}`}
          </h1>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/60">
            {todayLabel()}
          </p>
        </div>
        <Button asChild className="gap-2 rounded-full">
          <Link to="/dashboard/upload">
            <UploadCloud className="size-4" />
            Upload video
          </Link>
        </Button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = STAT_ICONS[s.key]
          return (
            <Glass key={s.key} className="p-5">
              <div className="flex items-start justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {s.label}
                </p>
                {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground/35" />}
              </div>
              <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
                {s.value}
              </p>
              <p className="mt-1.5 font-mono text-[10px] text-primary">
                {s.delta} · {s.sub}
              </p>
            </Glass>
          )
        })}
      </div>

      {/* ── bento ── */}
      <div className="grid gap-4 lg:grid-cols-12">

        {/* pipeline — anchor tile */}
        <Glass hover className="lg:col-span-5 lg:row-span-2">
          <div className="relative flex h-full flex-col p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Pipeline
                </p>
                <h2 className="mt-1.5 font-display text-lg font-semibold">
                  Processing now
                </h2>
              </div>
              <Badge variant="warning" className="gap-1.5">
                <span className="size-1.5 rounded-full bg-current animate-[shimmer_1.6s_ease-in-out_infinite]" />
                1 active
              </Badge>
            </div>

            <div className="my-7 flex justify-center">
              <Ring value={processing?.progress ?? 0}>
                <p className="font-display text-3xl font-medium tracking-tight">
                  {processing?.progress ?? 0}
                  <span className="text-base text-muted-foreground">%</span>
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  transcode
                </p>
              </Ring>
            </div>

            <p className="truncate text-center text-sm font-medium">
              {processing?.title}
            </p>
            <p className="mt-1 text-center font-mono text-[11px] text-muted-foreground">
              {processing?.id} · stage 2 of 5
            </p>

            <div className="mt-7 grid grid-cols-5 gap-1.5">
              {['Inspect', 'Encode', 'Encrypt', 'Speech', 'Index'].map((s, i) => (
                <div key={s} className="text-center">
                  <div className={cn('h-1 rounded-full', i <= 1 ? 'grad-bg' : 'bg-[var(--glass-border)]')} />
                  <p className={cn(
                    'mt-2 font-mono text-[9px] uppercase tracking-wider',
                    i <= 1 ? 'text-primary' : 'text-muted-foreground/50',
                  )}>
                    {s}
                  </p>
                </div>
              ))}
            </div>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mt-auto w-full rounded-full pt-4"
            >
              <Link to={`/dashboard/videos/${processing?.id}`}>
                View timeline <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </Glass>

        {/* storage gauge */}
        <Glass hover className="lg:col-span-3 lg:row-span-2">
          <div className="relative flex h-full flex-col p-5">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Storage
            </p>
            <WaveGauge
              value={37}
              label="184 GB used"
              caption="of 500 GB · Pro"
              className="min-h-[240px] flex-1"
            />
          </div>
        </Glass>

        {/* setup checklist — spans 2 rows to fill the column */}
        <Glass className="lg:col-span-4 lg:row-span-2">
          <div className="relative flex h-full flex-col p-6">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Get set up
              </p>
              <span className="font-mono text-[11px] font-medium text-primary">
                {done}/{checklist.length}
              </span>
            </div>

            <div className="mt-5 mb-6 flex gap-1.5">
              {checklist.map((c, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors duration-500',
                    c.done ? 'grad-bg' : 'bg-[var(--glass-border)]',
                  )}
                />
              ))}
            </div>

            <ul className="flex-1 space-y-4">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-3 text-sm">
                  <span className={cn(
                    'grid size-5 shrink-0 place-items-center rounded-full transition-colors',
                    c.done
                      ? 'bg-primary/20'
                      : 'border border-[var(--glass-border)]',
                  )}>
                    {c.done && <Check className="size-3 text-primary" />}
                  </span>
                  <span className={cn(
                    'leading-snug',
                    c.done ? 'text-muted-foreground line-through' : 'text-foreground',
                  )}>
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-5 border-t border-[var(--glass-border)]">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Complete all steps to get the most out of ORYN.{' '}
                <Link to="/dashboard/settings" className="text-primary hover:underline underline-offset-2">
                  Go to settings →
                </Link>
              </p>
            </div>
          </div>
        </Glass>

        {/* recent uploads — full width */}
        <Glass className="lg:col-span-12">
          <div className="relative">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-2.5">
                <Film className="size-4 text-primary" />
                <h2 className="font-display text-base font-semibold">Recent uploads</h2>
                <span className="font-mono text-[10px] rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-muted-foreground">
                  {videos.length} videos
                </span>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-full gap-1">
                <Link to="/dashboard/videos">
                  View all <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>

            <div className="grid divide-y divide-[var(--glass-border)]">
              {videos.slice(0, 5).map((v) => (
                <Link
                  key={v.id}
                  to={`/dashboard/videos/${v.id}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)]"
                >
                  <span className={cn(
                    'grid h-10 w-[72px] shrink-0 place-items-center rounded-[10px] border font-mono text-[9px] font-semibold transition-colors',
                    THUMBNAIL_COLOR[v.status] ?? THUMBNAIL_COLOR.uploading,
                  )}>
                    {v.renditions.at(-1) ?? '—'}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{v.title}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                      {v.id}
                      {v.duration ? ` · ${formatDuration(v.duration)}` : ''}
                      {' · '}{formatDate(v.createdAt)}
                    </span>
                  </span>

                  {v.status === 'ready' && (
                    <span className="hidden items-center gap-3 font-mono text-[11px] text-muted-foreground sm:flex">
                      <span className="flex items-center gap-1">
                        <MessagesSquare className="size-3" />{v.questions}
                      </span>
                    </span>
                  )}

                  <StatusPill status={v.status} progress={v.progress} />
                </Link>
              ))}
            </div>
          </div>
        </Glass>

        {/* cost strip */}
        <Glass className="lg:col-span-12">
          <div className="relative flex flex-wrap items-center gap-6 px-6 py-5">
            <Zap className="size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Average cost per 40-minute lecture is{' '}
                <span className="text-primary">$0.47</span>
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                encode $0.21 · transcribe $0.18 · storage $0.08 — under your $0.60 target
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/dashboard/usage">Usage breakdown</Link>
            </Button>
          </div>
        </Glass>

      </div>
    </div>
  )
}
