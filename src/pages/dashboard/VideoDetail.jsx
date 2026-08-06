import { useState } from 'react'
import { useParams, Link } from 'react-router'
import {
  ArrowLeft,
  Play,
  Copy,
  Check,
  RotateCw,
  Lock,
  Download,
  Plus,
  Trash2,
  FastForward,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch, Separator } from '@/components/ui/misc'
import {
  Tabs,
  TabsContent,
  TabsListUnderline,
  TabsTriggerUnderline,
} from '@/components/ui/tabs'
import { PageHeader, StatusPill } from '@/components/dashboard/shared'
import { videos, pipelineSteps, transcriptChunks, domains } from '@/data/mock'
import { formatDuration, formatBytes, formatDate } from '@/lib/utils'

const RENDITIONS = [
  { name: '1080p', bitrate: '5,000 kbps', size: 1_073_741_824, segments: 302 },
  { name: '720p', bitrate: '2,800 kbps', size: 601_295_421, segments: 302 },
  { name: '480p', bitrate: '1,400 kbps', size: 300_647_710, segments: 301 },
  { name: '360p', bitrate: '800 kbps', size: 171_798_691, segments: 301 },
]

function CopyField({ value, label }) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      {label && (
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      )}
      <div className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] px-3 py-2">
        <code className="flex-1 truncate font-mono text-xs">{value}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy"
        >
          {copied ? (
            <Check className="size-3.5 text-primary" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}

export default function VideoDetail() {
  const { id } = useParams()
  const video = videos.find((v) => v.id === id) ?? videos[0]

  const embedCode = `<iframe
  src="https://embed.oryn.com/v/${video.id}"
  width="100%" height="480" frameborder="0"
  allow="fullscreen; encrypted-media"
  allowfullscreen></iframe>`

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        to="/dashboard/videos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Videos
      </Link>

      <PageHeader
        title={video.title}
        description={
          <span className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {video.id} · {formatDuration(video.duration)} ·{' '}
            {formatBytes(video.size)} · {formatDate(video.createdAt)}
          </span>
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline">
              <RotateCw className="size-4" /> Reprocess
            </Button>
            <Button>
              <Play className="size-4" /> Preview
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsListUnderline>
          <TabsTriggerUnderline value="overview">Overview</TabsTriggerUnderline>
          <TabsTriggerUnderline value="renditions">Qualities</TabsTriggerUnderline>
          <TabsTriggerUnderline value="pipeline">Processing</TabsTriggerUnderline>
          <TabsTriggerUnderline value="transcript">Transcript</TabsTriggerUnderline>
          <TabsTriggerUnderline value="embed">Embed</TabsTriggerUnderline>
        </TabsListUnderline>

        {/* ---------- Overview ---------- */}
        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-secondary to-background">
                <div className="absolute inset-0 bg-grid opacity-50" />
                <div className="absolute inset-0 grid place-items-center">
                  <button className="grid size-16 place-items-center rounded-full grad-bg shadow-brand transition-transform hover:scale-105">
                    <Play className="size-6 translate-x-0.5 fill-[#04140f] text-[#04140f]" />
                  </button>
                </div>
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/75 px-2 py-1 font-mono text-[10px] backdrop-blur">
                  <Lock className="size-3 text-primary" /> AES-128
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 font-display text-base font-semibold">Details</h3>
              <dl className="space-y-3.5 text-sm">
                {[
                  ['Status', <StatusPill key="s" status={video.status} />],
                  ['Duration', formatDuration(video.duration)],
                  ['Source size', formatBytes(video.size)],
                  ['Source', '1920×1080 · h264 · 30fps'],
                  ['Renditions', video.renditions.join(' · ') || '—'],
                  ['Transcript', video.transcript ? 'Indexed · 41 chunks' : 'Pending'],
                  ['Views', video.views.toLocaleString()],
                  ['AI questions', video.questions.toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>

              <Separator className="my-5" />
              <div className="space-y-3">
                <CopyField label="Video ID" value={video.id} />
                <CopyField
                  label="Playback URL"
                  value={`https://embed.oryn.com/v/${video.id}`}
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- Renditions ---------- */}
        <TabsContent value="renditions">
          <Card className="divide-y divide-[var(--glass-border)]">
            {RENDITIONS.map((r) => (
              <div
                key={r.name}
                className="flex flex-wrap items-center gap-4 p-4 sm:px-5"
              >
                <Badge variant="mono" className="w-16 justify-center">
                  {r.name}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.bitrate}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {r.segments} segments · aes-128-cbc
                  </p>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatBytes(r.size)}
                </p>
                <Button variant="ghost" size="icon" aria-label="Download manifest">
                  <Download className="size-4" />
                </Button>
              </div>
            ))}
          </Card>

          <p className="mt-4 font-mono text-[11px] text-muted-foreground">
            Ladder chosen from the source resolution — nothing is upscaled.
          </p>
        </TabsContent>

        {/* ---------- Pipeline ---------- */}
        <TabsContent value="pipeline">
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold">
                  Processing timeline
                </h3>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  Total 12m 00s · attempt 1 of 3
                </p>
              </div>
              <Button variant="outline" size="sm">
                <RotateCw className="size-3.5" /> Retry failed step
              </Button>
            </div>

            <ol className="relative space-y-1">
              <span className="absolute left-[15px] top-3 h-[calc(100%-24px)] w-px bg-border" />
              {pipelineSteps.map((s) => (
                <li key={s.name} className="relative flex gap-4 py-3">
                  <span className="relative z-10 mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-primary/35 bg-primary/10">
                    <Check className="size-3.5 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {(s.ms / 1000).toFixed(1)}s
                      </p>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {s.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </TabsContent>

        {/* ---------- Transcript ---------- */}
        <TabsContent value="transcript">
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <Card className="divide-y divide-[var(--glass-border)]">
              {transcriptChunks.map((c) => (
                <button
                  key={c.id}
                  className="flex w-full gap-4 p-4 text-left transition-colors hover:bg-accent/50"
                >
                  <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-primary/25 bg-primary/8 px-1.5 font-mono text-[11px] text-primary">
                    <FastForward className="size-3" />
                    {formatDuration(c.start)}
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {c.text}
                  </span>
                </button>
              ))}
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="mb-4 font-display text-sm font-semibold">Index</h3>
                <dl className="space-y-3 text-sm">
                  {[
                    ['Model', 'whisper-large-v3'],
                    ['Language', 'English'],
                    ['Words', '6,142'],
                    ['Segments', '412'],
                    ['Chunks', '41'],
                    ['Overlap', '15s'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-mono text-xs">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 font-display text-sm font-semibold">Export</h3>
                <div className="flex flex-wrap gap-2">
                  {['VTT', 'SRT', 'TXT', 'JSON'].map((f) => (
                    <Button key={f} variant="outline" size="sm">
                      {f}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ---------- Embed ---------- */}
        <TabsContent value="embed">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <Card className="p-5">
                <h3 className="mb-4 font-display text-base font-semibold">
                  Embed code
                </h3>
                <pre className="overflow-x-auto rounded-lg border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] p-4 font-mono text-[12px] leading-relaxed text-muted-foreground">
                  <code>{embedCode}</code>
                </pre>
                <Button
                  className="mt-4"
                  onClick={() => navigator.clipboard?.writeText(embedCode)}
                >
                  <Copy className="size-4" /> Copy embed code
                </Button>
              </Card>

              <Card className="p-5">
                <h3 className="mb-2 font-display text-base font-semibold">
                  WordPress shortcode
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Install the ORYN plugin, then paste this into any post.
                </p>
                <CopyField value={`[oryn video="${video.id}"]`} />
              </Card>
            </div>

            <div className="space-y-5">
              <Card className="p-5">
                <h3 className="mb-4 font-display text-sm font-semibold">Options</h3>
                <div className="space-y-4">
                  {[
                    ['Autoplay (muted)', false],
                    ['Show Ask AI drawer', true],
                    ['Show quality selector', true],
                    ['Loop', false],
                  ].map(([label, on]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <Switch defaultChecked={on} />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold">
                    Allowed domains
                  </h3>
                  <Badge variant="mono">{domains.length}</Badge>
                </div>
                <ul className="space-y-2">
                  {domains.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] px-2.5 py-1.5"
                    >
                      <code className="truncate font-mono text-[11px]">
                        {d.domain}
                      </code>
                      <button
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        aria-label={`Remove ${d.domain}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <Input placeholder="academy.com" className="h-9 text-xs" />
                  <Button size="icon" variant="outline" aria-label="Add domain">
                    <Plus className="size-4" />
                  </Button>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Playback is blocked anywhere else, enforced by both a referer
                  check and a frame-ancestors policy.
                </p>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
