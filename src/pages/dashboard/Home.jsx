import { Link } from 'react-router'
import {
  ArrowUpRight,
  Check,
  TrendingUp,
  ArrowRight,
  Film,
  MessagesSquare,
  Clock,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Glass, WaveGauge, Spark, Ring } from '@/components/dashboard/glass'
import { StatusPill } from '@/components/dashboard/shared'
import { checklist, videos } from '@/data/mock'
import { formatDuration, formatDate, cn } from '@/lib/utils'

const QUESTION_TREND = [12, 18, 15, 27, 24, 38, 34, 49, 44, 61, 57, 74]
const WATCH_TREND = [40, 44, 39, 52, 61, 58, 70, 66, 79, 84, 81, 93]

export default function DashboardHome() {
  const done = checklist.filter((c) => c.done).length
  const processing = videos.find((v) => v.status === 'processing')

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 pt-6">
      {/* header */}
      <div className="flex flex-col gap-4 px-1 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            Thursday · 7 August
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">
            Good morning, Rushabh
          </h1>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/dashboard/upload">
            Upload video <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {/* ---------- bento ---------- */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* pipeline — the anchor tile */}
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
                  <div
                    className={cn(
                      'h-1 rounded-full',
                      i <= 1 ? 'grad-bg' : 'bg-[var(--glass-border)]',
                    )}
                  />
                  <p
                    className={cn(
                      'mt-2 font-mono text-[9px] uppercase tracking-wider',
                      i <= 1 ? 'text-primary' : 'text-muted-foreground/60',
                    )}
                  >
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

        {/* storage — the liquid tile */}
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

        {/* questions */}
        <Glass hover className="lg:col-span-4">
          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  AI questions
                </p>
                <p className="mt-2 font-display text-3xl font-medium tracking-tight">
                  9,247
                </p>
              </div>
              <span className="grid size-10 place-items-center rounded-[14px] border border-[var(--glass-border)]">
                <MessagesSquare className="size-[18px] text-primary" />
              </span>
            </div>
            <Spark points={QUESTION_TREND} className="mt-4" />
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5 text-primary" />
              <span className="font-medium text-primary">+31%</span> vs last month
            </p>
          </div>
        </Glass>

        {/* watch hours */}
        <Glass hover className="lg:col-span-4">
          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Watch hours
                </p>
                <p className="mt-2 font-display text-3xl font-medium tracking-tight">
                  3,914
                </p>
              </div>
              <span className="grid size-10 place-items-center rounded-[14px] border border-[var(--glass-border)]">
                <Clock className="size-[18px] text-primary" />
              </span>
            </div>
            <Spark points={WATCH_TREND} className="mt-4" />
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5 text-primary" />
              <span className="font-medium text-primary">+18%</span> vs last month
            </p>
          </div>
        </Glass>

        {/* setup */}
        <Glass className="lg:col-span-4">
          <div className="relative p-6">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Get set up
              </p>
              <span className="font-mono text-[11px] text-primary">
                {done}/{checklist.length}
              </span>
            </div>

            <div className="mb-5 flex gap-1.5">
              {checklist.map((c, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    c.done ? 'grad-bg' : 'bg-[var(--glass-border)]',
                  )}
                />
              ))}
            </div>

            <ul className="space-y-2.5">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={cn(
                      'grid size-4 shrink-0 place-items-center rounded-full',
                      c.done ? 'bg-primary/20' : 'border border-[var(--glass-border)]',
                    )}
                  >
                    {c.done && <Check className="size-2.5 text-primary" />}
                  </span>
                  <span
                    className={
                      c.done ? 'text-muted-foreground line-through' : 'text-foreground'
                    }
                  >
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Glass>

        {/* library */}
        <Glass className="lg:col-span-8">
          <div className="relative">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-2.5">
                <Film className="size-4 text-primary" />
                <h2 className="font-display text-base font-semibold">
                  Recent uploads
                </h2>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/dashboard/videos">
                  Library <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>

            <ul className="px-3 pb-3">
              {videos.slice(0, 5).map((v) => (
                <li key={v.id}>
                  <Link
                    to={`/dashboard/videos/${v.id}`}
                    className="flex items-center gap-4 rounded-[18px] px-3 py-3 transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)]"
                  >
                    <span className="grid h-11 w-[76px] shrink-0 place-items-center rounded-[12px] border border-[var(--glass-border)] font-mono text-[9px] text-muted-foreground">
                      {v.renditions.at(-1) ?? '—'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-medium">
                        {v.title}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                        {v.id} · {formatDuration(v.duration)} ·{' '}
                        {formatDate(v.createdAt)}
                      </span>
                    </span>
                    <StatusPill status={v.status} progress={v.progress} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Glass>

        {/* cost strip */}
        <Glass className="lg:col-span-12">
          <div className="relative flex flex-wrap items-center gap-6 px-6 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-[14px] grad-bg">
              <Zap className="size-[18px] text-[#04140f]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Average cost per 40-minute lecture is{' '}
                <span className="text-primary">$0.47</span>
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                encode $0.21 · transcribe $0.18 · storage $0.08 — under your $0.60
                target
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
