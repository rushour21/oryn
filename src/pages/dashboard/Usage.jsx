import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/misc'
import { PageHeader } from '@/components/dashboard/shared'


const METERS = [
  { label: 'Storage', used: '184 GB', of: '500 GB', pct: 37, note: 'GB-months' },
  { label: 'Encoding', used: '1,740 min', of: '3,000 min', pct: 58, note: 'output minutes' },
  { label: 'Transcription', used: '620 min', of: '1,500 min', pct: 41, note: 'audio minutes' },
  { label: 'Delivery', used: '2.1 TB', of: '5 TB', pct: 42, note: 'GB streamed' },
  { label: 'AI questions', used: '9,247', of: '20,000', pct: 46, note: 'chat requests' },
]

// 14 days of synthetic daily volume
const SERIES = [12, 18, 9, 24, 31, 27, 40, 36, 52, 44, 61, 58, 73, 66]

export default function Usage() {
  const max = Math.max(...SERIES)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Usage & billing"
        description="Five metered units. Everything you are charged for appears here."
        action={<Button variant="outline">Manage plan</Button>}
      />

      <Card className="p-6">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">
              Current cycle
            </h2>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              1 Aug – 31 Aug 2026 · Pro plan
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold">₹2,499</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              estimated · no overage yet
            </p>
          </div>
        </div>

        {/* bar chart */}
        <div className="flex h-32 items-end gap-1.5">
          {SERIES.map((v, i) => (
            <div key={i} className="group flex-1">
              <div
                className="w-full rounded-t-sm bg-primary/25 transition-colors group-hover:bg-primary"
                style={{ height: `${(v / max) * 100}%` }}
                title={`Day ${i + 1}: ${v} videos`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>14 days ago</span>
          <span>today</span>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METERS.map((m) => (
          <Card key={m.label} className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {m.note}
                </p>
              </div>
              {m.pct >= 80 && <Badge variant="warning">80%</Badge>}
            </div>
            <p className="mb-3 font-display text-2xl font-bold">{m.used}</p>
            <Progress value={m.pct} />
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              of {m.of}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
