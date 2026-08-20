import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/misc'
import { PageHeader } from '@/components/dashboard/shared'
import { usageApi } from '@/lib/api/usage'

/**
 * Usage (PRD F20 stage 1 — counting, not billing).
 *
 * There is deliberately no price on this page. Billing is stage 2 and does not
 * exist yet; showing a currency figure derived from nothing would be inventing
 * a number the system cannot stand behind. Consumption against plan limits is
 * real and is what this shows.
 */

const LABELS = {
  storage:       { label: 'Storage',       note: 'GB-months' },
  encoding:      { label: 'Encoding',      note: 'output minutes' },
  transcription: { label: 'Transcription', note: 'audio minutes' },
  delivery:      { label: 'Delivery',      note: 'GB streamed' },
  ai_question:   { label: 'AI questions',  note: 'chat requests' },
}

/** Compact display for numbers spanning 0.003 to 50,000 across metrics. */
function formatQuantity(value, unit) {
  if (value === 0) return '0'
  if (value < 0.01) return `<0.01 ${unit === 'questions' ? '' : unit}`.trim()
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatPeriod(period) {
  if (!period?.start) return null
  const start = new Date(period.start)
  // The API's period end is the first instant of the next month; subtracting a
  // day shows the last day actually inside the period, which is what a person
  // reading "1 Aug – 31 Aug" expects.
  const end = new Date(new Date(period.end).getTime() - 86_400_000)
  const fmt = (d, opts) => d.toLocaleDateString(undefined, { timeZone: 'UTC', ...opts })
  return `${fmt(start, { day: 'numeric' })} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export default function Usage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['usage', 'summary'],
    queryFn: usageApi.summary,
  })

  // Encoding is the clearest single proxy for "how much work did this account
  // generate", so it's the one charted by default.
  const { data: series } = useQuery({
    queryKey: ['usage', 'series', 'encoding'],
    queryFn: () => usageApi.series({ metric: 'encoding', days: 14 }),
  })

  if (isLoading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="flex items-center gap-3 p-6">
          <AlertTriangle className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Could not load usage. Try again shortly.</p>
        </Card>
      </div>
    )
  }

  const points = series?.points ?? []
  const max = Math.max(...points.map((p) => p.total), 1)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Usage"
        description="Five metered units, counted as they happen."
      />

      <Card className="p-6">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Current cycle</h2>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {formatPeriod(data.period)} · {data.plan} plan
            </p>
          </div>
        </div>

        {points.length === 0 ? (
          <div className="grid h-32 place-items-center rounded-md border border-dashed">
            <p className="font-mono text-[11px] text-muted-foreground">
              No encoding activity in the last 14 days
            </p>
          </div>
        ) : (
          <>
            <div className="flex h-32 items-end gap-1.5">
              {/* h-full on the wrapper is load-bearing: the bar's height is a
                  percentage, and a percentage of an auto-height parent computes
                  to zero — which is exactly why the chart this replaced looked
                  empty. */}
              {points.map((p) => (
                <div key={p.day} className="group flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-sm bg-primary/25 transition-colors group-hover:bg-primary"
                    style={{ height: `${Math.max((p.total / max) * 100, 2)}%` }}
                    title={`${p.day}: ${formatQuantity(p.total, 'minutes')} min encoded`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{points[0]?.day}</span>
              <span>encoding minutes/day</span>
              <span>{points[points.length - 1]?.day}</span>
            </div>
          </>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.metrics.map((m) => {
          const meta = LABELS[m.metric] ?? { label: m.metric, note: m.unit }
          return (
            <Card key={m.metric} className="p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {meta.note}
                    {/* Delivery can't be measured exactly — segments redirect
                        straight to storage. Said plainly rather than passing an
                        estimate off as a reading. */}
                    {m.estimated && ' · estimated'}
                  </p>
                </div>
                {m.over_limit
                  ? <Badge variant="destructive">over limit</Badge>
                  : m.warning && <Badge variant="warning">80%</Badge>}
              </div>

              <p className="mb-3 font-display text-2xl font-bold">
                {formatQuantity(m.used, m.unit)}
              </p>

              {m.limit === null ? (
                <p className="font-mono text-[11px] text-muted-foreground">no limit on this plan</p>
              ) : (
                <>
                  <Progress value={Math.min(m.percent_used ?? 0, 100)} />
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    of {formatQuantity(m.limit, m.unit)} {m.unit}
                  </p>
                </>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
